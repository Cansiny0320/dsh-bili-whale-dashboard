window.__ModuleLoader__.load({
  id: "dsh-bili-whale-dashboard",
  factory: (require) => {
    const { createElement: h, useEffect, useState } = require("react");
    function DashboardEntry() {
      const [status, setStatus] = useState("loading");
      const [attempt, setAttempt] = useState(0);
      useEffect(() => {
        const controller = new AbortController();
        setStatus("loading");
        fetch("/dsh-bili/api/settings", { signal: controller.signal })
          .then(async (response) => {
            if (response.status === 404) return "missing";
            if (!response.ok) return "error";
            const settings = await response.json();
            return settings && typeof settings === "object" && settings.config
              ? "ready"
              : "missing";
          })
          .then((value) => {
            if (!controller.signal.aborted) setStatus(value);
          })
          .catch(() => {
            if (!controller.signal.aborted) setStatus("error");
          });
        return () => controller.abort();
      }, [attempt]);
      const text = {
        loading: "正在检查原版养鱼插件…",
        missing: "请先在 DSH 中安装并启用 dsh-bili-whale 原版插件，再重新检查。",
        error: "暂时无法连接原版养鱼插件，请检查插件状态和 DSH 登录会话后重试。",
        ready: "查看日记、审核回复，调整人设与作息。登录与任务运行仍由原版养鱼插件负责。",
      }[status];
      return h(
        "section",
        { style: { maxWidth: 680, color: "var(--dsw-alias-label-primary)" } },
        h("h2", { style: { fontSize: 18, margin: "0 0 12px" } }, "鲸鱼娘后台"),
        h(
          "p",
          {
            role: status === "error" ? "alert" : "status",
            style: { lineHeight: 1.7, marginBottom: 16 },
          },
          text,
        ),
        status === "ready"
          ? h(
              "a",
              {
                href: "/whale-dashboard/",
                target: "_blank",
                rel: "noopener noreferrer",
                style: { color: "var(--dsw-alias-brand-primary)", fontSize: 16 },
              },
              "打开鲸鱼娘后台",
            )
          : status !== "loading" &&
              h(
                "button",
                { type: "button", onClick: () => setAttempt((value) => value + 1) },
                "重新检查",
              ),
      );
    }
    return {
      inject: ["slots"],
      apply(ctx) {
        ctx.effect(() =>
          ctx.slots.inject("settings.section", () =>
            ctx.slots.register(
              {
                name: "settings.section",
                id: "bili-whale-dashboard",
                order: 7,
                label: () => "鲸鱼娘后台",
              },
              DashboardEntry,
            ),
          ),
        );
      },
    };
  },
});
