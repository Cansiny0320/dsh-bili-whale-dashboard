import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  BookOpen,
  MessageCircle,
  Heart,
  Moon,
  Settings,
  RefreshCw,
  Menu,
  X,
} from "lucide-react";
import type { Snapshot } from "@whale/core/schema";
import { api } from "../lib/api";
import { Button } from "./ui/button";
const nav = [
  { to: "/", label: "概览", icon: LayoutDashboard },
  { to: "/diaries", label: "日记", icon: BookOpen },
  { to: "/reviews", label: "待审回复", icon: MessageCircle },
  { to: "/persona", label: "人设与偏好", icon: Heart },
  { to: "/schedule", label: "作息与监听", icon: Moon },
  { to: "/settings", label: "设置", icon: Settings },
] as const;
const Context = createContext<{
  snapshot: Snapshot | null;
  refresh: () => Promise<Snapshot>;
} | null>(null);
export function useDashboard() {
  const c = useContext(Context);
  if (!c) throw new Error("missing provider");
  return c;
}
export function Shell({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      const next = await api.snapshot();
      setSnapshot(next);
      setError("");
      return next;
    } catch (e) {
      setError(e instanceof Error ? e.message : "无法连接后台");
      throw e;
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    void refresh().catch(() => {});
  }, [refresh]);
  const current =
    nav.find((x) =>
      x.to === "/" ? pathname.replace(/\/$/, "") === "/whale-dashboard" : pathname.endsWith(x.to),
    ) ?? nav[0];
  return (
    <Context value={{ snapshot, refresh }}>
      <div className="app-shell">
        <aside className={open ? "sidebar mobile-open" : "sidebar"}>
          <Link to="/" className="brand" onClick={() => setOpen(false)}>
            {import.meta.env.VITE_HAS_LOCAL_PORTRAIT && (
              <img src="/whale-dashboard/brand/whalechan.webp" alt="鲸鱼娘" />
            )}
            <div>
              <strong>
                deepseek<span>鲸鱼娘</span>
              </strong>
            </div>
          </Link>
          <Button
            className="mobile-close"
            variant="ghost"
            aria-label="收起导航"
            onClick={() => setOpen(false)}
          >
            <X />
          </Button>
          <nav aria-label="主导航">
            {nav.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                activeProps={{ className: "nav-item active" }}
                inactiveProps={{ className: "nav-item" }}
                onClick={() => setOpen(false)}
              >
                <Icon size={19} />
                <span>{label}</span>
                {to === "/reviews" && !!snapshot?.reviews.length && (
                  <b>{snapshot.reviews.length}</b>
                )}
              </Link>
            ))}
          </nav>
        </aside>
        {open && <button className="scrim" aria-label="关闭导航" onClick={() => setOpen(false)} />}
        <div className="main-shell">
          <header className="topbar">
            <div className="page-title">
              <Button
                className="mobile-menu"
                variant="ghost"
                aria-label="展开导航"
                onClick={() => setOpen(true)}
              >
                <Menu />
              </Button>
              <h1>{current.label}</h1>
            </div>
            <div className="top-actions">
              {snapshot?.mode === "demo" && (
                <span className="demo-badge" title="保存仅影响本机演示目录，审批不会发送到 B 站">
                  演示数据
                </span>
              )}
              <time
                className="updated-at"
                title={snapshot?.timezone}
                dateTime={snapshot?.updatedAt}
              >
                最后更新：{snapshot ? new Date(snapshot.updatedAt).toLocaleString("sv-SE") : "—"}
              </time>
              <Button
                variant="ghost"
                size="icon"
                aria-label="刷新数据"
                disabled={busy}
                onClick={() => void refresh().catch(() => {})}
              >
                <RefreshCw size={17} className={busy ? "spin" : ""} />
              </Button>
            </div>
          </header>
          <main data-loaded={!!snapshot}>
            {error && (
              <div role="alert" className="notice error">
                <strong>暂时无法读取后台</strong>
                <p>{error}</p>
                <Button variant="outline" onClick={() => void refresh().catch(() => {})}>
                  重新连接
                </Button>
              </div>
            )}
            {snapshot ? children : !error && <div className="loading">正在加载…</div>}
          </main>
        </div>
      </div>
    </Context>
  );
}
