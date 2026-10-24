import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import { startDsh, root, dshHome as installedHome } from "./dsh-runtime.mjs";
import { defaults } from "../packages/core/dist/defaults.js";

const profile = JSON.parse(
  fs.readFileSync(path.join(installedHome, "profiles/web/package.json"), "utf8"),
);
const original = profile.dependencies?.["dsh-bili-whale"];
assert(original?.startsWith("link:"), "Install the original local plugin before running test:dsh");
fs.mkdirSync(path.join(root, ".local/dsh-tests"), { recursive: true });
fs.mkdirSync(path.join(root, "outputs"), { recursive: true });
const userDir = fs.mkdtempSync(path.join(root, ".local/dsh-tests/run-"));
const dshHome = path.join(userDir, ".dsh");
const installed = startDsh(
  ["plugin", "--profile", "web", "add", original, "link:" + root.replaceAll("\\", "/")],
  { userHome: userDir },
);
let installLog = "";
for (const stream of [installed.stdout, installed.stderr])
  stream.on("data", (chunk) => {
    installLog += chunk;
  });
assert.equal(await new Promise((resolve) => installed.on("exit", resolve)), 0, installLog);
const biliHome = path.join(userDir, ".bili-ai");
fs.mkdirSync(biliHome, { recursive: true });
fs.mkdirSync(dshHome, { recursive: true });
assert(
  !fs.existsSync(path.join(biliHome, "credentials.json")),
  "Integration home must have no account credentials",
);
const config = structuredClone(defaults);
config.night.windows = [];
config.listen.comment = false;
config.listen.dm = false;
config.listen.live = false;
config.diary.push = false;
config.share.enabled = false;
config.persona.name = "鲸鱼娘";
fs.writeFileSync(path.join(dshHome, "bili-whale.config.json"), JSON.stringify(config));
fs.writeFileSync(
  path.join(dshHome, "whale-diary.md"),
  "# DSH 联调公开日记\n\n这是隔离测试记录。\n",
);
fs.writeFileSync(
  path.join(dshHome, "whale-diary-private.md"),
  "# DSH 联调私人日记\n\n只用于验证文件读取。\n",
);
const pendingFile = path.join(biliHome, "pending-replies.json");
fs.writeFileSync(
  pendingFile,
  JSON.stringify({
    items: [
      {
        id: "reject-fixture",
        oid: "1",
        root: "2",
        parent: "2",
        message: "隔离联调：拒绝草稿",
        at: new Date().toISOString(),
      },
      {
        id: "fail-fixture",
        oid: "1",
        root: "2",
        parent: "3",
        message: "隔离联调：无凭据发送应失败",
        at: new Date().toISOString(),
      },
    ],
  }),
);
const child = startDsh(["web", "--no-open", "--port", "3081"], { userHome: userDir });
let log = "";
let loginUrl;
for (const stream of [child.stdout, child.stderr])
  stream.on("data", (chunk) => {
    const text = chunk.toString();
    const match = text.match(/https?:\/\/127\.0\.0\.1:3081\/[^\s]*[?&]token=[^\s]+/);
    if (match) loginUrl = match[0];
    log += text.replace(/([?&]token=)[^\s&]+/g, "$1[redacted]");
  });
