import {
  createTRPCClient,
  httpBatchLink,
  httpSubscriptionLink,
  splitLink,
  type TRPCClient,
} from "@trpc/client";

import type { AppRouter } from "./router.ts";

export type LapisServerClientOptions = {
  baseUrl?: string;
  csrfToken?: () => string | undefined;
};

export function createLapisServerClient(
  options: LapisServerClientOptions = {},
): TRPCClient<AppRouter> {
  const url = `${options.baseUrl ?? ""}/api/trpc`;
  const headers = () => {
    const csrf = options.csrfToken?.();
    return csrf ? { "x-lapis-csrf": csrf } : {};
  };
  return createTRPCClient<AppRouter>({
    links: [
      splitLink({
        condition: (operation) => operation.type === "subscription",
        true: httpSubscriptionLink({ url }),
        false: httpBatchLink({ url, headers }),
      }),
    ],
  });
}
