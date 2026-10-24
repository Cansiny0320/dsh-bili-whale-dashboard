import { createDemo } from "@whale/core/demo";
import { handleRpc } from "@whale/core/rpc";
let demo: ReturnType<typeof createDemo> | undefined;
export function demoRpc(request: Request) {
  if (process.env.DASHBOARD_MODE !== "demo" || !process.env.DASHBOARD_DEMO_DIR)
    return new Response("请通过 DSH 同源插件打开", { status: 503 });
  const url = new URL(request.url);
  if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname))
    return new Response("Forbidden", { status: 403 });
  demo ??= createDemo(process.env.DASHBOARD_DEMO_DIR);
  return handleRpc(request, demo);
}
