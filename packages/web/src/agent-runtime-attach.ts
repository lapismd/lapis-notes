import { setWebAgentRuntimeContribution } from "./web-runtime-compose";

export function registerWebAgentRuntimeBridge(options?: {
  url?: string;
  token?: string;
}): boolean {
  return setWebAgentRuntimeContribution({
    url: options?.url ?? import.meta.env.LAPIS_AGENT_RUNTIME_URL,
    token: options?.token ?? import.meta.env.LAPIS_AGENT_RUNTIME_TOKEN,
  });
}
