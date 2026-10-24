import { os, ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { z } from "zod";
import { personaSaveSchema, reviewInputSchema, saveSchema } from "./schema.js";
import type { Backend } from "./schema.js";
const base = os.$context<{ backend: Backend; request: Request }>().use(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof ORPCError) throw error;
    throw new ORPCError("BAD_REQUEST", {
      message: error instanceof Error ? error.message : "操作失败",
    });
  }
});
export const router = {
  snapshot: base.handler(({ context }) => context.backend.snapshot(context.request)),
  diary: base
    .input(z.object({ kind: z.enum(["public", "private"]) }))
    .handler(({ input, context }) => context.backend.diary(input.kind)),
  saveSettings: base.input(saveSchema).handler(async ({ input, context }) => {
    await context.backend.saveSettings(input, context.request);
    return { ok: true };
  }),
  savePersona: base.input(personaSaveSchema).handler(async ({ input, context }) => {
    await context.backend.savePersona(input, context.request);
    return { ok: true };
  }),
  review: base
    .input(reviewInputSchema)
    .handler(({ input, context }) => context.backend.review(input, context.request)),
};
const handler = new RPCHandler(router);
export async function handleRpc(request: Request, backend: Backend) {
  const origin = request.headers.get("origin");
  if (
    (origin && origin !== new URL(request.url).origin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return new Response("Forbidden", { status: 403 });
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!request.headers.get("content-type")?.includes("application/json"))
    return new Response("JSON required", { status: 415 });
  const bytes = await request.clone().arrayBuffer();
  if (bytes.byteLength > 128 * 1024) return new Response("Payload too large", { status: 413 });
  const result = await handler.handle(request, {
    prefix: "/whale-dashboard/rpc",
    context: { backend, request },
  });
  const response = result.response ?? new Response("Not found", { status: 404 });
  response.headers.set("cache-control", "no-store");
  return response;
}
