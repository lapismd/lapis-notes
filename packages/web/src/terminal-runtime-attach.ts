import { setWebTerminalRuntimeContribution } from "./web-runtime-compose";

export function registerWebTerminalRuntimeBridge(options?: {
  url?: string;
  token?: string;
}): boolean {
  return setWebTerminalRuntimeContribution({
    url: options?.url ?? import.meta.env.LAPIS_TERMINAL_HOST_URL,
    token: options?.token ?? import.meta.env.LAPIS_TERMINAL_HOST_TOKEN,
  });
}
