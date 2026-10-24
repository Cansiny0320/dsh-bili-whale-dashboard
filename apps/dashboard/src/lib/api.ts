import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import type { router } from "@whale/core/rpc";
export const api: RouterClient<typeof router> = createORPCClient(
  new RPCLink({ url: () => `${window.location.origin}/whale-dashboard/rpc` }),
);
