import {
  createVaultSearchFilterSyntax,
  ItemView,
  Menu,
  Notice,
  type WorkspaceLeaf,
} from "@lapis-notes/api";
import type { SearchFilterSyntax } from "@lapismd/design-core/filter";
import { buildCanonicalLocalGraph, graphNodeIdForFile } from "./graph-data";
import type { GraphCoordinatorState } from "./graph-data-coordinator";
import { GraphBuildGeneration } from "./graph-build-generation";
import { graphLoadFocusNodeId } from "./graph-load-alignment";
import { openGraphTagSearch } from "./graph-node-activation";
import GraphControlsOverlay from "./graph-controls-overlay.svelte";
import { GraphRenderer, type GraphNodePreview } from "./graph-renderer";
import {
  DEFAULT_GRAPH_SETTINGS,
  mergeGraphSettings,
  patchGraphSettings,
} from "./graph-settings";
import type { GraphPlugin } from "./graph-plugin";
import type {
  GraphData,
  GraphNode,
  GraphSettings,
  GraphSettingsPatch,
} from "./graph-types";
import { resolveGraphNavigationLeaf } from "./graph-navigation";
import {
  mountLocalComponent,
  type LocalMountComponent,
} from "./mount-local-component.svelte";

export const GraphViewType = "graph";
export const LocalGraphViewType = "graph-local";

type DebouncedCallback = (() => void) & { cancel: () => void };

function createDebounce(
  callback: () => void,
  waitMs: number,
): DebouncedCallback {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const debounced = (() => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = null;
      callback();
    }, waitMs);
  }) as DebouncedCallback;
  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  return debounced;
}

abstract class GraphViewBase extends ItemView {
  protected readonly plugin: GraphPlugin;
  protected readonly isLocal: boolean;
  private renderer: GraphRenderer | null = null;
  private overlay: LocalMountComponent<Record<string, unknown>> | null = null;
  private settings: GraphSettings;
  private canonicalGraph: GraphData | null = null;
  private coordinatorGraphVersion = -1;
  private unsubscribeCoordinator: (() => void) | null = null;
  private currentGraphPaths: Set<string> = new Set();
  private unregisterView: (() => void) | null = null;
  private readonly buildGeneration = new GraphBuildGeneration();
  private readonly deriveGeneration = new GraphBuildGeneration();
  private metadataFacetGeneration = 0;
  private filterSyntax: SearchFilterSyntax = createVaultSearchFilterSyntax({
    fileNames: [],
    paths: [],
    tags: [],
  });
  private readonly scheduleRebuild = createDebounce(() => {
    void this.rebuild();
  }, 120);
  private readonly scheduleDerive = createDebounce(() => {
    void this.deriveGraphFromSettings();
  }, 90);

