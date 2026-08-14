import type { ToolContribution } from "../core/types";

export interface ToolContributionRegistry {
  register(contribution: ToolContribution): () => void;
  list(): ToolContribution[];
}

export function createToolContributionRegistry(
  initial: ToolContribution[] = [],
): ToolContributionRegistry {
  const contributions = new Map<string, ToolContribution>();
  for (const contribution of initial) {
    contributions.set(contribution.name, contribution);
  }
  return {
    register(contribution) {
      contributions.set(contribution.name, contribution);
      return () => {
        contributions.delete(contribution.name);
      };
    },
    list() {
      return [...contributions.values()];
    },
  };
}
