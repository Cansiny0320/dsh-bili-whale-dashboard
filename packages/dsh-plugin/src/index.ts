import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { IncomingMessage, ServerResponse } from "node:http";
import { DashboardBackend, Files, dataPaths, originalApi } from "@whale/core";
import type { Backend } from "@whale/core";
import { handleRpc } from "@whale/core/rpc";
export interface Host {
  webServer: {
    getOrigin(): string;
    register(route: {
      kind: "prefix" | "exact";
      path: string;
      handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>;
    }): () => void;
  };
  connection?: { requestRejection(req: IncomingMessage): unknown };
  get?(name: string): unknown;
  effect(callback: () => () => void): unknown;
}
export interface Options {
  backend?: Backend;
  clientDir?: string;
  render?: (request: Request) => Promise<Response>;
}
const prefix = "/whale-dashboard";
const root = fileURLToPath(new URL("../../../", import.meta.url));
const mime: Record<string, string> = {
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};
export async function toRequest(req: IncomingMessage, origin: string) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
    else if (value) headers.set(key, value);
  }
  const chunks: Buffer[] = [];
  let size = 0;
  if (!["GET", "HEAD"].includes(req.method ?? "GET"))
    for await (const chunk of req) {
      const data = Buffer.from(chunk);
      size += data.length;
      if (size > 128 * 1024) throw new Error("请求体过大");
      chunks.push(data);
    }
  return new Request(new URL(req.url ?? "/", origin), {
    method: req.method,
    headers,
    body: chunks.length ? Buffer.concat(chunks) : undefined,
  });
}
export async function sendResponse(response: Response, res: ServerResponse) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(Buffer.from(await response.arrayBuffer()));
}
export function mount(ctx: Host, options: Options = {}) {
  const userHome = process.env.USERPROFILE || process.env.HOME || os.homedir();
  const dshHome = process.env.DSH_HOME || path.join(userHome, ".dsh");
  const backend =
    options.backend ??
    new DashboardBackend(
      new Files(dataPaths(dshHome, path.join(userHome, ".bili-ai"), process.env.BILI_WHALE_CONFIG)),
      originalApi(() => ctx.webServer.getOrigin()),
      "live",
    );
  const clientDir = options.clientDir ?? path.join(root, "apps/dashboard/dist/client");
  let server: Promise<{ default: { fetch: (request: Request) => Promise<Response> } }> | undefined;
  const render =
    options.render ??
    (async (request: Request) => {
      server ??= import(
        pathToFileURL(path.join(root, "apps/dashboard/dist/server/server.js")).href
      );
      return (await server).default.fetch(request);
    });
  const handler = async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const origin = ctx.webServer.getOrigin();
      const url = new URL(req.url ?? "/", origin);
      if (url.pathname !== prefix && !url.pathname.startsWith(prefix + "/")) {
        res.statusCode = 404;
        res.end();
        return;
      }
      const host = new URL(`http://${req.headers.host ?? "invalid"}`).hostname;
      if (!["127.0.0.1", "localhost", "[::1]"].includes(host)) {
        res.statusCode = 403;
        res.end();
        return;
      }
      const connection = (ctx.get?.("connection") ?? ctx.connection) as Host["connection"];
      if (!connection?.requestRejection) {
        res.statusCode = 503;
        res.end("DSH authentication service unavailable");
        return;
      }
      const rejection = connection.requestRejection(req);
      if (rejection !== undefined && rejection !== null && rejection !== false) {
        res.statusCode = typeof rejection === "number" ? rejection : 403;
        res.end();
        return;
      }
      const request = await toRequest(req, origin);
      if (url.pathname.startsWith(prefix + "/rpc/")) {
        await sendResponse(await handleRpc(request, backend), res);
        return;
      }
      if (req.method !== "GET" && req.method !== "HEAD") {
        res.statusCode = 405;
        res.end();
        return;
      }
      if (url.pathname === prefix) {
        res.statusCode = 302;
        res.setHeader("location", prefix + "/");
        res.end();
        return;
      }
      const relative = decodeURIComponent(url.pathname.slice(prefix.length + 1));
      if (relative.startsWith("assets/") || relative.startsWith("brand/")) {
        const file = path.resolve(clientDir, relative);
        const base = path.resolve(clientDir);
        if (
          !file.startsWith(base + path.sep) ||
          !mime[path.extname(file)] ||
          !fs.existsSync(file) ||
          !fs.statSync(file).isFile() ||
          !fs.realpathSync(file).startsWith(fs.realpathSync(base) + path.sep)
        ) {
          res.statusCode = 404;
          res.end();
          return;
        }
        res.setHeader("content-type", mime[path.extname(file)]!);
        res.setHeader("x-content-type-options", "nosniff");
        res.setHeader(
          "cache-control",
          relative.startsWith("assets/")
            ? "private, max-age=31536000, immutable"
            : "private, max-age=3600",
        );
        res.end(req.method === "HEAD" ? undefined : fs.readFileSync(file));
        return;
      }
      const response = await render(request);
      response.headers.set("cache-control", "no-store");
      response.headers.set("x-content-type-options", "nosniff");
      await sendResponse(response, res);
    } catch {
      if (!res.headersSent) {
        res.statusCode = 503;
        res.setHeader("content-type", "text/plain; charset=utf-8");
      }
      res.end("鲸鱼娘后台暂不可用，请检查本地构建及 DSH 服务。");
    }
  };
  const disposers = [ctx.webServer.register({ kind: "prefix", path: prefix, handler })];
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    for (const stop of disposers.reverse()) stop();
  };
  ctx.effect(() => dispose);
  return dispose;
}
export default {
  name: "dsh-bili-whale-dashboard",
  inject: ["webServer", "connection"],
  apply(ctx: Host) {
    mount(ctx);
  },
};
