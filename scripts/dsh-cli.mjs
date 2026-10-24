import { runCli } from "../.tools/dsh/node_modules/@deepseek-ai/dsh/lib/bin.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
await runCli(process.argv.slice(2), {
  packageManager: {
    command: process.execPath,
    args: [path.join(root, ".tools/pnpm/bin/pnpm.mjs")],
  },
});
