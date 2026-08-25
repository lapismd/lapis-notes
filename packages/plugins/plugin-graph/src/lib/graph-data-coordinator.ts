import type { App } from "@lapis-notes/api";
import {
  buildCanonicalGraph,
  type GraphBuildProgress,
} from "./graph-data";
import type { GraphData, GraphLink, GraphNode } from "./graph-types";

const GRAPH_SNAPSHOT_KEY = "graph.canonical-snapshot.v1";
const GRAPH_SNAPSHOT_VERSION = 1;

interface PersistedGraphSnapshot {
  version: typeof GRAPH_SNAPSHOT_VERSION;
  completedAt: number;
  metadataFingerprint: string;
  graph: GraphData;
}

export type GraphCoordinatorStatus =
  | "idle"
  | "loading"
  | "updating"
  | "ready"
  | "error";

export type GraphSnapshotOutcome = "none" | "hit" | "stale" | "corrupt";

export interface GraphCoordinatorState {
  version: number;
  graph: GraphData | null;
  status: GraphCoordinatorStatus;
  progress: GraphBuildProgress | null;
  error: string | null;
  snapshotOutcome: GraphSnapshotOutcome;
  completedAt: number | null;
}

type GraphCoordinatorApp = Pick<
  App,
  "appDatabase" | "metadataCache" | "telemetry" | "vault" | "workspace"
>;

function cloneNode(node: GraphNode): GraphNode {
  return {
    ...node,
    tags: [...node.tags],
    groupIds: [...node.groupIds],
  };
}

function cloneLink(link: GraphLink): GraphLink {
  return { ...link };
}

export function cloneGraphData(graph: GraphData): GraphData {
  return {
    nodes: graph.nodes.map(cloneNode),
    links: graph.links.map(cloneLink),
    centerNodeId: graph.centerNodeId ?? null,
  };
}

function isGraphData(value: unknown): value is GraphData {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<GraphData>;
  return (
    Array.isArray(candidate.nodes) &&
    candidate.nodes.every(
      (node) =>
        node &&
        typeof node === "object" &&
        typeof (node as GraphNode).id === "string" &&
        typeof (node as GraphNode).label === "string" &&
        Array.isArray((node as GraphNode).tags) &&
        Array.isArray((node as GraphNode).groupIds),
    ) &&
    Array.isArray(candidate.links) &&
    candidate.links.every(
      (link) =>
        link &&
        typeof link === "object" &&
        typeof (link as GraphLink).id === "string" &&
        typeof (link as GraphLink).source === "string" &&
        typeof (link as GraphLink).target === "string",
    )
  );
}

function parseSnapshot(value: unknown): PersistedGraphSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<PersistedGraphSnapshot>;
  if (
    candidate.version !== GRAPH_SNAPSHOT_VERSION ||
    typeof candidate.completedAt !== "number" ||
    typeof candidate.metadataFingerprint !== "string" ||
    !isGraphData(candidate.graph)
  ) {
    return null;
  }
  return {
    version: GRAPH_SNAPSHOT_VERSION,
    completedAt: candidate.completedAt,
    metadataFingerprint: candidate.metadataFingerprint,
    graph: cloneGraphData(candidate.graph),
  };
}

