import { it, expect, afterEach } from "vitest";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { mount } from "../packages/dsh-plugin/src/index.js";
import type { Host } from "../packages/dsh-plugin/src/index.js";
import { createDemo } from "../packages/core/src/demo.js";
const cleanup: (() => void | Promise<void>)[] = [];
afterEach(async () => {
  for (const fn of cleanup.splice(0).reverse()) await fn();
});
async function host(connection?: Host["connection"]) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "whale-host-"));
  cleanup.push(() => fs.rmSync(dir, { recursive: true, force: true }));
  const routes: Parameters<Host["webServer"]["register"]>[0][] = [];
  const server = http.createServer((req, res) => {
    const route = routes.find((r) =>
      r.kind === "exact" ? req.url === r.path : req.url?.startsWith(r.path),
    );
    if (route) void route.handler(req, res);
    else {
      res.statusCode = 404;
      res.end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  cleanup.push(() => new Promise<void>((resolve) => server.close(() => resolve())));
  const port = (server.address() as { port: number }).port;
  const origin = `http://127.0.0.1:${port}`;
  let unload = () => {};
  const dispose = mount(
    {
      connection,
      webServer: {
        getOrigin: () => origin,
        register: (route) => {
          if (route.path.endsWith("/"))
            throw new Error("DSH named routes must not have a trailing slash");
          routes.push(route);
          return () => {
            routes.splice(routes.indexOf(route), 1);
          };
        },
      },
      effect: (callback) => {
        unload = callback();
      },
    },
    { backend: createDemo(dir), render: async () => new Response("SSR shell") },
  );
  return { origin, routes, dispose, unload };
}
it("fails closed without the host authentication service", async () => {
  const h = await host();
  expect((await fetch(h.origin + "/whale-dashboard/")).status).toBe(503);
});
it("honors rejection and never registers the host fallback", async () => {
  const h = await host({ requestRejection: () => 403 });
  expect((await fetch(h.origin + "/whale-dashboard/")).status).toBe(403);
  expect(h.routes.map((r) => r.path)).toEqual(["/whale-dashboard"]);
});
it("serves SSR after host authentication and disposes only its routes", async () => {
  const h = await host({ requestRejection: () => undefined });
  expect(await (await fetch(h.origin + "/whale-dashboard/")).text()).toBe("SSR shell");
  h.unload();
  h.dispose();
  expect(h.routes).toHaveLength(0);
});
it("rejects cross-origin RPC even when a mock host allows it", async () => {
  const h = await host({ requestRejection: () => undefined });
  const res = await fetch(h.origin + "/whale-dashboard/rpc/snapshot", {
    method: "POST",
    headers: { origin: "https://example.com", "content-type": "application/json" },
    body: "{}",
  });
  expect(res.status).toBe(403);
});
