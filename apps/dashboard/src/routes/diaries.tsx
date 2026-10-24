import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Info, ChevronDown } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { DiaryDocument } from "@whale/core/schema";
import { api } from "../lib/api";
import { Message } from "../components/shared";
import { Input } from "../components/ui/input";
export const Route = createFileRoute("/diaries")({ component: Diaries });
function Diaries() {
  const [kind, setKind] = useState<"public" | "private">("public");
  const [doc, setDoc] = useState<DiaryDocument | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(0);
  const [raw, setRaw] = useState(false);
  useEffect(() => {
    let active = true;
    setDoc(null);
    setError("");
    setSelected(0);
    api
      .diary({ kind })
      .then((d) => {
        if (active) setDoc(d);
      })
      .catch((e) => {
        if (active) setError(String(e.message));
      });
    return () => {
      active = false;
    };
  }, [kind]);
  const text = doc?.text ?? "";
  const sections = text.split(/^# /m.test(text) ? /(?=^# )/m : /(?=^## )/m).filter((s) => s.trim());
  const visible = sections
    .map((text, index) => {
      const heading = text.match(/^#{1,2}\s+(.+)/)?.[1] ?? "日记原文";
      const date = heading.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? "";
      return {
        text,
        index,
        date,
        title: date
          ? heading
              .slice(date.length)
              .replace(/^\s*[-·—|]\s*/, "")
              .trim() || date
          : heading,
      };
    })
    .filter((s) => s.text.toLowerCase().includes(search.toLowerCase()));
  const current = visible.find((x) => x.index === selected) ?? visible[0];
  return (
    <>
      <Message error={error} />
      <div className="diary-layout">
        <aside className="diary-index">
          <div className="diary-tabs">
            <button aria-pressed={kind === "public"} onClick={() => setKind("public")}>
              给你的日记
            </button>
            <button aria-pressed={kind === "private"} onClick={() => setKind("private")}>
              私人日记
            </button>
          </div>
          <label className="search">
            <Search size={17} />
            <Input
              aria-label="搜索日记"
              placeholder="搜索日期或标题关键词…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="diary-entries">
            {visible.map((s) => (
              <button
                key={s.index}
                className={current?.index === s.index ? "entry active" : "entry"}
                onClick={() => setSelected(s.index)}
              >
                {s.date && <time>{s.date}</time>}
                <span>{s.title}</span>
              </button>
            ))}
          </div>
        </aside>
        <article className="diary-paper">
          <details className="file-details">
            <summary>
              <Info size={15} />
              文件详情
              <ChevronDown size={15} />
            </summary>
            <div>
              <span>{doc?.filename ?? "读取中…"}</span>
              {doc?.updatedAt && (
                <small>更新于 {new Date(doc.updatedAt).toLocaleString("zh-CN")}</small>
              )}
              <label>
                <input type="checkbox" checked={raw} onChange={(e) => setRaw(e.target.checked)} />
                显示原文
              </label>
            </div>
          </details>
          {!doc ? (
            <div className="empty">{error ? "无法读取日记" : "正在读取…"}</div>
          ) : !doc.exists ? (
            <div className="empty">还没有这本日记。</div>
          ) : !current ? (
            <div className="empty">{search ? "没有找到这段文字。" : "这本日记还是空白。"}</div>
          ) : raw ? (
            <pre className="raw-diary">{current.text}</pre>
          ) : (
            <div className="markdown">
              <Markdown
                remarkPlugins={[remarkGfm]}
                skipHtml
                components={{ img: () => null, a: ({ children }) => <span>{children}</span> }}
              >
                {current.text}
              </Markdown>
            </div>
          )}
        </article>
      </div>
    </>
  );
}
