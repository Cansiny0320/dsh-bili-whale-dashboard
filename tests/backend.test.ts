import { it, expect, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createDemo } from "../packages/core/src/demo.js";
import { DashboardBackend, originalApi } from "../packages/core/src/backend.js";
import { Files } from "../packages/core/src/files.js";
const dirs: string[] = [];
const demo = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "whale-test-"));
  dirs.push(dir);
  return createDemo(dir);
};
afterEach(() => {
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});
it("preserves unknown settings and rejects stale versions", async () => {
  const b = demo();
  const raw = JSON.parse(b.files.read("config").text);
  raw.future = { keep: true };
  b.files.write("config", JSON.stringify(raw));
  const s = await b.snapshot();
  await b.saveSettings({
    version: s.settings.version,
    patch: { aliases: ["新的称呼"] },
    acknowledgeDefaults: false,
  });
  expect(JSON.parse(b.files.read("config").text).future).toEqual({ keep: true });
  await expect(
    b.saveSettings({
      version: s.settings.version,
      patch: { aliases: [] },
      acknowledgeDefaults: false,
    }),
  ).rejects.toThrow("变化");
});
it("blocks schedule writes when the legacy override is present", async () => {
  const b = demo();
  b.files.write("legacy", JSON.stringify({ maxVideos: 2 }));
  const s = await b.snapshot();
  await expect(
    b.saveSettings({
      version: s.settings.version,
      patch: { night: s.settings.config.night },
      acknowledgeDefaults: true,
    }),
  ).rejects.toThrow("覆盖");
});
it("reads an empty schedule but explains the upstream save requirement", async () => {
  const b = demo();
  const raw = JSON.parse(b.files.read("config").text);
  raw.night.windows = [];
  b.files.write("config", JSON.stringify(raw));
  const s = await b.snapshot();
  expect(s.settings.config.night.windows).toEqual([]);
  await expect(
    b.saveSettings({
      version: s.settings.version,
      patch: { aliases: [] },
      acknowledgeDefaults: false,
    }),
  ).rejects.toThrow("至少一个作息窗口");
});
it("requires explicit acknowledgment of conflicting implicit defaults", async () => {
  const b = demo();
  b.files.write("config", "{}");
  const s = await b.snapshot();
  await expect(
    b.saveSettings({
      version: s.settings.version,
      patch: { aliases: [] },
      acknowledgeDefaults: false,
    }),
  ).rejects.toThrow("默认值");
});
it("never dispatches twice after an unknown result, including a restored ID", async () => {
  const b = demo();
  let sends = 0;
  const live = new DashboardBackend(
    b.files,
    async (e, body, req) => {
      if (e === "pending/approve") {
        sends++;
        throw new Error("timeout");
      }
      return b.api(e, body, req);
    },
    "live",
  );
  const draft = (await live.snapshot()).reviews[0]!;
  const input = {
    id: draft.id,
    version: draft.version,
    action: "approve" as const,
    requestId: randomUUID(),
  };
  expect((await live.review(input)).status).toBe("unknown");
  expect((await live.review(input)).status).toBe("unknown");
  const pending = JSON.parse(b.files.read("pending").text);
  pending.items[0].id = "restored";
  b.files.write("pending", JSON.stringify(pending));
  const restored = (await live.snapshot()).reviews[0]!;
  expect(restored.blocked).toBe(true);
  await expect(
    live.review({ ...input, id: restored.id, version: restored.version, requestId: randomUUID() }),
  ).rejects.toThrow("重复");
  expect(sends).toBe(1);
});
it("simulates approval and persists it across backend instances", async () => {
  const b = demo();
  const d = (await b.snapshot()).reviews[0]!;
  const result = await b.review({
    id: d.id,
    version: d.version,
    action: "approve",
    requestId: randomUUID(),
  });
  expect(result.status).toBe("sent");
  expect((await b.snapshot()).reviews).toHaveLength(1);
  expect(b.operations()).toHaveLength(1);
});
it("keeps missing diaries empty and bounds arbitrary file access", async () => {
  const b = demo();
  fs.unlinkSync(b.files.paths.private!);
  expect((await b.diary("private")).exists).toBe(false);
  expect(() => b.files.read("../../secret")).toThrow();
  b.files.write("private", "a".repeat(100));
  expect(() => b.files.read("private", 20)).toThrow("限制");
});
it("refuses symlinked files", () => {
  const b = demo();
  const link = path.join(path.dirname(b.files.paths.public!), "link");
  try {
    fs.symlinkSync(path.dirname(b.files.paths.public!), link, "junction");
  } catch {
    return;
  }
  const files = new Files({ diary: path.join(link, "whale-diary.md") });
  expect(() => files.read("diary")).toThrow("符号链接");
});
it("restricts upstream to fixed loopback endpoints", async () => {
  await expect(originalApi(() => "https://example.com")("settings")).rejects.toThrow("本机");
});
it("does not present a rejected upstream read as an empty successful snapshot", async () => {
  const api = originalApi(
    () => "http://127.0.0.1:1234",
    async () => Response.json({ ok: false, error: "unavailable" }),
  );
  await expect(api("settings")).rejects.toThrow();
});
it("reports a legacy API pause and malformed statistics", async () => {
  const b = demo();
  b.files.write("legacyBan", JSON.stringify({ until: Date.now() + 60000 }));
  expect((await b.snapshot()).traffic.pausedUntil).not.toBeNull();
  b.files.write("traffic", "{");
  expect((await b.snapshot()).traffic.available).toBe(false);
});
