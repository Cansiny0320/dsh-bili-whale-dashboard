import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

export const root = fileURLToPath(new URL("../", import.meta.url));
export const userDir = path.join(root, ".local/dsh-user");
export const dshHome = path.join(userDir, ".dsh");
export function startDsh(args, { userHome = userDir, extraEnv = {}, ...options } = {}) {
  fs.mkdirSync(userHome, { recursive: true });
  const childHome = path.join(userHome, ".dsh");
  const env = {
    ...process.env,
    USERPROFILE: userHome,
    HOME: userHome,
    DSH_HOME: childHome,
    AGENTS_HOME: path.join(userHome, ".agents"),
    BILI_WHALE_CONFIG: path.join(childHome, "bili-whale.config.json"),
    PATH: path.dirname(process.execPath) + path.delimiter + process.env.PATH,
    ...extraEnv,
  };
  for (const key of ["DEEPSEEK_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY"]) delete env[key];
  return spawn(process.execPath, [path.join(root, "scripts/dsh-cli.mjs"), ...args], {
    cwd: root,
    env,
    windowsHide: true,
    ...options,
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const child = startDsh(process.argv.slice(2), { stdio: ["inherit", "pipe", "pipe"] });
  // The official CLI opens its login URL itself; don't copy the launch token into logs.
  for (const stream of ["stdout", "stderr"]) {
    let pending = "";
    child[stream].on("data", (chunk) => {
      pending += chunk;
      const lines = pending.split("\n");
      pending = lines.pop();
      for (const line of lines)
        process[stream].write(line.replace(/([?&]token=)[^\s&]+/g, "$1[redacted]") + "\n");
    });
  }
  child.on("error", (error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
  child.on("exit", (code) => {
    process.exitCode = code ?? 1;
  });
  for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill());
}
