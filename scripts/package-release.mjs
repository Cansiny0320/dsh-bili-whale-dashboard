import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { isBuiltin } from "node:module";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const manifest = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8", ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stdout + result.stderr);
  return result.stdout;
}
run(process.execPath, ["scripts/tasks.mjs", "build"], {
  env: { ...process.env, DASHBOARD_RELEASE: "1" },
  stdio: "inherit",
});
const stagingRoot = path.join(root, ".local/release-builds");
const destination = path.join(root, "outputs/releases");
fs.mkdirSync(stagingRoot, { recursive: true });
fs.mkdirSync(destination, { recursive: true });
const stage = fs.mkdtempSync(path.join(stagingRoot, "package-"));
const copyrightPackages = new Map();
function collectLicenses(inputs) {
  for (const input of Object.keys(inputs)) {
    let dir = path.dirname(path.resolve(root, input));
    while (dir !== path.dirname(dir)) {
      const packageFile = path.join(dir, "package.json");
      if (fs.existsSync(packageFile)) {
        const pkg = JSON.parse(fs.readFileSync(packageFile, "utf8"));
        if (
          pkg.name &&
          pkg.version &&
          pkg.name !== manifest.name &&
          !pkg.name.startsWith("@whale/")
        ) {
          copyrightPackages.set(pkg.name + "@" + pkg.version, { dir, pkg });
        }
        break;
      }
      dir = path.dirname(dir);
    }
  }
}
async function bundle(entry, output) {
  const result = await build({
    absWorkingDir: root,
    entryPoints: [entry],
    outfile: path.join(stage, output),
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node24",
    minify: true,
    legalComments: "linked",
    metafile: true,
    define: { "process.env.NODE_ENV": '"production"' },
    plugins: [
      {
        name: "portable-route-manifest",
        setup(builder) {
          builder.onLoad({ filter: /[\\/]_tanstack-start-manifest_.*\.js$/ }, (args) => ({
            // Start embeds build-time route source paths as diagnostic metadata.
            contents: fs
              .readFileSync(args.path, "utf8")
              .replace(
                /(\bfilePath:\s*)("(?:[^"\\]|\\.)*")/g,
                (_, field, value) =>
                  field +
                  JSON.stringify(path.relative(root, JSON.parse(value)).replaceAll("\\", "/")),
              ),
            loader: "js",
            resolveDir: path.dirname(args.path),
          }));
        },
      },
    ],
    banner: {
      js: 'import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);',
    },
  });
  for (const output of Object.values(result.metafile.outputs))
    for (const imported of output.imports)
      if (imported.external && !isBuiltin(imported.path))
        throw new Error("Unbundled runtime dependency: " + imported.path);
  collectLicenses(result.metafile.inputs);
}
await bundle("packages/dsh-plugin/dist/index.js", "packages/dsh-plugin/dist/index.js");
await bundle("apps/dashboard/dist/server/server.js", "apps/dashboard/dist/server/server.js");
fs.cpSync(
  path.join(root, "apps/dashboard/dist/client"),
  path.join(stage, "apps/dashboard/dist/client"),
  { recursive: true },
);
fs.mkdirSync(path.join(stage, "licenses"), { recursive: true });
for (const side of ["client", "server"]) {
  const license = path.join(root, `apps/dashboard/dist/${side}/.vite/license.md`);
  if (fs.existsSync(license))
    fs.copyFileSync(license, path.join(stage, `licenses/dashboard-${side}.md`));
}
const inventory = [];
for (const [id, { dir, pkg }] of [...copyrightPackages].sort()) {
  const target = path.join(stage, "licenses", id.replaceAll("/", "__"));
  fs.mkdirSync(target, { recursive: true });
  const licenseFiles = fs
    .readdirSync(dir)
    .filter(
      (file) =>
        /^(?:licen[cs]e|copying|notice)(?:[.-]|$)/i.test(file) &&
        fs.statSync(path.join(dir, file)).isFile(),
    );
  for (const file of licenseFiles) fs.copyFileSync(path.join(dir, file), path.join(target, file));
  inventory.push({
    name: pkg.name,
    version: pkg.version,
    license: pkg.license,
    files: licenseFiles.map((file) =>
      path.relative(stage, path.join(target, file)).replaceAll("\\", "/"),
    ),
  });
}
fs.writeFileSync(
  path.join(stage, "licenses/DEPENDENCIES.json"),
  JSON.stringify(inventory, null, 2) + "\n",
);
for (const file of [
  "LICENSE",
  "THIRD-PARTY-NOTICES.md",
  "cordis.patch.yml",
  "packages/dsh-plugin/client.js",
])
  fs.copyFileSync(path.join(root, file), path.join(stage, file));
fs.cpSync(path.join(root, "licenses"), path.join(stage, "licenses"), { recursive: true });
const releaseManifest = {
  name: manifest.name,
  version: manifest.version,
  description: manifest.description,
  license: manifest.license,
  repository: manifest.repository,
  type: "module",
  main: manifest.main,
  exports: manifest.exports,
  engines: { ...manifest.engines, dsh: "0.2.1-rc.2" },
  dsh: manifest.dsh,
};
fs.writeFileSync(path.join(stage, "package.json"), JSON.stringify(releaseManifest, null, 2) + "\n");
fs.writeFileSync(
  path.join(stage, "README.md"),
  `# DSH Bili Whale Dashboard ${manifest.version}\n\nPrebuilt DSH plugin. Install and enable dsh-bili-whale first, then install this tarball in DSH. Open Settings → 鲸鱼娘后台. No build step is required.\n\nUsage: https://github.com/Cansiny0320/dsh-bili-whale-dashboard#readme\n`,
);
const manager = process.env.npm_execpath;
if (!manager) throw new Error("Run this script through pnpm release:pack");
const args = ["pack", "--pack-destination", destination];
run(
  /\.(?:c|m)?js$/.test(manager) ? process.execPath : manager,
  /\.(?:c|m)?js$/.test(manager) ? [manager, ...args] : args,
  { cwd: stage },
);
const archive = path.join(destination, `${manifest.name}-${manifest.version}.tgz`);
const digest = createHash("sha256").update(fs.readFileSync(archive)).digest("hex");
fs.writeFileSync(path.join(destination, "SHA256SUMS"), `${digest}  ${path.basename(archive)}\n`);
console.log(
  `Release: ${archive}\nSHA-256: ${digest}\nBundled license records: ${inventory.length}`,
);
