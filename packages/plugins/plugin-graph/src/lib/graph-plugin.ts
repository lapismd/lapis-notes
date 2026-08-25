import {
  Plugin,
  type App,
  type PluginManifest,
  type WorkspaceLeaf,
} from "@lapis-notes/api";
import { DEFAULT_GRAPH_SETTINGS, mergeGraphSettings } from "./graph-settings";
import {
  GraphDataCoordinator,
  type GraphCoordinatorState,
} from "./graph-data-coordinator";
import type { GraphSettings } from "./graph-types";
import type { GraphData } from "./graph-types";
import { filterGraphBySettings } from "./graph-data";
import {
  resolveGraphQueryMatches,
  type GraphQueryMatches,
} from "./graph-query-resolution";
import {
  GraphView,
  GraphViewType,
  LocalGraphView,
  LocalGraphViewType,
} from "./graph-view";

interface GraphFocusableView {
  focusActiveFile(): void;
  applyGraphSettings(settings: GraphSettings): void;
}

const GRAPH_MANIFEST: PluginManifest = {
  id: "lapis-graph",
  name: "Graph",
  version: "0.0.1",
  minAppVersion: "0.0.1",
  description: "Global and local graph views powered by indexed metadata",
  author: "Lapis Notes",
};

export class GraphPlugin extends Plugin {
  private readonly views = new Set<GraphFocusableView>();
  private readonly graphCoordinator: GraphDataCoordinator;
  private settings: GraphSettings = mergeGraphSettings(DEFAULT_GRAPH_SETTINGS);
  private settingsSaveTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingSettingsSave: GraphSettings | null = null;
  private readonly pathQueryCache = new Map<
    string,
    Promise<ReadonlySet<string>>
  >();

  constructor(
    app: App,
    manifest: PluginManifest = GRAPH_MANIFEST,
  ) {
    super(app, manifest);
    this.graphCoordinator = new GraphDataCoordinator(app);
  }

  async onload(): Promise<void> {
    await this.initializeSettings();

    this.registerView(GraphViewType, (leaf) => new GraphView(leaf, this), {
      kind: "command",
      command: {
        id: "open-graph-view",
        name: "Open graph view",
        callback: () => void this.openGraphView(false),
      },
    });
    this.registerSidebarView(
      LocalGraphViewType,
      (leaf) => new LocalGraphView(leaf, this),
      { side: "right", title: "Local graph", icon: "git-branch-plus" },
      {
        kind: "command",
        command: {
          id: "open-local-graph",
          name: "Open local graph",
          callback: () => void this.openGraphView(true),
        },
      },
    );

    this.addRibbonIcon("waypoints", "Open graph view", () => {
      void this.openGraphView(false);
    });

    this.addCommand({
      id: "focus-active-file-in-graph",
      name: "Focus active file in graph",
      callback: () => {
        this.views.forEach((view) => view.focusActiveFile());
      },
    });

    this.registerEvent(
      this.app.metadataCache.on("index-changed", (change) => {
        if (
          change.reset ||
          change.domains.includes("metadata") ||
          change.domains.includes("search")
        ) {
          this.pathQueryCache.clear();
        }
        if (change.reset || change.domains.includes("metadata")) {
          void this.graphCoordinator.requestRefresh("metadata-change", true);
        } else if (change.domains.includes("search")) {
          const snapshot = this.getSettings();
          this.views.forEach((view) => view.applyGraphSettings(snapshot));
        }
      }),
    );
    void this.graphCoordinator.start();
  }

  async onunload(): Promise<void> {
    this.graphCoordinator.dispose();
    if (this.settingsSaveTimer) clearTimeout(this.settingsSaveTimer);
    this.settingsSaveTimer = null;
    const pending = this.pendingSettingsSave;
    this.pendingSettingsSave = null;
    if (pending) await this.saveData(pending);
  }

  getSettings(): GraphSettings {
    return mergeGraphSettings(this.settings);
  }

  async updateSettings(nextSettings: GraphSettings): Promise<void> {
    this.settings = mergeGraphSettings(nextSettings);
    const snapshot = this.getSettings();
    this.views.forEach((view) => {
      view.applyGraphSettings(snapshot);
    });
    this.scheduleSettingsSave(snapshot);
  }

  subscribeToGlobalGraph(
    listener: (state: GraphCoordinatorState) => void,
  ): () => void {
    return this.graphCoordinator.subscribe(listener);
  }

  refreshGlobalGraph(force = false): Promise<void> {
    return this.graphCoordinator.requestRefresh("view-refresh", force);
  }

  async resolveGraphSettings(
    graph: GraphData,
    settings: GraphSettings,
  ): Promise<{ graph: GraphData; matches: GraphQueryMatches }> {
    const matches = await resolveGraphQueryMatches(settings, (query) =>
      this.matchSearchPaths(query),
    );
    return {
      graph: filterGraphBySettings(graph, settings, matches),
      matches,
    };
  }

  registerGraphView(view: GraphFocusableView): () => void {
    this.views.add(view);
    return () => {
      this.views.delete(view);
    };
  }

  private async initializeSettings(): Promise<void> {
    const storedData = await this.loadData();
    this.settings = mergeGraphSettings(storedData);
  }

  private scheduleSettingsSave(settings: GraphSettings): void {
    this.pendingSettingsSave = mergeGraphSettings(settings);
    if (this.settingsSaveTimer) clearTimeout(this.settingsSaveTimer);
    this.settingsSaveTimer = setTimeout(() => {
      this.settingsSaveTimer = null;
      const pending = this.pendingSettingsSave;
      this.pendingSettingsSave = null;
      if (pending) void this.saveData(pending);
    }, 180);
  }

  private matchSearchPaths(query: string): Promise<ReadonlySet<string>> {
    let cached = this.pathQueryCache.get(query);
    if (!cached) {
      cached = this.app.appDatabase
        .searchDocumentPaths(query, { mode: "lexical", limit: 50_000 })
        .then((paths) => new Set(paths));
      this.pathQueryCache.set(query, cached);
      void cached.catch(() => this.pathQueryCache.delete(query));
    }
    return cached;
  }

  private async openGraphView(local: boolean): Promise<void> {
    const viewType = local ? LocalGraphViewType : GraphViewType;
    const leaves = this.app.workspace.getLeavesOfType(viewType);
    if (leaves.length) {
      const leaf = leaves[0]!;
      this.app.workspace.activateLeaf(leaf, {
        focusRootHost: false,
        source: "api",
        operation: local ? "open-local-graph" : "open-graph-view",
      });
      await this.app.workspace.revealLeaf(leaf);
      return;
    }

    const leaf = local
      ? this.app.workspace.ensureSideLeaf(viewType, "right")
      : (this.app.workspace.getLeaf(true) as WorkspaceLeaf);
    await leaf.setViewState({ type: viewType }, { history: true });
    this.app.workspace.activateLeaf(leaf, {
      focusRootHost: false,
      source: "api",
      operation: local ? "open-local-graph" : "open-graph-view",
    });
    await this.app.workspace.revealLeaf(leaf);
  }
}

export default GraphPlugin;
