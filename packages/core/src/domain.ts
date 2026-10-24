import { createHash } from "node:crypto";
import { object } from "./defaults.js";
import type { Config, EventRecord, Issue, JsonObject, Snapshot } from "./schema.js";

export const version = (value: unknown) =>
  createHash("sha256")
    .update(typeof value === "string" ? value : JSON.stringify(value))
    .digest("hex");
export const fingerprint = (draft: JsonObject) =>
  version([draft.oid, draft.root, draft.parent, draft.message]);
export const localDay = (value: string | number | Date) =>
  new Date(value).toLocaleDateString("sv-SE");
export function assessSettings(raw: JsonObject, legacy: unknown): Issue[] {
  const issues: Issue[] = [];
  if (Object.keys(object(legacy)).length)
    issues.push({
      code: "LEGACY_SCHEDULE",
      message: "whale-night.config.json 正在覆盖作息；请在原版中核对并处理后再保存作息。",
      blocking: true,
    });
  const listen = object(raw.listen);
  if (["comment", "dm", "oncePerPerson"].some((key) => typeof listen[key] !== "boolean"))
    issues.push({
      code: "DEFAULTS_DIFFER",
      message: "原版设置页与执行脚本的监听默认值不同。保存会把当前显示的监听值写明，请先确认。",
    });
  return issues;
}
export function effectiveQuota(
  config: Config,
  quota: JsonObject,
  feedback: JsonObject,
  now = new Date(),
) {
  const log = (Array.isArray(quota.log) ? quota.log : []).map(object);
  const first = log.find((x) => x.share)?.at;
  const since = feedback.last || first;
  const silenceDays = since
    ? Math.max(0, Math.floor((now.getTime() - new Date(String(since)).getTime()) / 86400000))
    : 0;
  const after = config.share.silentAfterDays;
  const stop = Math.max(after + 1, Number(config.share.silentStopDays ?? 7));
  const configuredCap = config.quota.shareDaily;
  const silenceCap =
    silenceDays < after
      ? configuredCap
      : silenceDays >= stop
        ? 0
        : Math.max(1, Math.floor((configuredCap * (stop - silenceDays)) / (stop - after)));
  return {
    shares: log.filter((x) => x.share && localDay(String(x.at)) === localDay(now)).length,
    shareCap: Math.min(configuredCap, silenceCap),
    configuredCap,
    silenceDays: Number.isFinite(silenceDays) ? silenceDays : 0,
  };
}
export function parseEvents(text: string) {
  const items: EventRecord[] = [];
  let corruptLines = 0;
  for (const line of text.split(/\r?\n/).filter(Boolean)) {
    try {
      const x = object(JSON.parse(line));
      if (typeof x.at !== "string" || typeof x.kind !== "string") throw new Error();
      items.push({
        at: x.at,
        kind: x.kind,
        target: typeof x.target === "string" ? x.target : null,
        note: typeof x.note === "string" ? x.note : null,
      });
    } catch {
      corruptLines++;
    }
  }
  return { items: items.slice(-100).reverse(), corruptLines };
}
export function trafficSummary(raw: JsonObject, now = new Date()): Snapshot["traffic"] {
  const result: Snapshot["traffic"] = {
    available: true,
    readDay: 0,
    writeDay: 0,
    readHour: 0,
    writeHour: 0,
    pausedUntil: null,
    reason: null,
    manualAccounts: 0,
    uncertain: 0,
  };
  for (const a of Object.values(object(raw.accounts)).map(object)) {
    if (a.date === localDay(now)) {
      result.readDay += Number(a.readDay) || 0;
      result.writeDay += Number(a.writeDay) || 0;
    }
    if (now.getTime() - Number(a.hourAt) < 3600000) {
      result.readHour += Number(a.readHour) || 0;
      result.writeHour += Number(a.writeHour) || 0;
    }
  }
  result.manualAccounts = Object.values(object(raw.manual)).filter(Boolean).length;
  if (Number(raw.until) > now.getTime()) {
    result.pausedUntil = Number(raw.until);
    result.reason = String(raw.reason ?? "请求保护暂停");
  }
  result.uncertain = Object.values(object(raw.operations))
    .map(object)
    .filter((x) => x.status === "pending" || x.status === "unknown").length;
  return result;
}
