import { describe, it, expect } from "vitest";
import { defaults } from "../packages/core/src/defaults.js";
import {
  assessSettings,
  effectiveQuota,
  parseEvents,
  fingerprint,
} from "../packages/core/src/domain.js";
import { patchSchema, configSchema } from "../packages/core/src/schema.js";

describe("original plugin contracts", () => {
  it("preserves an empty original schedule as no automatic wakes", () => {
    const config = { ...defaults, night: { ...defaults.night, windows: [] } };
    expect(configSchema.parse(config).night.windows).toEqual([]);
  });
  it("detects an old schedule override and ambiguous defaults", () => {
    const result = assessSettings({}, { windows: [{ start: "22:00", end: "23:00", wakes: 1 }] });
    expect(result.map((i) => i.code)).toContain("LEGACY_SCHEDULE");
    expect(result.map((i) => i.code)).toContain("DEFAULTS_DIFFER");
  });
  it("does not warn about explicit listening values", () => {
    expect(assessSettings(defaults, null).some((i) => i.code === "DEFAULTS_DIFFER")).toBe(false);
  });
  it("computes effective sharing after silence and respects a zero cap", () => {
    const now = new Date(2026, 9, 25, 1, 0);
    const first = new Date(2026, 9, 20, 1, 0).toISOString();
    expect(effectiveQuota(defaults, { log: [{ at: first, share: true }] }, {}, now).shareCap).toBe(
      1,
    );
    expect(
      effectiveQuota(
        { ...defaults, quota: { shareDaily: 0 } },
        { log: [{ at: first, share: true }] },
        {},
        now,
      ).shareCap,
    ).toBe(0);
  });
  it("uses local calendar dates rather than UTC prefixes", () => {
    const now = new Date(2026, 9, 25, 0, 30);
    const out = effectiveQuota(
      defaults,
      {
        log: [
          { at: new Date(2026, 9, 25, 0, 15).toISOString(), share: true },
          { at: new Date(2026, 9, 24, 23, 59).toISOString(), share: true },
        ],
      },
      {},
      now,
    );
    expect(out.shares).toBe(1);
  });
  it("keeps complete JSONL events and ignores a partial trailing write", () => {
    const out = parseEvents('{"at":"2026-10-24T12:00:00Z","kind":"watch","note":"记录"}\n{"at":');
    expect(out.items).toHaveLength(1);
    expect(out.corruptLines).toBe(1);
  });
  it("fingerprints a restored draft independently of its generated ID", () => {
    expect(fingerprint({ id: "one", oid: "1", root: "2", parent: "3", message: "hello" })).toBe(
      fingerprint({ id: "two", oid: "1", root: "2", parent: "3", message: "hello" }),
    );
  });
  it("rejects unsupported settings and malformed windows", () => {
    expect(patchSchema.safeParse({ self: { mid: "1", name: "x" } }).success).toBe(false);
    expect(
      patchSchema.safeParse({
        night: { ...defaults.night, windows: [{ start: "25:00", end: "24:00", wakes: 1 }] },
      }).success,
    ).toBe(false);
  });
});