  constructor(
    leaf: WorkspaceLeaf | undefined,
    plugin: GraphPlugin,
    isLocal: boolean,
  ) {
    super(leaf);
    this.plugin = plugin;
    this.isLocal = isLocal;
    this.settings = this.plugin.getSettings();
  }

  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }

  protected onClose(): Promise<void> {
    return Promise.resolve();
  }

  onload(): void {
    this.settings = this.plugin.getSettings();
    this.contentEl.empty();
    this.contentEl.classList.add("graph-view");
    this.contentEl.dataset.uiComponent = "graph";
    this.contentEl.dataset.uiPart = this.isLocal ? "local-view" : "global-view";
    this.contentEl.dataset.testid = this.isLocal
      ? "local-graph-panel"
      : "graph-panel";

    this.overlay = mountLocalComponent(GraphControlsOverlay, {
      target: this.contentEl,
      props: {
        app: this.app,
        isLocal: this.isLocal,
        settings: this.settings,
        statsText: "",
        statusText: "Loading graph…",
        statusKind: "loading",
        groupDiagnostics: {},
        filterDiagnostic: null,
        filterSyntax: this.filterSyntax,
        preview: null,
        isAnimating: false,
        onFocusActiveFile: () => {
          this.focusActiveFile();
        },
        onZoomIn: () => {
          this.renderer?.zoomIn();
        },
        onZoomOut: () => {
          this.renderer?.zoomOut();
        },
        onResetView: () => {
          this.renderer?.resetView();
        },
        onRefreshGraph: () => {
          if (this.isLocal) {
            void this.rebuild();
          } else {
            void this.plugin.refreshGlobalGraph(true);
          }
        },
        onResetDefaults: () => {
          this.resetLocalSettings();
        },
        onToggleAnimation: () => {
          if (this.renderer?.isTimeLapseRunning()) {
            this.renderer.stopTimeLapse();
          } else {
            this.renderer?.startTimeLapse();
          }
        },
        onSettingsPatch: (patch: GraphSettingsPatch) => {
          this.updateLocalSettings(patch);
        },
        onOpenPreviewFile: (preview: GraphNodePreview) => {
          void this.openNode(preview.node, false);
        },
        onDismissPreview: () => {
          this.renderer?.dismissPreview();
        },
      },
    });

    const surfaceEl = this.getSurfaceEl();
    this.renderer = new GraphRenderer(surfaceEl, {
      onNodeClick: (node) => {
        void this.openNode(node, false);
      },
      onNodeContextMenu: (node, event) => {
        this.showNodeMenu(node, event);
      },
      onLayoutComplete: (summary) => {
        this.app.telemetry.recordEvent("graph.layout.complete", {
          animated: summary.animated,
          "graph.layout.duration.ms": summary.durationMs,
          "graph.node.count": summary.nodeCount,
          "graph.link.count": summary.linkCount,
        });
      },
      onTimeLapseStateChange: (state) => {
        if (this.overlay) this.overlay.props.isAnimating = state.running;
        this.app.telemetry.recordEvent("graph.timelapse", {
          running: state.running,
          reason: state.reason,
        });
      },
      onNodePreviewChange: (preview) => {
        if (this.overlay) this.overlay.props.preview = preview;
      },
    });

    this.refreshFilterSyntaxFromVault();
    void this.refreshMetadataFacets();

    this.unregisterView = this.plugin.registerGraphView(this);
    if (this.isLocal) {
      this.registerEvent(
        this.app.workspace.on("file-open", () => {
          this.scheduleRebuild();
        }),
      );
      this.registerEvent(
        this.app.metadataCache.on("loaded", () => this.scheduleRebuild()),
      );
      this.registerEvent(
        this.app.metadataCache.on("index-changed", (change) => {
          if (!change.reset && !change.domains.includes("metadata")) return;
          if (
            this.shouldRebuildForMetadataPaths(
              change.paths,
              change.reset ?? false,
            )
          ) {
            this.scheduleRebuild();
          }
        }),
      );
    } else {
      this.unsubscribeCoordinator = this.plugin.subscribeToGlobalGraph(
        (state) => this.applyCoordinatorState(state),
      );
    }
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        if (leaf === this.leaf) {
          this.scheduleViewportRefreshWhenVisible();
        }
        if (this.isLocal) {
          this.scheduleRebuild();
        }
      }),
    );
    this.registerEvent(
      this.app.metadataCache.on("loaded", () => {
        this.refreshFilterSyntaxFromVault();
        void this.refreshMetadataFacets();
      }),
    );
    this.registerEvent(
      this.app.metadataCache.on("index-changed", (change) => {
        if (!change.reset && !change.domains.includes("metadata")) return;
        this.refreshFilterSyntaxFromVault();
        void this.refreshMetadataFacets();
      }),
    );

    if (this.isLocal) {
      requestAnimationFrame(() => {
        void this.rebuild();
      });
    }
  }

  private scheduleViewportRefreshWhenVisible(): void {
    requestAnimationFrame(() => {
      if (!this.renderer) {
        return;
      }
      const surfaceEl = this.overlay?.target.querySelector(
        "[data-graph-surface]",
      );
      if (!(surfaceEl instanceof HTMLDivElement)) {
        return;
      }
      const { width, height } = surfaceEl.getBoundingClientRect();
      if (width <= 0 || height <= 0) {
        return;
      }
      this.renderer.refreshViewport();
    });
  }

  onunload(): void {
    this.scheduleRebuild.cancel();
    this.scheduleDerive.cancel();
    this.buildGeneration.invalidate();
    this.deriveGeneration.invalidate();
    this.metadataFacetGeneration += 1;
    this.unregisterView?.();
    this.unregisterView = null;
    this.unsubscribeCoordinator?.();
    this.unsubscribeCoordinator = null;
    this.renderer?.destroy();
    this.renderer = null;
    this.overlay?.destroy();
    this.overlay = null;
    this.currentGraphPaths = new Set();
    this.canonicalGraph = null;
  }

  onPaneMenu(menu: Menu): void {
    menu.addItem((item) => {
      item
        .setTitle("Refresh graph")
        .setIcon("refresh-cw")
        .onClick(() => {
          if (this.isLocal) {
            void this.rebuild();
          } else {
            void this.plugin.refreshGlobalGraph(true);
          }
        });
    });
    menu.addItem((item) => {
      item
        .setTitle("Focus active file")
        .setIcon("locate-fixed")
        .onClick(() => {
          this.focusActiveFile();
        });
    });
  }

  focusActiveFile(): void {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
      new Notice("No active file to focus in graph");
      return;
    }
    this.renderer?.focusNode(graphNodeIdForFile(activeFile.path), {
      zoom: true,
    });
  }

  applyGraphSettings(settings: GraphSettings): void {
    const previous = this.settings;
    this.settings = mergeGraphSettings(settings);
    if (this.overlay) {
      this.overlay.props.settings = this.settings;
    }
    if (
      this.isLocal &&
      previous.localGraph.depth !== this.settings.localGraph.depth
    ) {
      this.scheduleRebuild();
      return;
    }
    if (this.canonicalGraph) {
      this.scheduleDerive();
    }
  }

  protected abstract getGraphData(settings: GraphSettings): Promise<GraphData>;

  private async rebuild(): Promise<void> {
    const generation = this.buildGeneration.next();
    const diagnosticPath = this.isLocal
      ? (this.app.workspace.getActiveFile()?.path ?? null)
      : null;
    if (this.overlay) {
      this.overlay.props.statusText = "Loading graph…";
      this.overlay.props.statusKind = "loading";
    }
    let graph: GraphData;
    try {
      graph = await this.getGraphData(this.settings);
    } catch (error) {
      if (!this.buildGeneration.isCurrent(generation) || !this.overlay) return;
      this.overlay.props.statusText = `Unable to load graph: ${
        error instanceof Error ? error.message : String(error)
      }`;
      this.overlay.props.statusKind = "error";
      this.plugin.reportGraphBuildFailure(
        this.isLocal ? "local" : "global",
        diagnosticPath,
        error,
      );
      return;
    }
    if (!this.buildGeneration.isCurrent(generation)) return;
    this.plugin.clearGraphBuildFailure(this.isLocal ? "local" : "global");
    this.canonicalGraph = graph;
    const resolved = await this.plugin.resolveGraphSettings(
      graph,
      this.settings,
    );
    if (!this.buildGeneration.isCurrent(generation)) return;
    if (this.overlay) {
      this.overlay.props.groupDiagnostics = resolved.matches.groupDiagnostics;
      this.overlay.props.filterDiagnostic = resolved.matches.filterDiagnostic;
    }
    this.renderGraph(resolved.graph);
    if (this.overlay) {
      this.overlay.props.settings = this.settings;
      this.overlay.props.statsText = this.getStatsText(graph);
      this.overlay.props.statusText = "";
      this.overlay.props.statusKind = null;
    }
  }

  private applyCoordinatorState(state: GraphCoordinatorState): void {
    if (!this.overlay) return;
    if (
      state.graph &&
      (state.version !== this.coordinatorGraphVersion || !this.canonicalGraph)
    ) {
      this.coordinatorGraphVersion = state.version;
      this.canonicalGraph = state.graph;
      void this.deriveGraphFromSettings();
    }

    const progress = state.progress;
    const progressText = progress?.total
      ? ` (${Math.min(progress.processed, progress.total)} of ${progress.total})`
      : "";
    if (state.status === "loading" || state.status === "idle") {
      this.overlay.props.statusText = `Loading graph${progressText}…`;
      this.overlay.props.statusKind = "loading";
    } else if (state.status === "updating") {
      this.overlay.props.statusText = `Updating graph${progressText}…`;
      this.overlay.props.statusKind = "loading";
    } else if (state.status === "error") {
      this.overlay.props.statusText = state.graph
        ? "Unable to refresh graph; showing cached data"
        : `Unable to load graph: ${state.error ?? "Unknown error"}`;
      this.overlay.props.statusKind = "error";
    } else {
      this.overlay.props.statusText = "";
      this.overlay.props.statusKind = null;
    }
  }

  private async deriveGraphFromSettings(): Promise<void> {
    const canonical = this.canonicalGraph;
    if (!canonical) return;
    const generation = this.deriveGeneration.next();
    const resolved = await this.plugin.resolveGraphSettings(
      canonical,
      this.settings,
    );
    if (!this.deriveGeneration.isCurrent(generation)) return;
    if (this.overlay) {
      this.overlay.props.groupDiagnostics = resolved.matches.groupDiagnostics;
      this.overlay.props.filterDiagnostic = resolved.matches.filterDiagnostic;
    }
    this.renderGraph(resolved.graph);
  }

  private renderGraph(graph: GraphData): void {
    this.currentGraphPaths = new Set(
      graph.nodes
        .filter((node) => node.type === "note")
        .map((node) => node.path)
        .filter((path): path is string => typeof path === "string"),
    );
    this.renderer?.setGraph(graph, this.settings);
    const preferredCenterNodeId = graphLoadFocusNodeId(this.isLocal, graph);
    if (preferredCenterNodeId) {
      this.renderer?.focusNode(preferredCenterNodeId);
    }
    if (this.overlay) {
      this.overlay.props.settings = this.settings;
      this.overlay.props.statsText = this.getStatsText(graph);
    }
  }

  private shouldRebuildForMetadataPaths(
    changedPaths: string[],
    reset: boolean,
  ): boolean {
    if (!this.isLocal) {
      return true;
    }

    if (reset || changedPaths.length === 0) return true;

    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
      return false;
    }

    return changedPaths.some(
      (changedPath) =>
        this.currentGraphPaths.has(changedPath) ||
        this.app.metadataCache.isDirectlyAffectedByPathChange(
          activeFile.path,
          changedPath,
        ),
    );
  }

  private getSurfaceEl(): HTMLDivElement {
    const surfaceEl = this.overlay?.target.querySelector(
      "[data-graph-surface]",
    );
    if (!(surfaceEl instanceof HTMLDivElement)) {
      throw new Error("Graph surface root is missing");
    }

    return surfaceEl;
  }

  private getStatsText(graph: GraphData): string {
    const activeFile = this.app.workspace.getActiveFile();
    const centerLabel =
      this.isLocal && activeFile
        ? ` • ${activeFile.baseName ?? activeFile.path}`
        : "";
    return `${graph.nodes.length} nodes • ${graph.links.length} links${centerLabel}`;
  }

  private refreshFilterSyntaxFromVault(tags: readonly string[] = []): void {
    const files = this.app.vault.getFiles();
    this.filterSyntax = createVaultSearchFilterSyntax({
      fileNames: files.map((file) => file.name),
      paths: files.flatMap((file) =>
        file.parent?.path ? [file.parent.path] : [],
      ),
      tags,
    });
    if (this.overlay) this.overlay.props.filterSyntax = this.filterSyntax;
  }

  private async refreshMetadataFacets(): Promise<void> {
    const generation = ++this.metadataFacetGeneration;
    try {
      const rows = await this.app.metadataCache.queryFacets({
        kind: "tag",
        limit: 100,
      });
      if (generation !== this.metadataFacetGeneration) return;
      const tags = rows.flatMap((row) =>
        typeof row.value === "string"
          ? [`#${row.value.replace(/^#/u, "")}`]
          : [],
      );
      this.refreshFilterSyntaxFromVault(tags);
    } catch {
      if (generation !== this.metadataFacetGeneration) return;
      this.refreshFilterSyntaxFromVault();
    }
  }

  private updateLocalSettings(patch: GraphSettingsPatch): void {
    const nextSettings = patchGraphSettings(this.settings, patch);
    void this.plugin.updateSettings(nextSettings);
  }

  private resetLocalSettings(): void {
    void this.plugin.updateSettings(mergeGraphSettings(DEFAULT_GRAPH_SETTINGS));
  }

  private resolveNavigationLeaf(openInNewPane: boolean): WorkspaceLeaf {
    return resolveGraphNavigationLeaf({
      workspace: this.app.workspace,
      graphLeaf: this.leaf,
      isLocal: this.isLocal,
      openInNewPane,
    });
  }

  private async openNode(
    node: GraphNode,
    openInNewPane: boolean,
  ): Promise<void> {
    if (await openGraphTagSearch(this.app, node)) return;
    if (!node.path || !node.exists) {
      return;
    }
    const file = this.app.vault.getFileByPath(node.path);
    if (!file) {
      return;
    }
    const leaf = this.resolveNavigationLeaf(openInNewPane);
    await leaf.openFile(file, { result: { history: true } });
    if (leaf !== this.leaf) {
      this.app.workspace.activeLeaf = leaf;
      await this.app.workspace.revealLeaf(leaf);
    }
  }

  private showNodeMenu(node: GraphNode, event: MouseEvent): void {
    const menu = new Menu();
    if (node.type === "tag") {
      menu
        .addItem((item) =>
          item
            .setTitle("Search for tag")
            .setIcon("search")
            .onClick(() => {
              void openGraphTagSearch(this.app, node);
            }),
        )
        .showAtMouseEvent(event);
      return;
    }
    if (!node.exists) return;
    menu.addItem((item) => {
      item
        .setTitle("Open")
        .setIcon("file-text")
        .onClick(() => {
          void this.openNode(node, false);
        });
    });
    menu.addItem((item) => {
      item
        .setTitle("Open in new pane")
        .setIcon("panel-right-open")
        .onClick(() => {
          void this.openNode(node, true);
        });
    });
    if (node.path) {
      menu.addItem((item) => {
        item
          .setTitle("Copy path")
          .setIcon("copy")
          .onClick(() => {
            void navigator.clipboard?.writeText(node.path ?? "");
          });
      });
    }
    menu.showAtMouseEvent(event);
  }
}

export class GraphView extends GraphViewBase {
  constructor(leaf: WorkspaceLeaf | undefined, plugin: GraphPlugin) {
    super(leaf, plugin, false);
  }

  getViewType(): string {
    return GraphViewType;
  }

  getDisplayText(): string {
    return "Graph";
  }

  getIcon(): string {
    return "waypoints";
  }

  protected getGraphData(_settings: GraphSettings): Promise<GraphData> {
    return Promise.resolve({ nodes: [], links: [], centerNodeId: null });
  }
}

export class LocalGraphView extends GraphViewBase {
  constructor(leaf: WorkspaceLeaf | undefined, plugin: GraphPlugin) {
    super(leaf, plugin, true);
  }

  getViewType(): string {
    return LocalGraphViewType;
  }

  getDisplayText(): string {
    return "Local graph";
  }

  getIcon(): string {
    return "git-branch-plus";
  }

  protected getGraphData(settings: GraphSettings) {
    return buildCanonicalLocalGraph(
      this.app,
      settings,
      this.app.workspace.getActiveFile(),
    );
  }
}
