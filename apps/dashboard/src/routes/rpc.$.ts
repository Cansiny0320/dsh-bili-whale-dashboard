import { createFileRoute } from "@tanstack/react-router";
import { demoRpc } from "../lib/server";
export const Route = createFileRoute("/rpc/$")({
  server: { handlers: { POST: ({ request }) => demoRpc(request) } },
});
