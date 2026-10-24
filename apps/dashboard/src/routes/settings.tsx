import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Send, UserRound, History, Check, Minus } from "lucide-react";
import { useDashboard } from "../components/shell";
import { Panel, Field, NumberField, Toggle, SaveButton, useConfigForm } from "../components/shared";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
export const Route = createFileRoute("/settings")({ component: Settings });
const tabs = [
  { id: "share", label: "分享与推送", icon: Send },
  { id: "risk", label: "请求保护", icon: ShieldCheck },
  { id: "account", label: "账号与环境", icon: UserRound },
  { id: "session", label: "会话", icon: History },
] as const;
function Settings() {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("share");
  const { snapshot: s } = useDashboard();
  const f = useConfigForm();
  const c = f.config;
  return (
    <>
      <div className="settings-tabs" role="tablist" aria-label="设置分组">
        {tabs.map((t) => (
          <button role="tab" aria-selected={tab === t.id} key={t.id} onClick={() => setTab(t.id)}>
            <t.icon size={17} />
            {t.label}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void f.save(
            tab === "share"
              ? { quota: c.quota, share: c.share, diary: c.diary, notify: c.notify }
              : tab === "risk"
                ? { risk: c.risk }
                : tab === "account"
                  ? { owner: c.owner }
                  : {
                      sessionRotateDays: c.sessionRotateDays,
                      personaOncePerSession: c.personaOncePerSession,
                    },
          );
        }}
      >
        {f.controls}
        {tab === "share" && (
          <>
            <Panel title="分享喜欢的内容" description="分享遵循评分、去重及沉默衰减规则。">
              <Toggle
                label="允许主动分享"
                value={c.share.enabled}
                onChange={(v) => f.set("share", { ...c.share, enabled: v })}
              />
              <div className="form-grid three">
                <NumberField
                  label="每日分享额度"
                  min={0}
                  max={20}
                  value={c.quota.shareDaily}
                  onChange={(v) => f.set("quota", { ...c.quota, shareDaily: v })}
                />
                <NumberField
                  label="最低评分（满分 20）"
                  min={0}
                  max={20}
                  value={c.share.minScore}
                  onChange={(v) => f.set("share", { ...c.share, minScore: v })}
                />
                <NumberField
                  label="无反馈几天后开始衰减"
                  min={0}
                  max={365}
                  value={c.share.silentAfterDays}
                  onChange={(v) => f.set("share", { ...c.share, silentAfterDays: v })}
                />
              </div>
              <Field label="分享通道">
                <select
                  value={c.share.via}
                  onChange={(e) =>
                    f.set("share", { ...c.share, via: e.target.value as typeof c.share.via })
                  }
                >
                  <option value="comment">评论</option>
                  <option value="dm">私信</option>
                </select>
              </Field>
              <Toggle
                label="检查评论区 AI 浓度"
                hint="仅对评论分享生效；检测比例达到 30% 时暂停分享。"
                value={c.share.aiCommentGuard}
                onChange={(v) => f.set("share", { ...c.share, aiCommentGuard: v })}
              />
              <p className="field-note">
                当前有效额度 {s?.overview.quotaAvailable ? s.overview.shareCap : "未确认"}{" "}
                条；连续无反馈 {s?.overview.quotaAvailable ? s.overview.silenceDays : "未确认"}{" "}
                天。原版停止阈值为第{" "}
                {Math.max(c.share.silentAfterDays + 1, c.share.silentStopDays ?? 7)} 天。
              </p>
            </Panel>
            <Panel title="日记摘要与通知">
              <Toggle
                label="推送日记摘要"
                hint="两本日记仍由原版照常记录"
                value={c.diary.push}
                onChange={(v) => f.set("diary", { ...c.diary, push: v })}
              />
              <Field label="通知方式">
                <select
                  value={c.notify.type}
                  onChange={(e) =>
                    f.set("notify", { ...c.notify, type: e.target.value as typeof c.notify.type })
                  }
                >
                  <option value="none">关闭通知</option>
                  <option value="desktop">桌面通知</option>
                  <option value="webhook">Webhook</option>
                  <option value="command">本机命令</option>
                  <option value="dm">B 站私信</option>
                  <option value="stdout">标准输出</option>
                  <option value="file">文件</option>
                </select>
              </Field>
              {c.notify.type === "webhook" && (
                <>
                  <Field label="Webhook 地址">
                    <Input
                      type="url"
                      value={c.notify.url}
                      onChange={(e) => f.set("notify", { ...c.notify, url: e.target.value })}
                    />
                  </Field>
                  <Field label="消息格式">
                    <select
                      value={c.notify.template}
                      onChange={(e) =>
                        f.set("notify", {
                          ...c.notify,
                          template: e.target.value as "text" | "markdown",
                        })
                      }
                    >
                      <option value="text">纯文本</option>
                      <option value="markdown">Markdown</option>
                    </select>
                  </Field>
                </>
              )}
              {c.notify.type === "command" && (
                <>
                  <Field label="命令路径" hint="后续通知会由原版执行此命令">
                    <Input
                      value={c.notify.cmd}
                      onChange={(e) => f.set("notify", { ...c.notify, cmd: e.target.value })}
                    />
                  </Field>
                  <Field label="参数（每行一项）">
                    <Textarea
                      value={(c.notify.args ?? []).join("\n")}
                      onChange={(e) =>
                        f.set("notify", { ...c.notify, args: e.target.value.split("\n") })
                      }
                    />
                  </Field>
                </>
              )}
              {c.notify.type === "file" && (
                <Field label="输出文件路径">
                  <Input
                    required
                    value={c.notify.path ?? ""}
                    onChange={(e) => f.set("notify", { ...c.notify, path: e.target.value })}
                  />
                </Field>
              )}
              <p className="field-note">保存通知配置不会触发测试通知。</p>
            </Panel>
          </>
        )}
        {tab === "risk" && (
          <>
            <div className="protection-summary">
              <ShieldCheck size={25} />
              <div>
                <strong>
                  {!s?.traffic.available
                    ? "请求记录无法读取"
                    : s.traffic.pausedUntil
                      ? "请求正在暂停"
                      : s?.traffic.manualAccounts
                        ? "有账号需要人工处理"
                        : "请求记录"}
                </strong>
                {s?.traffic.available && (
                  <p>
                    所有本地账号合计：今日读取 {s?.traffic.readDay}，写入 {s?.traffic.writeDay}
                    ；本小时读取 {s?.traffic.readHour}，写入 {s?.traffic.writeHour}。
                  </p>
                )}
                {s?.traffic.pausedUntil && (
                  <p>
                    暂停至 {new Date(s.traffic.pausedUntil).toLocaleString()} · {s.traffic.reason}
                  </p>
                )}
                {s?.traffic.available && (
                  <p>
                    人工处理账号 {s?.traffic.manualAccounts} 个 · 待核查操作 {s?.traffic.uncertain}{" "}
                    个
                  </p>
                )}
              </div>
            </div>
            <Panel
              title="请求预算与间隔"
              description="达到预算或遇到平台限制时，原版会拦截后续请求。"
            >
              <div className="form-grid">
                {(
                  [
                    { key: "readHourly", label: "每小时读取上限", min: 1 },
                    { key: "readDaily", label: "每日读取上限", min: 1 },
                    { key: "writeHourly", label: "每小时写入上限", min: 1 },
                    { key: "writeDaily", label: "每日写入上限", min: 1 },
                    { key: "minGapMs", label: "请求最短间隔（毫秒）", min: 500 },
                    { key: "writeGapSec", label: "写入最短间隔（秒）", min: 30 },
                    { key: "dmGapSec", label: "私信最短间隔（秒）", min: 0 },
                  ] as const
                ).map((i) => (
                  <NumberField
                    key={i.key}
                    label={i.label}
                    min={i.min}
                    value={c.risk[i.key]}
                    onChange={(v) => f.set("risk", { ...c.risk, [i.key]: v })}
                  />
                ))}
              </div>
            </Panel>
          </>
        )}
        {tab === "account" && (
          <>
            <Panel title="主人账号" description="用于原版识别主人，不用于登录。">
              <div className="form-grid">
                <Field label="主人 UID">
                  <Input
                    inputMode="numeric"
                    value={c.owner.mid}
                    onChange={(e) => f.set("owner", { ...c.owner, mid: e.target.value })}
                  />
                </Field>
                <Field label="主人昵称">
                  <Input
                    value={c.owner.name}
                    onChange={(e) => f.set("owner", { ...c.owner, name: e.target.value })}
                  />
                </Field>
              </div>
            </Panel>
            <Panel
              title="本地账号环境"
              description="这里只显示本地缓存和凭据存在性；不验证在线登录状态。"
            >
              <dl className="details">
                <div>
                  <dt>她的账号</dt>
                  <dd>
                    {c.self.name || "未记录昵称"} · UID {c.self.mid || "未记录"}
                  </dd>
                </div>
                {(["present", "hasSess", "hasJct", "hasBuvid"] as const).map((k, i) => (
                  <div key={k}>
                    <dt>{["凭据文件", "会话凭据", "CSRF 凭据", "设备标识"][i]}</dt>
                    <dd>
                      {s?.settings.credentials[k] ? (
                        <>
                          <Check size={15} />
                          已存在
                        </>
                      ) : (
                        <>
                          <Minus size={15} />
                          未检测到
                        </>
                      )}
                    </dd>
                  </div>
                ))}
                <div>
                  <dt>登录状态</dt>
                  <dd>未进行在线验证</dd>
                </div>
              </dl>
            </Panel>
            <Panel title="运行环境">
              <dl className="details">
                <div>
                  <dt>Node</dt>
                  <dd>{s?.environment.node}</dd>
                </div>
                <div>
                  <dt>适配原版</dt>
                  <dd>{s?.environment.pluginVersion}</dd>
                </div>
                <div>
                  <dt>DSH 数据目录</dt>
                  <dd>{s?.environment.dshHome}</dd>
                </div>
                <div>
                  <dt>配置文件</dt>
                  <dd>{s?.environment.configPath}</dd>
                </div>
                <div>
                  <dt>调度状态</dt>
                  <dd>{s?.environment.connection}</dd>
                </div>
              </dl>
            </Panel>
          </>
        )}
        {tab === "session" && (
          <Panel title="会话习惯">
            <NumberField
              label="会话轮换周期（天）"
              hint="0 表示不按天自动轮换；上限 365 天。"
              value={c.sessionRotateDays}
              min={0}
              max={365}
              onChange={(v) => f.set("sessionRotateDays", v)}
            />
            <Toggle
              label="每个会话只注入一次人设"
              value={c.personaOncePerSession}
              onChange={(v) => f.set("personaOncePerSession", v)}
            />
          </Panel>
        )}
        <div className="form-footer bottom-save">
          <span>仅保存当前分组</span>
          <SaveButton busy={f.busy} />
        </div>
      </form>
    </>
  );
}