function isCancellation(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export class GraphDataCoordinator {
  private readonly listeners = new Set<
    (state: GraphCoordinatorState) => void
  >();
  private state: GraphCoordinatorState = {
    version: 0,
    graph: null,
    status: "idle",
    progress: null,
    error: null,
    snapshotOutcome: "none",
    completedAt: null,
  };
  private startPromise: Promise<void> | null = null;
  private runPromise: Promise<void> | null = null;
  private pending = false;
  private pendingForce = false;
  private disposed = false;
  private abortController: AbortController | null = null;
  private currentFingerprint: string | null = null;

  constructor(private readonly app: GraphCoordinatorApp) {}

  subscribe(listener: (state: GraphCoordinatorState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  getState(): GraphCoordinatorState {
    return {
      ...this.state,
      graph: this.state.graph ? cloneGraphData(this.state.graph) : null,
      progress: this.state.progress ? { ...this.state.progress } : null,
    };
  }

  start(): Promise<void> {
    this.startPromise ??= this.performStart();
    return this.startPromise;
  }

  requestRefresh(_reason = "refresh", force = false): Promise<void> {
    if (this.disposed) return Promise.resolve();
    this.pending = true;
    this.pendingForce ||= force;
    this.runPromise ??= this.runQueue().finally(() => {
      this.runPromise = null;
    });
    return this.runPromise;
  }

  dispose(): void {
    this.disposed = true;
    this.pending = false;
    this.pendingForce = false;
    this.abortController?.abort();
    this.abortController = null;
    this.listeners.clear();
  }

  private async performStart(): Promise<void> {
    try {
      await this.app.appDatabase.open();
      if (this.disposed) return;
      const stored = await this.app.appDatabase.getMeta(GRAPH_SNAPSHOT_KEY);
      const snapshot = parseSnapshot(stored);
      const fingerprint = this.app.metadataCache.getReconciliationFingerprint();

      if (snapshot) {
        const matching = snapshot.metadataFingerprint === fingerprint;
        this.currentFingerprint = snapshot.metadataFingerprint;
        this.updateState({
          graph: snapshot.graph,
          status: matching ? "ready" : "updating",
          progress: null,
          error: null,
          snapshotOutcome: matching ? "hit" : "stale",
          completedAt: snapshot.completedAt,
        });
        this.app.telemetry.recordEvent("graph.snapshot", {
          outcome: matching ? "hit" : "stale",
          "graph.node.count": snapshot.graph.nodes.length,
          "graph.link.count": snapshot.graph.links.length,
        });
        if (matching) return;
      } else {
        const outcome: GraphSnapshotOutcome =
          stored === undefined ? "none" : "corrupt";
        this.updateState({
          status: "loading",
          snapshotOutcome: outcome,
          error: null,
        });
        this.app.telemetry.recordEvent("graph.snapshot", { outcome });
      }

      void this.app.metadataCache.load().then(
        () => {
          if (!this.disposed) void this.requestRefresh("startup");
        },
        (error) => {
          if (!this.disposed) this.handleFailure(error);
        },
      );
    } catch (error) {
      this.handleFailure(error);
    }
  }

  private async runQueue(): Promise<void> {
    await this.start();
    await this.app.metadataCache.load();
    while (this.pending && !this.disposed) {
      const force = this.pendingForce;
      this.pending = false;
      this.pendingForce = false;
      await this.buildOnce(force);
    }
  }

  private async buildOnce(force: boolean): Promise<void> {
    const fingerprint = this.app.metadataCache.getReconciliationFingerprint();
    if (!force && this.state.graph && this.currentFingerprint === fingerprint) {
      this.updateState({ status: "ready", progress: null, error: null });
      return;
    }

    this.updateState({
      status: this.state.graph ? "updating" : "loading",
      progress: { processed: 0, total: 0, pages: 0 },
      error: null,
    });
    this.abortController = new AbortController();
    const startedAt = performance.now();
    let lastProgress: GraphBuildProgress = {
      processed: 0,
      total: 0,
      pages: 0,
    };
    try {
      const graph = await this.app.telemetry.measureAsync(
        "graph.build",
        async (span) => {
          const result = await buildCanonicalGraph(this.app, {
            signal: this.abortController?.signal,
            onProgress: (progress) => {
              lastProgress = progress;
              span.setAttribute("graph.files.processed", progress.processed);
              span.setAttribute("graph.files.total", progress.total);
              span.setAttribute("graph.page.count", progress.pages);
              this.updateState({ progress });
            },
          });
          span.setAttribute("graph.node.count", result.nodes.length);
          span.setAttribute("graph.link.count", result.links.length);
          return result;
        },
      );
      if (this.disposed) return;
      const completedFingerprint =
        this.app.metadataCache.getReconciliationFingerprint();
      const completedAt = Date.now();
      this.currentFingerprint =
        fingerprint === completedFingerprint ? completedFingerprint : null;
      this.updateState({
        graph,
        status: fingerprint === completedFingerprint ? "ready" : "updating",
        progress: null,
        error: null,
        completedAt,
      });

      if (fingerprint === completedFingerprint) {
        await this.app.appDatabase.setMeta(GRAPH_SNAPSHOT_KEY, {
          version: GRAPH_SNAPSHOT_VERSION,
          completedAt,
          metadataFingerprint: completedFingerprint,
          graph,
        } satisfies PersistedGraphSnapshot);
      } else {
        this.pending = true;
      }
      this.app.telemetry.recordEvent("graph.build.complete", {
        "graph.node.count": graph.nodes.length,
        "graph.link.count": graph.links.length,
        "graph.page.count": lastProgress.pages,
        "graph.duration.ms": Math.round(performance.now() - startedAt),
        stable: fingerprint === completedFingerprint,
      });
    } catch (error) {
      if (!isCancellation(error)) this.handleFailure(error);
    } finally {
      this.abortController = null;
    }
  }

  private handleFailure(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.updateState({ status: "error", progress: null, error: message });
    this.app.telemetry.recordEvent("graph.build.failed", {
      cached: Boolean(this.state.graph),
    });
  }

  private updateState(patch: Partial<GraphCoordinatorState>): void {
    this.state = {
      ...this.state,
      ...patch,
      version: "graph" in patch ? this.state.version + 1 : this.state.version,
    };
    const snapshot = this.getState();
    for (const listener of this.listeners) listener(snapshot);
  }
}

export const GRAPH_CANONICAL_SNAPSHOT_KEY = GRAPH_SNAPSHOT_KEY;
