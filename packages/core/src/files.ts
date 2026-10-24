import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
const canonical = (file: string) =>
  process.platform === "win32" ? path.resolve(file).toLowerCase() : path.resolve(file);

/** Only server-created keys can be used; never accepts a browser-supplied path. */
export class Files {
  constructor(readonly paths: Record<string, string>) {}
  checked(key: string): string {
    const file = this.paths[key];
    if (!file) throw new Error("不允许访问该文件");
    const parent = path.dirname(file);
    if (fs.existsSync(parent) && canonical(fs.realpathSync(parent)) !== canonical(parent))
      throw new Error("拒绝符号链接目录");
    if (fs.existsSync(file) && canonical(fs.realpathSync(file)) !== canonical(file))
      throw new Error("拒绝符号链接文件");
    return file;
  }
  read(
    key: string,
    limit = 4 * 1024 * 1024,
  ): { text: string; exists: boolean; updatedAt: string | null } {
    const file = this.checked(key);
    try {
      const fd = fs.openSync(file, "r");
      try {
        const stat = fs.fstatSync(fd);
        if (!stat.isFile() || stat.size > limit)
          throw new Error(`${path.basename(file)} 超出读取限制`);
        return {
          text: fs.readFileSync(fd, "utf8"),
          exists: true,
          updatedAt: stat.mtime.toISOString(),
        };
      } finally {
        fs.closeSync(fd);
      }
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT")
        return { text: "", exists: false, updatedAt: null };
      throw e;
    }
  }
  json(key: string): unknown {
    const value = this.read(key);
    return value.exists ? JSON.parse(value.text) : null;
  }
  write(key: string, text: string) {
    const file = this.checked(key);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    this.checked(key);
    const temp = `${file}.${randomUUID()}.tmp`;
    try {
      fs.writeFileSync(temp, text, { encoding: "utf8", mode: 0o600, flag: "wx" });
      fs.renameSync(temp, file);
    } finally {
      if (fs.existsSync(temp)) fs.unlinkSync(temp);
    }
  }
  async locked<T>(work: () => Promise<T>): Promise<T> {
    const file = this.checked("lock");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    this.checked("lock");
    let fd: number;
    try {
      fd = fs.openSync(file, "wx", 0o600);
    } catch {
      throw new Error(
        "另一个保存或审批正在执行；如果上次进程异常结束，请核对操作记录后处理锁文件。",
      );
    }
    try {
      return await work();
    } finally {
      fs.closeSync(fd);
      fs.unlinkSync(file);
    }
  }
}
export function dataPaths(
  dshHome: string,
  biliHome: string,
  configPath = path.join(dshHome, "bili-whale.config.json"),
) {
  return {
    config: configPath,
    legacy: path.join(dshHome, "whale-night.config.json"),
    plan: path.join(dshHome, "whale-night.json"),
    public: path.join(dshHome, "whale-diary.md"),
    private: path.join(dshHome, "whale-diary-private.md"),
    events: path.join(dshHome, "whale-log.jsonl"),
    quota: path.join(biliHome, "quota.json"),
    feedback: path.join(biliHome, "feedback.json"),
    traffic: path.join(biliHome, "traffic-state.json"),
    legacyBan: path.join(biliHome, "api-ban.json"),
    persona: path.join(biliHome, "persona.md"),
    pending: path.join(biliHome, "pending-replies.json"),
    operations: path.join(dshHome, "whale-dashboard", "operations.json"),
    lock: path.join(dshHome, "whale-dashboard", "mutation.lock"),
  };
}
