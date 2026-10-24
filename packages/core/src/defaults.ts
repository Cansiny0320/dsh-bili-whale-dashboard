import type { Config, JsonObject } from "./schema.js";
// Values exposed by the v0.4.6 settings API. Raw scheduler defaults are checked separately.
export const defaults: Config = {
  persona: { name: "", ownerTitle: "你", selfClaim: "我" },
  preferences: { like: [], dislike: [] },
  aliases: [],
  owner: { mid: "", name: "" },
  self: { mid: "", name: "" },
  night: {
    windows: [{ start: "20:00", end: "24:00", wakes: 1 }],
    skipChance: 0.3,
    minGapMin: 10,
    maxVideos: 5,
  },
  listen: {
    comment: true,
    commentIntervalSec: 60,
    scope: "both",
    oncePerPerson: false,
    allDay: false,
    dm: false,
    dmIntervalSec: 60,
    live: false,
    liveRoom: "",
    liveScope: "owner",
  },
  quota: { shareDaily: 3 },
  share: {
    enabled: true,
    via: "comment",
    minScore: 13,
    silentAfterDays: 3,
    aiCommentGuard: false,
    aiThreshold: 30,
  },
  diary: { push: true, enabled: true },
  risk: {
    minGapMs: 1500,
    readHourly: 600,
    readDaily: 3000,
    writeHourly: 12,
    writeDaily: 30,
    writeGapSec: 120,
    dmGapSec: 60,
  },
  notify: { type: "none", url: "", template: "text", cmd: "", args: [], path: "" },
  sessionRotateDays: 0,
  personaOncePerSession: false,
};
export function object(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {};
}
export function merge(base: JsonObject, over: JsonObject): JsonObject {
  const result: JsonObject = { ...base };
  for (const [key, value] of Object.entries(over)) {
    if (["__proto__", "prototype", "constructor", "__hasUserFile"].includes(key)) continue;
    result[key] =
      value && typeof value === "object" && !Array.isArray(value)
        ? merge(object(base[key]), object(value))
        : value;
  }
  return result;
}
