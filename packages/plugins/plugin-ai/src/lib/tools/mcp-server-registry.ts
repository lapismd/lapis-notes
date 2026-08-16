import type { McpServerContribution } from "../core/types";

export const APP_TOOL_MCP_SERVER_NAME = "lapis-tools";

export interface McpServerContributionRegistry {
  register(contribution: McpServerContribution): () => void;
  list(): McpServerContribution[];
}

export function createMcpServerContributionRegistry(
  initial: McpServerContribution[] = [],
): McpServerContributionRegistry {
  const contributions = new Map<string, McpServerContribution>();
  for (const contribution of initial) {
    assertAvailableName(contributions, contribution.name);
    contributions.set(contribution.name, contribution);
  }
  return {
    register(contribution) {
      assertAvailableName(contributions, contribution.name);
      contributions.set(contribution.name, contribution);
      return () => {
        contributions.delete(contribution.name);
      };
    },
    list() {
      return [...contributions.values()].sort((left, right) =>
        left.name.localeCompare(right.name),
      );
    },
  };
}

function assertAvailableName(
  contributions: Map<string, McpServerContribution>,
  name: string,
): void {
  if (!name.trim()) throw new Error("MCP server names must not be empty");
  if (name === APP_TOOL_MCP_SERVER_NAME) {
    throw new Error(`MCP server name is reserved: ${name}`);
  }
  if (contributions.has(name)) {
    throw new Error(`MCP server name is already registered: ${name}`);
  }
}
