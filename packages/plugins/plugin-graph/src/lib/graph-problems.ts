import {
  diagnosticResourceForPath,
  type DiagnosticCollection,
  type DiagnosticCollectionOptions,
  type DiagnosticResource,
  type WorkspaceDiagnostic,
} from "@lapis-notes/api";

export type GraphProblemScope = "global" | "local";

interface GraphProblemOwner {
  createDiagnosticCollection(
    id: string,
    options?: DiagnosticCollectionOptions,
  ): DiagnosticCollection;
}

interface GraphProblemRecord {
  resource: DiagnosticResource | null;
  diagnostic: WorkspaceDiagnostic;
}

function failureMessage(scope: GraphProblemScope, error: unknown): string {
  const detail = error instanceof Error ? error.message : String(error);
  return `${scope === "local" ? "Local Graph" : "Graph"} failed: ${detail}`;
}

export class GraphProblemReporter {
  private readonly problems = new Map<GraphProblemScope, GraphProblemRecord>();

  constructor(private readonly collection: DiagnosticCollection) {}

  report(scope: GraphProblemScope, path: string | null, error: unknown): void {
    this.problems.set(scope, {
      resource:
        scope === "local" && path ? diagnosticResourceForPath(path) : null,
      diagnostic: {
        message: failureMessage(scope, error),
        severity: "error",
        source: "Graph",
        code: `lapis-graph/${scope}-build`,
      },
    });
    this.publish();
  }

  clear(scope: GraphProblemScope): void {
    if (!this.problems.delete(scope)) return;
    this.publish();
  }

  private publish(): void {
    this.collection.clear();
    const grouped = new Map<
      string,
      {
        resource: DiagnosticResource | null;
        diagnostics: WorkspaceDiagnostic[];
      }
    >();
    for (const problem of this.problems.values()) {
      const key = problem.resource?.uri ?? "workspace";
      const current = grouped.get(key) ?? {
        resource: problem.resource,
        diagnostics: [],
      };
      current.diagnostics.push(problem.diagnostic);
      grouped.set(key, current);
    }
    this.collection.set(
      [...grouped.values()].map(
        ({ resource, diagnostics }) => [resource, diagnostics] as const,
      ),
    );
  }
}

export function createGraphProblemReporter(
  owner: GraphProblemOwner,
): GraphProblemReporter {
  return new GraphProblemReporter(
    owner.createDiagnosticCollection("build", { label: "Graph" }),
  );
}
