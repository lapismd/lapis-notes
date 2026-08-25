import type { App } from "@lapis-notes/api";
import { normalizeGraphTag } from "./graph-data";
import type { GraphNode } from "./graph-types";

export function graphTagSearchQuery(node: GraphNode): string | null {
  if (node.type !== "tag") return null;
  const tag = normalizeGraphTag(node.label || node.path || "");
  return tag ? `tag:${tag}` : null;
}

export async function openGraphTagSearch(
  app: Pick<App, "commands">,
  node: GraphNode,
): Promise<boolean> {
  const query = graphTagSearchQuery(node);
  if (query == null) return false;
  await app.commands
    .executeCommand("search:open-search", query)
    .catch(() => undefined);
  return true;
}
