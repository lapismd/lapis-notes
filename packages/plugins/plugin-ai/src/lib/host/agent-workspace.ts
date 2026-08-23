type AgentWorkspaceAdapter = {
  runtime?: unknown;
  rootPath?: unknown;
};

/**
 * Resolve the real native vault directory used as an agent working tree.
 * Memory and browser vaults deliberately return undefined so an attached
 * agent host can apply its own confined workspace root.
 */
export function resolveAgentWorkspace(
  adapter: unknown,
): string | undefined {
  if (!adapter || typeof adapter !== "object") return undefined;
  const candidate = adapter as AgentWorkspaceAdapter;
  if (candidate.runtime !== "deno-desktop") return undefined;
  if (typeof candidate.rootPath !== "string") return undefined;
  const rootPath = candidate.rootPath.trim();
  return rootPath || undefined;
}
