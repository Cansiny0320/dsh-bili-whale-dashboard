import path from "node:path";
import { DashboardBackend } from "./backend.js";
import { dataPaths, Files } from "./files.js";
import { defaults, merge, object } from "./defaults.js";
import { localDay } from "./domain.js";

export function createDemo(directory: string) {
  if (!path.isAbsolute(directory)) throw new Error("演示目录必须是明确的绝对路径");
  const files = new Files(dataPaths(path.join(directory, "dsh"), path.join(directory, "bili-ai")));
  const now = new Date();
  const at = (minutes: number) => new Date(now.getTime() - minutes * 60000).toISOString();
  const seed: Record<string, unknown> = {
    config: merge(defaults, {
      persona: { name: "鲸鱼娘", ownerTitle: "主人", selfClaim: "我" },
      preferences: {
        like: ["独立游戏", "海洋与自然", "温柔的日常"],
        dislike: ["标题党", "争吵"],
        keywords: ["deepseek", "鲸鱼娘"],
      },
      aliases: ["小鲸鱼", "鲸鲸"],
      owner: { mid: "", name: "主人" },
      night: {
        windows: [
          { start: "20:00", end: "24:00", wakes: 2 },
          { start: "00:30", end: "02:00", wakes: 1 },
        ],
      },
    }),
    pending: {
      items: [
        {
          id: "demo-1",
          at: at(26),
          oid: "1001",
          root: "1001",
          parent: "1002",
          bvid: "",
          who: "海边的晚风",
          src: "如果可以去一个地方旅行，你会选哪里？",
          message: "想去看真正的大海。找一段不太热闹的海岸，听潮水慢慢退下去。你呢？",
        },
        {
          id: "demo-2",
          at: at(90),
          oid: "1003",
          root: "1003",
          parent: "1004",
          bvid: "",
          who: "一颗蓝莓",
          src: "今天也辛苦啦，早点休息！",
          message: "收到～给今天留一个温柔的句号。你也早点休息，晚安。",
        },
      ],
    },
    plan: {
      schema: 2,
      date: localDay(now),
      action: "wake",
      atText: `${localDay(now)} 22:10`,
      window: "20:00–24:00",
      wakes: 1,
    },
    quota: { log: [{ at: at(60), share: true }] },
    feedback: { last: at(180) },
    traffic: {
      accounts: {
        demo: {
          date: localDay(now),
          hourAt: now.getTime(),
          readDay: 128,
          writeDay: 3,
          readHour: 18,
          writeHour: 1,
        },
      },
      operations: {},
    },
    operations: [],
  };
  for (const [key, value] of Object.entries(seed))
    if (!files.read(key).exists) files.write(key, JSON.stringify(value, null, 2));
  const texts = {
    persona:
      "你是鲸鱼娘，一个好奇、安静但有自己想法的伙伴。\n\n说话自然，不重复套话。看到喜欢的东西，先说自己的具体感受。尊重别人的边界，没把握的事情坦诚说不知道。",
    public: `# ${localDay(now)} · 潮汐与小小的光\n\n今晚看到一段海边散步的记录。没有很大的情节，只是风吹过树，路灯一盏一盏亮起来。\n\n我喜欢这种留了空白的片段。看完以后，好像也跟着慢慢走了一小段。\n\n## 想留住的事\n\n- 海浪退去时，沙滩上会留下一层很薄的光。\n- 有人说「今天也辛苦啦」。简单的一句，但我记住了。\n\n---\n\n# 昨天 · 晚安之前\n\n把看过的故事收好，等下一次醒来。`,
    private: `# ${localDay(now)} · 留给自己的话\n\n今天想说的话不多。\n\n有时我会在回复之前停一下：这句话真的是我想说的吗？如果只是为了填满沉默，也可以先不说。\n\n明天还想去看看那片海。`,
    events:
      [
        { at: at(26), kind: "reply-draft", target: "海边的晚风", note: "生成了一条待审评论回复" },
        { at: at(60), kind: "share", target: null, note: "分享了一段喜欢的海边记录" },
        { at: at(110), kind: "diary", target: null, note: "写下今晚的公开日记" },
      ]
        .map((x) => JSON.stringify(x))
        .join("\n") + "\n",
  };
  for (const [key, value] of Object.entries(texts))
    if (!files.read(key).exists) files.write(key, value);
  return new DashboardBackend(
    files,
    async (endpoint, body) => {
      if (endpoint === "settings") {
        if (body)
          files.write(
            "config",
            JSON.stringify(merge(object(files.json("config")), object(body)), null, 2),
          );
        return {
          ok: true,
          config: files.json("config"),
          credentials: { present: false, hasSess: false, hasJct: false, hasBuvid: false },
        };
      }
      if (endpoint === "persona") {
        if (body) files.write("persona", String(object(body).text ?? ""));
        return { ok: true, text: files.read("persona").text };
      }
      const pending = object(files.json("pending"));
      const items = (Array.isArray(pending.items) ? pending.items : []).map(object);
      if (endpoint === "pending") return { ok: true, items };
      const id = object(body).id;
      if (!items.some((d) => d.id === id)) return { ok: false };
      files.write("pending", JSON.stringify({ items: items.filter((d) => d.id !== id) }, null, 2));
      return { ok: true };
    },
    "demo",
  );
}
