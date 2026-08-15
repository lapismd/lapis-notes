export function isLiveAgentAttachConfigured(
  url = (import.meta.env as { LAPIS_AGENT_RUNTIME_URL?: string })
    .LAPIS_AGENT_RUNTIME_URL,
  token = (import.meta.env as { LAPIS_AGENT_RUNTIME_TOKEN?: string })
    .LAPIS_AGENT_RUNTIME_TOKEN,
): boolean {
  return Boolean(url?.trim()) && Boolean(token?.trim());
}
