import { z } from "zod";

const text = z.string().max(10000);
const topics = z.array(z.string().trim().min(1).max(200)).max(200);
const id = z.string().regex(/^\d*$/, "UID 只能包含数字").max(30);
const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$|^24:00$/, "请输入有效时间，例如 20:00");
export const windowSchema = z.object({
  start: time,
  end: time,
  wakes: z.number().int().min(0).max(12),
});
export const configSchema = z
  .object({
    persona: z
      .object({
        name: z.string().max(200),
        ownerTitle: z.string().max(200),
        selfClaim: z.string().max(200),
        diaryTitle: z.string().max(200).optional(),
      })
      .passthrough(),
    preferences: z
      .object({ like: topics, dislike: topics, keywords: topics.optional() })
      .passthrough(),
    aliases: topics,
    owner: z.object({ mid: id, name: z.string().max(200) }).passthrough(),
    self: z.object({ mid: id, name: z.string().max(200) }).passthrough(),
    night: z
      .object({
        windows: z.array(windowSchema).max(12),
        skipChance: z.number().min(0).max(0.95),
        minGapMin: z.number().min(1).max(1440),
        maxVideos: z.number().int().min(1).max(20),
        maxWakesPerDay: z.number().min(0).max(12).optional(),
      })
      .passthrough(),
    listen: z
      .object({
        comment: z.boolean(),
        commentIntervalSec: z.number().int().min(15).max(86400),
        scope: z.enum(["both", "reply"]),
        onlyOwner: z.boolean().optional(),
        oncePerPerson: z.boolean(),
        allDay: z.boolean(),
        dm: z.boolean(),
        dmIntervalSec: z.number().int().min(15).max(86400),
        live: z.boolean(),
        liveRoom: id,
        liveScope: z.enum(["owner", "mention"]),
      })
      .passthrough(),
    quota: z.object({ shareDaily: z.number().int().min(0).max(20) }).passthrough(),
    share: z
      .object({
        enabled: z.boolean(),
        via: z.enum(["comment", "dm"]),
        minScore: z.number().int().min(0).max(20),
        silentAfterDays: z.number().int().min(0).max(365),
        aiCommentGuard: z.boolean(),
        aiThreshold: z.number().optional(),
        silentStopDays: z.number().optional(),
      })
      .passthrough(),
    diary: z.object({ push: z.boolean(), enabled: z.boolean().optional() }).passthrough(),
    risk: z
      .object({
        minGapMs: z.number().int().min(500).max(60000),
        readHourly: z.number().int().positive().max(1000000),
        readDaily: z.number().int().positive().max(1000000),
        writeHourly: z.number().int().positive().max(1000000),
        writeDaily: z.number().int().positive().max(1000000),
        writeGapSec: z.number().int().min(30).max(86400),
        dmGapSec: z.number().int().min(0).max(86400),
      })
      .passthrough(),
    notify: z
      .object({
        type: z.enum(["none", "desktop", "webhook", "command", "dm", "stdout", "file"]),
        url: text,
        template: z.enum(["text", "markdown"]),
        cmd: text,
        args: z.array(z.string().max(2000)).max(100).optional(),
        path: text.optional(),
      })
      .passthrough(),
    sessionRotateDays: z.number().int().min(0).max(365),
    personaOncePerSession: z.boolean(),
  })
  .passthrough();

export type Config = z.infer<typeof configSchema>;
export const editableKeys = [
  "persona",
  "preferences",
  "aliases",
  "owner",
  "night",
  "listen",
  "quota",
  "share",
  "diary",
  "risk",
  "notify",
  "sessionRotateDays",
  "personaOncePerSession",
] as const;
export const patchSchema = configSchema
  .pick(
    Object.fromEntries(editableKeys.map((k) => [k, true])) as Record<
      (typeof editableKeys)[number],
      true
    >,
  )
  .partial()
  .strict();
export type ConfigPatch = z.infer<typeof patchSchema>;
export const saveSchema = z
  .object({
    version: z.string(),
    patch: patchSchema,
    acknowledgeDefaults: z.boolean().default(false),
  })
  .strict();
export type SaveInput = z.infer<typeof saveSchema>;
export const personaSaveSchema = z
  .object({ version: z.string(), text: z.string().max(20000, "人设正文最多保存 20000 字") })
  .strict();
export const reviewInputSchema = z
  .object({
    id: z.string().min(1).max(100),
    version: z.string(),
    action: z.enum(["approve", "reject"]),
    requestId: z.uuid(),
  })
  .strict();
export type ReviewInput = z.infer<typeof reviewInputSchema>;
export type JsonObject = Record<string, unknown>;
export interface Issue {
  code: string;
  message: string;
  blocking?: boolean;
}
export interface SettingsDocument {
  config: Config;
  version: string;
  issues: Issue[];
  credentials: { present: boolean; hasSess: boolean; hasJct: boolean; hasBuvid: boolean };
}
export interface Draft {
  id: string;
  at: string;
  oid: string;
  root: string;
  parent: string;
  bvid: string;
  who: string;
  src: string;
  message: string;
  version: string;
  blocked: boolean;
}
export interface Operation {
  requestId: string;
  fingerprint: string;
  draftId: string;
  action: "approve" | "reject";
  status: "pending" | "sent" | "rejected" | "failed" | "unknown";
  at: string;
  who: string;
  message: string;
}
export interface DiaryDocument {
  kind: "public" | "private";
  text: string;
  updatedAt: string | null;
  exists: boolean;
  filename: string;
}
export interface EventRecord {
  at: string;
  kind: string;
  target: string | null;
  note: string | null;
}
export interface Snapshot {
  mode: "demo" | "live";
  updatedAt: string;
  timezone: string;
  settings: SettingsDocument;
  persona: { text: string; version: string };
  reviews: Draft[];
  operations: Operation[];
  events: EventRecord[];
  overview: {
    quotaAvailable: boolean;
    shares: number;
    shareCap: number;
    configuredCap: number;
    silenceDays: number;
    plan: {
      action: string;
      at: string | null;
      window: string | null;
      wakes: number;
      date: string | null;
    } | null;
    publicExcerpt: string;
  };
  traffic: {
    available: boolean;
    readDay: number;
    writeDay: number;
    readHour: number;
    writeHour: number;
    pausedUntil: number | null;
    reason: string | null;
    manualAccounts: number;
    uncertain: number;
  };
  environment: {
    node: string;
    dshHome: string;
    configPath: string;
    pluginVersion: string;
    connection: string;
    diagnostics: Issue[];
  };
}
export interface Backend {
  snapshot(request?: Request): Promise<Snapshot>;
  diary(kind: "public" | "private"): Promise<DiaryDocument>;
  saveSettings(input: SaveInput, request?: Request): Promise<void>;
  savePersona(input: z.infer<typeof personaSaveSchema>, request?: Request): Promise<void>;
  review(input: ReviewInput, request?: Request): Promise<Operation>;
}
