import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const tsc = path.join(root, "node_modules/typescript/bin/tsc");
const vp = path.join(root, "node_modules/vite-plus/bin/vp");
function run(entry, args, cwd = root) {
  const result = spawnSync(process.execPath, [entry, ...args], {
    cwd,
    stdio: "inherit",
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
const mode = process.argv[2];
run(tsc, ["-b", "packages/core", "packages/dsh-plugin"]);
if (mode === "build") run(vp, ["build"], path.join(root, "apps/dashboard"));
else if (mode === "check") {
  run(tsc, ["--noEmit", "-p", "apps/dashboard"]);
  run(vp, ["lint", "apps", "packages", "scripts", "tests"]);
  run(vp, [
    "fmt",
    "--check",
    "apps",
    "packages",
    "scripts",
    "tests",
    "docs",
    "package.json",
    "pnpm-workspace.yaml",
    "tsconfig.json",
    "vite.config.ts",
    "playwright.config.ts",
    "README.md",
    "THIRD-PARTY-NOTICES.md",
    "cordis.patch.yml",
  ]);
} else throw new Error("Expected build or check");
