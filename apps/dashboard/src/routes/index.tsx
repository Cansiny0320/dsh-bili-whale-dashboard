import { createFileRoute } from "@tanstack/react-router";
import { Link2, Moon, Clock3, Video, MessageCircle } from "lucide-react";
import { useDashboard } from "../components/shell";
import { Panel, dateTime } from "../components/shared";
import Markdown from "react-markdown";
export const Route = createFileRoute("/")({ component: Overview });
function Overview() {
  const { snapshot: s } = useDashboard();
  if (!s) return null;
  const plan = s.overview.plan;
  const windows = s.settings.config.night.windows;
  const plannedTime = plan?.at?.match(/\d{2}:\d{2}(?::\d{2})?$/)?.[0];
  const today = new Date().toLocaleDateString("sv-SE");
  const wakeCount = Math.min(
    12,
    windows.reduce((total, w) => total + w.wakes, 0),
  );
  return (
    <>
      <div className="stats-grid">
        <section className="stat">
          <span className="stat-icon">
            <Link2 />
          </span>
          <div className="stat-body">
            <span>运行状态未确认</span>
            <strong>未确认</strong>
            <p>当前仅有本地记录，运行与登录状态尚未确认。</p>
          </div>
        </section>
        <section className="stat">
          <span className="stat-icon">
            <Moon />
          </span>
          <div className="stat-body">
            <span>{plan?.date === today ? "今日计划唤醒" : "计划唤醒记录"}</span>
            <strong>
              {plan?.action === "wake"
                ? plannedTime || "未记录"
                : plan?.action === "skip"
                  ? "计划休息"
                  : plan?.action === "done"
                    ? "本轮结束"
                    : "暂无计划"}
            </strong>
            {plan?.date && plan.date !== today && <p>{plan.date}</p>}
          </div>
        </section>
        <section className="stat">
          <span className="stat-icon">
            <Clock3 />
          </span>
          <div className="stat-body">
            <span>已配置机会</span>
            <strong>{wakeCount} 个</strong>
            <p>{windows.map((w) => `${w.start} – ${w.end}`).join("、")}</p>
          </div>
        </section>
        <section className="stat">
          <span className="stat-icon">
            <Video />
          </span>
          <div className="stat-body">
            <span>视频分享进度</span>
            <strong>
              {s.overview.quotaAvailable
                ? `${s.overview.shares} / ${s.overview.shareCap}`
                : "未确认"}
            </strong>
          </div>
        </section>
        <section className="stat">
          <span className="stat-icon">
            <MessageCircle />
          </span>
          <div className="stat-body">
            <span>待审回复</span>
            <strong>{s.reviews.length} 条</strong>
          </div>
        </section>
      </div>
      <div className="overview-grid">
        <Panel title="最近事件">
          <div className="timeline">
            {s.events.length ? (
              s.events.slice(0, 8).map((e, i) => (
                <div className="timeline-item" key={`${e.at}-${i}`}>
                  <span className={`timeline-dot event-${e.kind.replace(/[^a-z-]/g, "")}`} />
                  <time title={dateTime(e.at)}>
                    {new Date(e.at).toLocaleTimeString("zh-CN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                  <span>
                    {e.note || e.kind}
                    {e.target && <small> · {e.target}</small>}
                  </span>
                </div>
              ))
            ) : (
              <p className="empty">还没有事件记录。</p>
            )}
          </div>
        </Panel>
        <Panel title="最新公开日记">
          <div className="diary-excerpt">
            <Markdown
              skipHtml
              components={{
                img: () => null,
                a: ({ children }) => <span>{children}</span>,
                h1: ({ children }) => <h3>{children}</h3>,
                h2: ({ children }) => <h3>{children}</h3>,
              }}
            >
              {s.overview.publicExcerpt || "还没有公开日记。"}
            </Markdown>
          </div>
        </Panel>
      </div>
      {s.settings.issues
        .filter((i) => i.code === "LEGACY_SCHEDULE")
        .map((i) => (
          <div className="notice warning" key={i.code}>
            {i.message}
          </div>
        ))}
      {s.environment.diagnostics.map((i) => (
        <div className="notice warning" key={i.code}>
          {i.message}
        </div>
      ))}
    </>
  );
}
