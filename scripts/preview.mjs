import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDemo } from "../packages/core/dist/demo.js";
import { mount } from "../packages/dsh-plugin/dist/index.js";
const root = fileURLToPath(new URL("../", import.meta.url));
const port = Number(process.env.PORT || 4179);
const origin = `http://127.0.0.1:${port}`;
const routes = [];
const dispose = mount(
  {
    webServer: {
      getOrigin: () => origin,
      register: (route) => {
        routes.push(route);
        return () => {
          const i = routes.indexOf(route);
          if (i >= 0) routes.splice(i, 1);
        };
      },
    },
    connection: {
      requestRejection: (req) => {
        if (req.headers.origin && req.headers.origin !== origin) return 403;
        if (req.headers["sec-fetch-site"] === "cross-site") return 403;
      },
    },
    effect: () => {},
  },
  { backend: createDemo(process.env.DASHBOARD_DEMO_DIR || path.join(root, ".local/demo")) },
);
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url || "/", origin).pathname;
  const route = routes.find((r) =>
    r.kind === "exact" ? pathname === r.path : pathname.startsWith(r.path),
  );
  if (route) void route.handler(req, res);
  else {
    res.statusCode = 404;
    res.end();
  }
});
server.listen(port, "127.0.0.1", () => console.log(`本机隔离演示：${origin}/whale-dashboard/`));
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    dispose();
    server.close(() => process.exit(0));
  });