let browser;
try {
  const deadline = Date.now() + 90000;
  while (!loginUrl && child.exitCode === null && Date.now() < deadline)
    await new Promise((resolve) => setTimeout(resolve, 300));
  if (!loginUrl) throw new Error("DSH failed to become ready:\n" + log.slice(-14000));
  console.log("DSH host ready; launch credential kept in memory only.");
  const origin = "http://127.0.0.1:3081";
  assert.equal((await fetch(origin + "/whale-dashboard/")).status, 401);
  browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", async (response) => {
    if (response.url().includes("/whale-dashboard/") && response.status() >= 400)
      console.log(
        "HTTP",
        response.status(),
        new URL(response.url()).pathname,
        (await response.text()).slice(0, 800),
      );
  });
  await page.goto(loginUrl);
  loginUrl = undefined;
  for (const route of ["", "diaries", "reviews", "persona", "schedule", "settings"]) {
    const response = await page.goto(origin + "/whale-dashboard/" + route);
    assert.equal(response.status(), 200, "SSR route " + route);
    try {
      await page.locator('main[data-loaded="true"]').waitFor();
    } catch (error) {
      console.log(
        "PAGE",
        (await page.locator("body").innerText()).slice(0, 1800),
        "ERRORS",
        errors,
      );
      throw error;
    }
    console.log("PASS DSH page " + (route || "overview"));
  }
  await page.goto(origin + "/whale-dashboard/schedule");
  await page.getByRole("button", { name: "添加时段" }).click();
  await page.getByLabel("窗口 1 醒来次数").fill("0");
  await page.getByRole("button", { name: "保存设置", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "已保存" }).waitFor();
  await page.goto(origin + "/whale-dashboard/settings");
  await page.getByRole("tab", { name: "会话", exact: true }).click();
  await page.getByLabel("会话轮换周期（天）").fill("7");
  await page.getByRole("button", { name: "保存设置", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "已保存" }).waitFor();
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(dshHome, "bili-whale.config.json"))).sessionRotateDays,
    7,
  );
  await page.goto(origin + "/whale-dashboard/persona");
  await page.getByLabel("人设正文", { exact: true }).fill("真实 DSH 联调：保持好奇，清楚表达。");
  await page.getByRole("button", { name: "保存人设正文", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "人设正文已保存" }).waitFor();
  assert.equal(
    fs.readFileSync(path.join(biliHome, "persona.md"), "utf8"),
    "真实 DSH 联调：保持好奇，清楚表达。",
  );
  const denied = await context.request.post(origin + "/whale-dashboard/rpc/snapshot", {
    headers: { origin: "https://example.invalid" },
    data: {},
  });
  assert.equal(denied.status(), 403);
  await page.goto(origin + "/whale-dashboard/reviews");
  await page.getByRole("button", { name: "拒绝", exact: true }).first().click();
  await page.getByRole("status").filter({ hasText: "已拒绝" }).waitFor();
  assert.equal(JSON.parse(fs.readFileSync(pendingFile)).items.length, 1);
  await page.getByRole("button", { name: "批准并发送", exact: true }).click();
  await page.getByRole("button", { name: "再看一看", exact: true }).click();
  assert.equal(JSON.parse(fs.readFileSync(pendingFile)).items.length, 1);
  await page.getByRole("button", { name: "批准并发送", exact: true }).click();
  await page.getByRole("button", { name: "确认批准", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "发送结果未知" }).waitFor();
  await expect.poll(() => JSON.parse(fs.readFileSync(pendingFile)).items.length).toBe(1);
  await page.reload();
  await page.locator('main[data-loaded="true"]').waitFor();
  assert.equal(
    await page.getByRole("button", { name: "批准并发送", exact: true }).isDisabled(),
    true,
  );
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(dshHome, "whale-dashboard/operations.json"))).filter(
      (item) => item.status === "unknown",
    ).length,
    1,
  );
  assert.deepEqual(errors, []);
  await page.goto(origin + "/whale-dashboard/");
  await page.locator('main[data-loaded="true"]').waitFor();
  await page.screenshot({ path: path.join(root, "outputs/dsh-live-desktop.png"), fullPage: true });
  console.log(
    "PASS unauthenticated rejection, six SSR pages, real upstream settings/persona persistence, reject/cancel approval, missing-credential failure and duplicate-send protection, cross-origin rejection, no page errors.",
  );
} finally {
  await browser?.close();
  child.kill();
  fs.writeFileSync(path.join(root, "outputs/dsh-host.log"), log);
}
