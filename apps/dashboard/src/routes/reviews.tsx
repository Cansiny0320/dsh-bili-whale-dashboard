import { useState, useEffect, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Send, MessageCircle, ExternalLink } from "lucide-react";
import type { Draft } from "@whale/core/schema";
import { api } from "../lib/api";
import { useDashboard } from "../components/shell";
import { Message, dateTime } from "../components/shared";
import { Button } from "../components/ui/button";
export const Route = createFileRoute("/reviews")({ component: Reviews });
function Reviews() {
  const { snapshot: s, refresh } = useDashboard();
  const [confirm, setConfirm] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (confirm) dialog.current?.showModal();
  }, [confirm]);
  const act = async (d: Draft, action: "approve" | "reject") => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const op = await api.review({
        id: d.id,
        version: d.version,
        action,
        requestId: crypto.randomUUID(),
      });
      setConfirm(null);
      await refresh();
      if (op.status === "unknown")
        setError("发送结果未知，已禁止重发。请核对 B 站和原版操作记录。");
      else if (op.status === "failed") setError("原版未确认操作成功，请核对队列。");
      else
        setSuccess(
          action === "approve"
            ? s?.mode === "demo"
              ? "已模拟批准，未向 B 站发送。"
              : "原版确认已发送。"
            : "已拒绝该草稿。",
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : "审批失败");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <p className="page-notice">
        {s?.mode === "demo" ? "演示审批不会向 B 站发送评论。" : "批准后会立即发送评论。"}
      </p>
      <Message error={error} success={success} />
      <div className="review-list">
        {s?.reviews.length ? (
          s.reviews.map((d) => (
            <article className="review-card" key={d.id}>
              <div className="review-source">
                <h2>{d.who || "未记录用户名"}</h2>
                <span>原评论</span>
                <p>{d.src || "原版未保存原评论内容"}</p>
              </div>
              <div className="reply-content">
                <span>拟发送的回复</span>
                <p>{d.message}</p>
                {d.blocked && <small className="status-warning">已提交 · 待核对</small>}
              </div>
              <div className="review-context">
                <span>视频 BV 号</span>
                {/^BV[0-9A-Za-z]+$/.test(d.bvid) ? (
                  <a
                    href={`https://www.bilibili.com/video/${d.bvid}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {d.bvid}
                    <ExternalLink size={14} />
                  </a>
                ) : (
                  <p>未记录</p>
                )}
                <span>草稿时间</span>
                <time>{dateTime(d.at)}</time>
              </div>
              <div className="review-actions">
                <Button
                  variant="outline"
                  disabled={busy || d.blocked}
                  onClick={() => void act(d, "reject")}
                >
                  拒绝
                </Button>
                <Button disabled={busy || d.blocked} onClick={() => setConfirm(d)}>
                  {s.mode === "demo" ? "模拟批准" : "批准并发送"}
                </Button>
              </div>
            </article>
          ))
        ) : (
          <div className="empty panel">
            <MessageCircle size={30} />
            <h2>暂时没有待审回复</h2>
            <p>她有新的想法时，会留在这里等你。</p>
          </div>
        )}
      </div>
      {!!s?.operations.length && (
        <details
          className="operations-details"
          open={s.operations.some((o) => o.status === "unknown" || o.status === "pending")}
        >
          <summary>
            审批记录
            {s.operations.some((o) => o.status === "unknown" || o.status === "pending")
              ? " · 有结果待核查"
              : ""}
          </summary>
          <div className="operation-list">
            {s.operations.slice(0, 10).map((o) => (
              <div key={o.requestId}>
                <div>
                  <strong>{o.who || o.draftId}</strong>
                  <p>{o.message.slice(0, 70)}</p>
                  <small>
                    {dateTime(o.at)} · {o.requestId.slice(0, 8)}
                  </small>
                </div>
                <span
                  className={
                    o.status === "unknown" || o.status === "pending"
                      ? "status-warning"
                      : "status-neutral"
                  }
                >
                  {
                    {
                      sent: s.mode === "demo" ? "模拟发送" : "已发送",
                      rejected: "已拒绝",
                      pending: "待核查",
                      unknown: "结果未知",
                      failed: "操作失败",
                    }[o.status]
                  }
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
      {confirm && (
        <dialog
          ref={dialog}
          aria-labelledby="confirm-title"
          className="modal"
          onCancel={(event) => {
            event.preventDefault();
            if (!busy) setConfirm(null);
          }}
        >
          <span className="modal-icon">
            <Send />
          </span>
          <h2 id="confirm-title">
            {s?.mode === "demo" ? "模拟批准这条回复？" : "发送这条评论回复？"}
          </h2>
          <p>
            {s?.mode === "demo"
              ? "只会更新本机演示队列。"
              : "批准后，原版将使用已配置的 B 站账号发送。"}
          </p>
          <blockquote>{confirm.message}</blockquote>
          <div className="modal-actions">
            <Button variant="outline" disabled={busy} onClick={() => setConfirm(null)}>
              再看一看
            </Button>
            <Button disabled={busy} onClick={() => void act(confirm, "approve")}>
              {busy ? "正在提交…" : "确认批准"}
            </Button>
          </div>
        </dialog>
      )}
    </>
  );
}
