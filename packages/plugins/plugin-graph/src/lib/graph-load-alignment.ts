import type { GraphData } from "./graph-types";

export function graphLoadFocusNodeId(
  isLocal: boolean,
  graph: Pick<GraphData, "centerNodeId">,
): string | null {
  return isLocal ? (graph.centerNodeId ?? null) : null;
}
