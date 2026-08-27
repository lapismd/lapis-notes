import { parseSearchQueryAst } from "@lapis-notes/api";
import type { GraphSettings } from "./graph-types";

export interface GraphQueryMatches {
  filterPaths?: ReadonlySet<string>;
  groupPaths: ReadonlyMap<string, ReadonlySet<string>>;
  filterDiagnostic: string | null;
  groupDiagnostics: Readonly<Record<string, string>>;
}

export type GraphPathQuery = (query: string) => Promise<ReadonlySet<string>>;

function queryDiagnostic(query: string): string | null {
  return parseSearchQueryAst(query).diagnostics[0]?.message ?? null;
}

export async function resolveGraphQueryMatches(
  settings: GraphSettings,
  matchPaths: GraphPathQuery,
): Promise<GraphQueryMatches> {
  const groupPaths = new Map<string, ReadonlySet<string>>();
  const groupDiagnostics: Record<string, string> = {};
  const filterQuery = settings.filters.searchQuery.trim();
  let filterPaths: ReadonlySet<string> | undefined;
  let filterDiagnostic: string | null = null;

  if (filterQuery) {
    filterDiagnostic = queryDiagnostic(filterQuery);
    if (!filterDiagnostic) {
      try {
        filterPaths = await matchPaths(filterQuery);
      } catch {
        filterDiagnostic = "Unable to evaluate this filter";
      }
    }
  }

  await Promise.all(
    settings.groups.map(async (group) => {
      const query = group.query.trim();
      if (!query) return;
      const diagnostic = queryDiagnostic(query);
      if (diagnostic) {
        groupDiagnostics[group.id] = diagnostic;
        return;
      }
      try {
        groupPaths.set(group.id, await matchPaths(query));
      } catch {
        groupDiagnostics[group.id] = "Unable to evaluate this Group";
      }
    }),
  );

  return {
    filterPaths,
    groupPaths,
    filterDiagnostic,
    groupDiagnostics,
  };
}
