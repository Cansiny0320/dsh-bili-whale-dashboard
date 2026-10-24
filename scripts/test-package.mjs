import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const archive = path.resolve(
  process.argv[2] ?? path.join(root, `outputs/releases/${source.name}-${source.version}.tgz`),
);
assert(fs.existsSync(archive), "Build a release tarball before running test:package");
const expectedHash = fs.readFileSync(path.join(path.dirname(archive), "SHA256SUMS"), "utf8").trim();
assert.equal(
  expectedHash,
  `${createHash("sha256").update(fs.readFileSync(archive)).digest("hex")}  ${path.basename(archive)}`,
);
const list = spawnSync("tar", ["-tzf", archive], { encoding: "utf8" });
assert.equal(list.status, 0, list.stderr);
const files = list.stdout.trim().split(/\r?\n/);
assert(files.every((file) => file.startsWith("package/") && !file.split("/").includes("..")));
assert(
  files.every(
    (file) =>
      !/(?:^|\/)(?:node_modules|\.local|\.tools|outputs|tests|src)(?:\/|$)|credentials|whalechan|\.map$|\.env/i.test(
        file,
      ),
  ),
  "Release contains source, private data or an unexpected runtime dependency tree",
);
const isolated = fs.mkdtempSync(path.join(os.tmpdir(), "whale-release-smoke-"));
const extracted = spawnSync("tar", ["-xzf", archive, "-C", isolated], { encoding: "utf8" });
assert.equal(extracted.status, 0, extracted.stderr);
const packageDir = path.join(isolated, "package");
const manifest = JSON.parse(fs.readFileSync(path.join(packageDir, "package.json"), "utf8"));
assert.equal(manifest.name, source.name);
assert.equal(manifest.version, source.version);
assert.deepEqual(manifest.dependencies ?? {}, {});
assert.deepEqual(manifest.devDependencies ?? {}, {});
assert.deepEqual(manifest.scripts ?? {}, {});
assert(!JSON.stringify(manifest).includes("workspace:"));
for (const entry of [manifest.main, manifest.exports["./client"], manifest.dsh.bundle.patch])
  assert(fs.existsSync(path.join(packageDir, entry)), "Missing entry " + entry);
assert(fs.existsSync(path.join(packageDir, "LICENSE")));
assert(fs.existsSync(path.join(packageDir, "licenses/DEPENDENCIES.json")));
for (const file of files.filter((file) => /\.(?:js|json)$/.test(file))) {
  const text = fs.readFileSync(path.join(isolated, file), "utf8");
  for (const absolute of [root, root.replaceAll("\\", "/"), root.replaceAll("\\", "\\\\")])
    assert(!text.includes(absolute), "Developer checkout path leaked into " + file);
}
// An independent child outside the checkout must resolve and render using only the tarball.
const probe = String.raw`
  import assert from 'node:assert/strict';
  import { createServer } from 'node:http';
  import { pathToFileURL } from 'node:url';
  import path from 'node:path';
  const { mount } = await import(pathToFileURL(path.resolve(${JSON.stringify(manifest.main)})));
  let handler;
  const server = createServer((req,res) => handler(req,res));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const dispose = mount({
    webServer: { getOrigin: () => origin, register: route => { handler = route.handler; return () => {}; } },
    connection: { requestRejection: () => undefined },
    effect: () => {}
  }, { backend: {} });
  try {
    for (const route of ['', 'diaries', 'reviews', 'persona', 'schedule', 'settings']) {
      const response = await fetch(origin + '/whale-dashboard/' + route);
      assert.equal(response.status, 200, route);
      const html = await response.text();
      assert(html.includes('<html'), route + ' rendered HTML');
      assert(!html.includes('whalechan.webp'), 'Private portrait must be excluded');
      const assets = [...html.matchAll(/(?:src|href)="(\/whale-dashboard\/assets\/[^"?]+)[^"]*"/g)];
      assert(assets.length > 0, 'Expected bundled browser assets');
      for (const [,asset] of assets) assert.equal((await fetch(origin + asset)).status, 200, asset);
    }
    console.log('PASS isolated package import, six SSR routes and browser assets');
  } finally { dispose(); await new Promise(resolve => server.close(resolve)); }
`;
const result = spawnSync(process.execPath, ["--input-type=module", "-e", probe], {
  cwd: packageDir,
  env: { ...process.env, NODE_PATH: "", NODE_OPTIONS: "" },
  encoding: "utf8",
  timeout: 60000,
});
assert.equal(result.status, 0, result.stdout + result.stderr);
console.log(result.stdout.trim());
console.log(`PASS release manifest and ${files.length} packaged files; no install/build scripts`);
