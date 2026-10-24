import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const compile = spawnSync(
  process.execPath,
  [
    fileURLToPath(new URL("../node_modules/typescript/bin/tsc", import.meta.url)),
    "-b",
    "packages/core",
  ],
  { cwd: root, stdio: "inherit", windowsHide: true },
);
if (compile.status !== 0) process.exit(compile.status ?? 1);
const child = spawn(
  process.execPath,
  [
    fileURLToPath(new URL("../node_modules/vite-plus/bin/vp", import.meta.url)),
    "dev",
    "--host",
    "127.0.0.1",
    "--port",
    process.env.PORT || "4178",
    "--strictPort",
  ],
  {
    cwd: root + "apps/dashboard",
    stdio: "inherit",
    windowsHide: true,
    env: {
      ...process.env,
      DASHBOARD_MODE: "demo",
      DASHBOARD_DEMO_DIR: process.env.DASHBOARD_DEMO_DIR || root + ".local/demo",
    },
  },
);
child.on("exit", (code) => process.exit(code ?? 1));
