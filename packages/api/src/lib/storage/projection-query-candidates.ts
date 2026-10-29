import type { IndexFilter, IndexQuery } from "./index-projection";

type Candidate = { filter?: IndexFilter; exact: boolean };

/** SQL narrows only what its scalar semantics can prove; the AST remains final. */
export function projectionQueryCandidates(query: IndexQuery): IndexQuery {
  return {
    where: query.where ? candidate(query.where).filter : undefined,
    includeStale: query.includeStale,
  };
}

function candidate(filter: IndexFilter): Candidate {
  switch (filter.op) {
    case "and":
    case "or": {
      const branches = filter.operands.map(candidate);
      const exact = branches.every((branch) => branch.exact);
      if (filter.op === "or" && branches.some((branch) => !branch.filter)) {
        return { exact };
      }
      return {
        filter: {
          op: filter.op,
          operands: branches.flatMap((branch) =>
            branch.filter ? [branch.filter] : [],
          ),
        },
        exact,
      };
    }
    case "not": {
      const child = candidate(filter.operand);
      return child.exact
        ? {
            filter: {
              op: "not",
              operand: child.filter ?? { op: "and", operands: [] },
            },
            exact: true,
          }
        : { exact: false };
    }
    case "exists":
    case "not-exists":
      return { filter, exact: true };
    case "in": {
      if (!filter.values.length)
        return { filter: { op: "or", operands: [] }, exact: true };
      if (filter.values.every((value) => value == null)) {
        return {
          filter: { op: "not-exists", field: filter.field },
          exact: true,
        };
      }
      return filter.values.some((value) => value == null)
        ? { exact: false }
        : { filter: { op: "exists", field: filter.field }, exact: false };
    }
    case "compare": {
      if (filter.value == null) {
        if (filter.comparison === "eq" || filter.comparison === "ne")
          return { filter, exact: true };
        return {
          filter:
            filter.comparison === "lt" || filter.comparison === "lte"
              ? { op: "exists", field: filter.field }
              : { op: "or", operands: [] },
          exact: true,
        };
      }
      return filter.comparison === "ne"
        ? { exact: false }
        : { filter: { op: "exists", field: filter.field }, exact: false };
    }
  }
}
