import path from "node:path";
import { defaults, merge, object } from "./defaults.js";
import {
  assessSettings,
  effectiveQuota,
  fingerprint,
  parseEvents,
  trafficSummary,
  version,
} from "./domain.js";
import { Files } from "./files.js";
import {
  configSchema,
  editableKeys,
  personaSaveSchema,
  reviewInputSchema,
  saveSchema,
} from "./schema.js";
import type {
  Backend,
  Draft,
  Issue,
  JsonObject,
  Operation,
  ReviewInput,
  SaveInput,
  Snapshot,
} from "./schema.js";

export type Endpoint = "settings" | "persona" | "pending" | "pending/approve" | "pending/reject";
export type OriginalApi = (
  endpoint: Endpoint,
  body?: unknown,
  request?: Request,
) => Promise<JsonObject>;
export class DashboardBackend implements Backend {
  constructor(
    readonly files: Files,
    readonly api: OriginalApi,
    readonly mode: "demo" | "live",
  ) {}
  operations(): Operation[] {
    const value = this.files.json("operations");
    if (value !== null && !Array.isArray(value)) throw new Error("审批记录损坏，停止操作");
    return (value ?? []) as Operation[];
  }
  async settings(request?: Request) {
    const payload = await this.api("settings", undefined, request);
    const raw = object(this.files.json("config"));
    const legacy = this.files.json("legacy");
    const source = object(payload.config);
    const safe = Object.fromEntries(
      [...editableKeys, "self"].map((k) => [k, source[k] ?? defaults[k]]),
    );
    const config = configSchema.parse(merge(defaults, safe));
    return {
      config,
      version: version([raw, legacy, source]),
      issues: assessSettings(raw, legacy),
      credentials: {
        present: !!object(payload.credentials).present,
        hasSess: !!object(payload.credentials).hasSess,
        hasJct: !!object(payload.credentials).hasJct,
        hasBuvid: !!object(payload.credentials).hasBuvid,
      },
    };
  }
  async drafts(request?: Request): Promise<Draft[]> {
    const pending = await this.api("pending", undefined, request);
    const operations = this.operations();
    return (Array.isArray(pending.items) ? pending.items : []).map((value) => {
      const d = object(value);
      const str = (key: string) => String(d[key] ?? "");
      return {
        id: str("id"),
        at: str("at"),
        oid: str("oid"),
        root: str("root"),
        parent: str("parent"),
        bvid: str("bvid"),
        who: str("who"),
        src: str("src"),
        message: str("message"),
        version: version(d),
        blocked: operations.some(
          (op) =>
            op.action === "approve" && op.fingerprint === fingerprint(d) && op.status !== "failed",
        ),
      };
    });
  }
  async snapshot(request?: Request): Promise<Snapshot> {
    const [settings, persona, reviews] = await Promise.all([
      this.settings(request),
      this.api("persona", undefined, request),
      this.drafts(request),
    ]);
    const diagnostics: Issue[] = [];
    const read = (key: string) => {
      try {
        return object(this.files.json(key));
      } catch {
        diagnostics.push({ code: `READ_${key}`, message: `${key} 文件无法解析，相关统计未确认` });
        return {};
      }
    };
    let events: Snapshot["events"] = [];
    try {
      const parsed = parseEvents(this.files.read("events").text);
      events = parsed.items;
      if (parsed.corruptLines)
        diagnostics.push({
          code: "EVENT_LINES",
          message: `跳过 ${parsed.corruptLines} 条未完成或损坏的事件`,
        });
    } catch {
      diagnostics.push({ code: "EVENT_READ", message: "事件记录暂不可读取" });
    }
    const plan = read("plan");
    const diary = await this.diary("public");
    const quota = read("quota"),
      feedback = read("feedback"),
      traffic = trafficSummary(read("traffic")),
      legacyBan = read("legacyBan");
    traffic.available = !diagnostics.some((i) =>
      ["READ_traffic", "READ_legacyBan"].includes(i.code),
    );
    if (
      Number(legacyBan.until) > Date.now() &&
      Number(legacyBan.until) > (traffic.pausedUntil ?? 0)
    ) {
      traffic.pausedUntil = Number(legacyBan.until);
      traffic.reason = "原版接口风控等待尚未结束";
    }
    return {
      mode: this.mode,
      updatedAt: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      settings,
      persona: { text: String(persona.text ?? ""), version: version(String(persona.text ?? "")) },
      reviews,
      operations: this.operations().slice(-100).reverse(),
      events,
      overview: {
        quotaAvailable: !diagnostics.some((i) => ["READ_quota", "READ_feedback"].includes(i.code)),
        ...effectiveQuota(settings.config, quota, feedback),
        plan:
          typeof plan.action === "string"
            ? {
                action: plan.action,
                at: typeof plan.atText === "string" ? plan.atText : null,
                window: typeof plan.window === "string" ? plan.window : null,
                wakes: Number(plan.wakes) || 0,
                date: typeof plan.date === "string" ? plan.date : null,
              }
            : null,
        publicExcerpt: diary.text.slice(-800),
      },
      traffic,
      environment: {
        node: process.version,
        dshHome: path.dirname(this.files.paths.public!),
        configPath: this.files.paths.config!,
        pluginVersion: "0.4.6（适配基线）",
        connection: "原版调度运行状态未确认",
        diagnostics,
      },
    };
  }
  async diary(kind: "public" | "private") {
    if (kind !== "public" && kind !== "private") throw new Error("无效日记类型");
    return { kind, ...this.files.read(kind), filename: path.basename(this.files.paths[kind]!) };
  }
  async saveSettings(input: SaveInput, request?: Request) {
    const parsed = saveSchema.parse(input);
    await this.files.locked(async () => {
      const current = await this.settings(request);
      if (current.version !== parsed.version) throw new Error("配置已在别处变化，请刷新后重新编辑");
      if (parsed.patch.night && current.issues.some((i) => i.code === "LEGACY_SCHEDULE"))
        throw new Error("旧作息文件正在覆盖设置，本次未保存");
      if (current.issues.some((i) => i.code === "DEFAULTS_DIFFER") && !parsed.acknowledgeDefaults)
        throw new Error("请先确认监听默认值差异");
      const next = configSchema.parse(merge(current.config, parsed.patch));
      if (!next.night.windows.length)
        throw new Error("原版保存要求至少一个作息窗口；请先添加窗口，可将唤醒次数设为 0。");
      const patch: JsonObject = { ...parsed.patch };
      if (current.issues.some((i) => i.code === "DEFAULTS_DIFFER")) patch.listen = next.listen;
      const result = await this.api("settings", patch, request);
      if (result.ok !== true) throw new Error("原版未确认配置保存成功");
    });
  }
  async savePersona(input: { version: string; text: string }, request?: Request) {
    const parsed = personaSaveSchema.parse(input);
    await this.files.locked(async () => {
      const current = await this.api("persona", undefined, request);
      if (version(String(current.text ?? "")) !== parsed.version)
        throw new Error("人设已在别处变化，请刷新后重新编辑");
      const result = await this.api("persona", { text: parsed.text }, request);
      if (result.ok !== true) throw new Error("原版未确认人设保存成功");
    });
  }
  async review(input: ReviewInput, request?: Request): Promise<Operation> {
    const parsed = reviewInputSchema.parse(input);
    return this.files.locked(async () => {
      const ops = this.operations();
      const existing = ops.find((o) => o.requestId === parsed.requestId);
      if (existing) return existing;
      const draft = (await this.drafts(request)).find((d) => d.id === parsed.id);
      if (!draft || draft.version !== parsed.version)
        throw new Error("草稿已变化或离开队列，请刷新后核对");
      if (draft.blocked) throw new Error("该内容已提交或结果待核查，禁止重复发送");
      if (ops.length >= 2000) throw new Error("审批记录已满，请先核对并归档");
      const op: Operation = {
        requestId: parsed.requestId,
        fingerprint: fingerprint({ ...draft }),
        draftId: draft.id,
        action: parsed.action,
        status: "pending",
        at: new Date().toISOString(),
        who: draft.who,
        message: draft.message,
      };
      ops.push(op);
      this.files.write("operations", JSON.stringify(ops, null, 2));
      try {
        const result = await this.api(
          parsed.action === "approve" ? "pending/approve" : "pending/reject",
          { id: draft.id },
          request,
        );
        op.status =
          result.ok === true
            ? parsed.action === "approve"
              ? "sent"
              : "rejected"
            : parsed.action === "approve"
              ? "unknown"
              : "failed";
      } catch {
        op.status = "unknown";
      }
      this.files.write("operations", JSON.stringify(ops, null, 2));
      return op;
    });
  }
}
export function originalApi(origin: () => string, transport: typeof fetch = fetch): OriginalApi {
  return async (endpoint, body, request) => {
    if (!["settings", "persona", "pending", "pending/approve", "pending/reject"].includes(endpoint))
      throw new Error("接口不在允许范围");
    const base = new URL(origin());
    if (!["127.0.0.1", "localhost", "[::1]"].includes(base.hostname) || base.protocol !== "http:")
      throw new Error("原版接口必须位于本机 DSH HTTP 服务");
    const headers = new Headers({ "content-type": "application/json" });
    for (const key of ["cookie", "authorization", "origin", "referer", "sec-fetch-site"]) {
      const v = request?.headers.get(key);
      if (v) headers.set(key, v);
    }
    const response = await transport(new URL(`/dsh-bili/api/${endpoint}`, base), {
      method: body === undefined ? "GET" : "POST",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: "error",
      signal: AbortSignal.timeout(150000),
    });
    if (!response.ok) throw new Error(`原版接口返回 HTTP ${response.status}`);
    const result = object(await response.json());
    if (body === undefined && result.ok !== true) throw new Error("原版未确认读取成功");
    return result;
  };
}
