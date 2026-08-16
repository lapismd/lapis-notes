<script lang="ts">
  import { onMount, untrack } from "svelte";
  import {
    App,
    installApplicationCompatibility,
    MemoryAppDatabase,
    MemoryVaultAdapter,
    Plugin,
    type Editor,
    type PluginManifest,
  } from "@lapis-notes/api";
  import { BasesPlugin } from "@lapis-notes/bases";
  import "@lapis-notes/bases/styles.css";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import {
    WorkspaceStartup,
    type WorkspaceStartupFailure,
    type WorkspaceStartupTask,
  } from "@lapismd/design-core/workspace/startup";
  import { createFileExplorerPlugin } from "@lapis-notes/file-explorer";
  import {
    createLapisEditorDemoSeed,
    type LapisEditorDemoScenario,
  } from "./seed";
  import { SourceEditorDemoPlugin } from "./source-editor-plugin";
  import { MarkdownPlugin } from "@lapis-notes/markdown";
  import { MarkdownLintPlugin } from "@lapis-notes/markdown-lint";
  import { HistoryPlugin } from "@lapis-notes/history";
  import { SearchPlugin } from "@lapis-notes/search";
  import { watchMetadata } from "../watch-metadata";
  import "./lapis-editor-demo.css";
  import "@lapismd/mira/themes/obsidian.css";
  import "@lapismd/mira-editor/styles.css";

  let {
    scenario = "ready",
  }: {
    scenario?: LapisEditorDemoScenario;
  } = $props();

  const STARTUP_TASKS: WorkspaceStartupTask[] = [
    { id: "vault", label: "Open the in-memory vault", status: "pending" },
    { id: "configuration", label: "Load app configuration", status: "pending" },
    { id: "plugins", label: "Load required core plugins", status: "pending" },
    { id: "layout", label: "Restore the workspace layout", status: "pending" },
  ];

  const FAILURE_MANIFEST: PluginManifest = {
    id: "lapis-startup-probe",
    name: "Startup probe",
    author: "Lapis Notes",
    version: "0.0.1",
    minAppVersion: "0.0.1",
    description: "A deterministic required-plugin failure for Storybook.",
  };

  function createStartupProbePlugin(shouldFail: boolean) {
    return class StartupProbePlugin extends Plugin {
      constructor(app: App) {
        super(app, FAILURE_MANIFEST);
      }

      onload(): void {
        if (shouldFail) {
          throw new Error(
            "The startup probe could not load its editor contribution.",
          );
        }
      }
    };
  }

  const selectedScenario = untrack(() => scenario);
  let app = $state<App | null>(null);
  let adapter = $state<MemoryVaultAdapter | null>(null);
  let ready = $state(false);
  let status = $state("idle");
  let tasks = $state<WorkspaceStartupTask[]>(structuredClone(STARTUP_TASKS));
  let failure = $state<WorkspaceStartupFailure | null>(null);
  let attempt = $state(0);
  let disposed = false;
  const stopMetadataByApp = new WeakMap<App, () => void>();
  const compatibilityByApp = new WeakMap<App, () => void>();
  let targetWriteCount = $state(0);
  let targetContents = $state("");
  let lastWritePath = $state("");
  let registeredViews = $state("");
  let vaultPaths = $state("");
  let activeViewType = $state("");
  let root = $state<HTMLDivElement>();

  $effect(() => {
    if (!root || !app) return;
    const ownedRoot = root as HTMLDivElement & { __lapisApp?: App };
    ownedRoot.__lapisApp = app;
    return () => {
      if (ownedRoot.__lapisApp === app) delete ownedRoot.__lapisApp;
    };
  });

  function refreshDiagnostics(runtimeApp: App) {
    if (app !== runtimeApp) return;
    registeredViews = runtimeApp.workspace.editorViews
      .getAll()
      .map((view) => `${view.label}:${view.filenamePatterns.join(",")}`)
      .join("|");
    vaultPaths = runtimeApp.vault
      .getAllLoadedFiles()
      .map((file) => file.path)
      .sort()
      .join("|");
    activeViewType = runtimeApp.workspace.activeLeaf?.view.getViewType() ?? "";
  }

  function createRuntime(runtimeAttempt: number) {
    const runtimeAdapter = new MemoryVaultAdapter(
      createLapisEditorDemoSeed(selectedScenario),
      {
        name: "Lapis Editor Demo",
        vaultId: `lapis-editor-demo-${selectedScenario}`,
        clock: 1_700_000_000_000,
      },
    );
    const runtimeApp = new App({
      version: "0.0.1-story",
      configPath: ".obsidian/app.json",
      adapter: runtimeAdapter,
      appDatabase: new MemoryAppDatabase(
        `lapis-editor-demo-${selectedScenario}-${runtimeAttempt}`,
      ),
      workspaceShell: {
        application: { name: "Lapis Notes" },
      },
      markdownRenderer: async () => {},
    });
    runtimeApp.plugins.registerCorePlugins([
      { plugin: SourceEditorDemoPlugin, required: true },
      {
        plugin: MarkdownPlugin,
        required: false,
        enabledByDefault: true,
      },
      {
        plugin: MarkdownLintPlugin,
        required: false,
        enabledByDefault: true,
      },
      {
        plugin: SearchPlugin,
        required: false,
        enabledByDefault: true,
      },
      {
        plugin: BasesPlugin,
        required: false,
        enabledByDefault: true,
        distribution: "bundled",
      },
      {
        plugin: createFileExplorerPlugin({
          loading: selectedScenario === "explorer-opening-vault",
        }),
        required: false,
        enabledByDefault: true,
      },
      {
        plugin: HistoryPlugin,
        required: false,
        enabledByDefault: true,
      },
      ...(selectedScenario === "startup-failure"
        ? [
            {
              plugin: createStartupProbePlugin(runtimeAttempt !== 2),
              required: true,
            },
          ]
        : []),
    ]);
    runtimeAdapter.onWrite = (path, data) => {
      lastWritePath = path;
      if (path === "Notes/Welcome.md") {
        targetWriteCount += 1;
        targetContents = data;
      }
    };
    runtimeApp.vault.on("load", () => refreshDiagnostics(runtimeApp));
    runtimeApp.vault.on("create", () => refreshDiagnostics(runtimeApp));
    runtimeApp.vault.on("delete", () => refreshDiagnostics(runtimeApp));
    runtimeApp.vault.on("rename", () => refreshDiagnostics(runtimeApp));
    runtimeApp.workspace.editorViews.on("changed", () =>
      refreshDiagnostics(runtimeApp),
    );
    runtimeApp.workspace.on("active-leaf-change", () =>
      refreshDiagnostics(runtimeApp),
    );
    return { app: runtimeApp, adapter: runtimeAdapter };
  }

  // App constructs Svelte-backed workspace state, so both the initial and
  // retry runtimes are prepared during component initialization.
  const runtimes = [createRuntime(1), createRuntime(2), createRuntime(3)];

  function setTask(id: string, taskStatus: WorkspaceStartupTask["status"]) {
    tasks = tasks.map((task) =>
      task.id === id ? { ...task, status: taskStatus } : task,
    );
  }

  async function disposeApp(current: App | null): Promise<void> {
    if (!current) return;
    const destroyedEditors = new Set<Editor>();
    current.workspace.iterateAllLeaves((leaf) => {
      leaf.view.unload();
      const editor = (leaf.view as { editor?: Editor }).editor;
      if (!editor || destroyedEditors.has(editor)) return;
      destroyedEditors.add(editor);
      editor.destroy();
    });
    stopMetadataByApp.get(current)?.();
    stopMetadataByApp.delete(current);
    for (const plugin of [...current.plugins.corePlugins].reverse()) {
      await plugin.disable().catch(() => undefined);
    }
    await current.workspace.disposeWorkspaceHost();
    compatibilityByApp.get(current)?.();
    compatibilityByApp.delete(current);
  }

  async function boot(): Promise<void> {
    const oldApp = app;
    app = null;
    adapter = null;
    ready = false;
    failure = null;
    status = "booting";
    tasks = structuredClone(STARTUP_TASKS);
    targetWriteCount = 0;
    targetContents = "";
    lastWritePath = "";
    registeredViews = "";
    vaultPaths = "";
    activeViewType = "";
    await disposeApp(oldApp);
    if (disposed) return;

    attempt += 1;
    const runtime = runtimes[Math.min(attempt - 1, runtimes.length - 1)]!;
    const nextApp = runtime.app;
    const nextAdapter = runtime.adapter;
    app = nextApp;
    adapter = nextAdapter;
    compatibilityByApp.set(
      nextApp,
      installApplicationCompatibility(nextApp),
    );
    refreshDiagnostics(nextApp);

    let activeTask = "vault";
    try {
      setTask(activeTask, "active");
      await nextApp.vault.load();
      if (disposed || app !== nextApp) return;
      setTask(activeTask, "complete");

      activeTask = "configuration";
      setTask(activeTask, "active");
      await nextApp.configuration.load();
      if (disposed || app !== nextApp) return;
      setTask(activeTask, "complete");

      activeTask = "plugins";
      setTask(activeTask, "active");
      if (selectedScenario === "loading-plugins") {
        status = "loading-plugins";
        return;
      }
      await nextApp.plugins.loadPlugins({
        communityPlugins: "disabled",
        // Enable optional core plugins (Markdown, Tags) via enabledByDefault.
        optionalCorePlugins: "configured",
      });
      refreshDiagnostics(nextApp);
      const failedRequired = nextApp.plugins.corePluginEntries.filter(
        (entry) => entry.required && !entry.enabled,
      );
      if (failedRequired.length > 0) {
        throw new Error(
          failedRequired
            .map(
              (entry) =>
                `${entry.manifest.name}: ${entry.errorMessage ?? "did not enable"}`,
            )
            .join("\n"),
        );
      }
      if (disposed || app !== nextApp) return;
      setTask(activeTask, "complete");

      stopMetadataByApp.get(nextApp)?.();
      stopMetadataByApp.set(nextApp, watchMetadata(nextApp));
      await nextApp.metadataCache.load();
      if (disposed || app !== nextApp) return;

      activeTask = "layout";
      setTask(activeTask, "active");
      await nextApp.workspace.loadLayout();
      if (disposed || app !== nextApp) return;
      setTask(activeTask, "complete");
      status = "ready";
      ready = true;
    } catch (error) {
      setTask(activeTask, "failed");
      const detail = error instanceof Error ? error.message : String(error);
      status = "failed";
      failure = {
        title: "Lapis Notes could not start",
        description:
          activeTask === "plugins"
            ? "A required core plugin failed while the editor was starting."
            : "The workspace could not complete its startup sequence.",
        detail,
        actions: [
          {
            id: "retry",
            label: "Retry startup",
            icon: "refresh-cw",
            onSelect: () => boot(),
          },
        ],
      };
    }
  }

  onMount(() => {
    disposed = false;
    void boot();
    return () => {
      disposed = true;
      app = null;
      void Promise.all(runtimes.map((runtime) => disposeApp(runtime.app)));
    };
  });
</script>

<div
  bind:this={root}
  class="lapis-editor-demo"
  data-ui-component="lapis-editor-demo"
  data-testid="lapis-editor-demo"
  data-scenario={selectedScenario}
>
  {#if ready && app}
    <WorkspaceShell {app} displayMode="desktop" workspaceLabel="Lapis Notes" />
  {:else}
    <WorkspaceStartup
      title="Opening Lapis Notes"
      {tasks}
      {failure}
      class="lapis-editor-demo__startup"
    />
  {/if}

  <div class="lapis-editor-demo__observer" aria-live="polite">
    <span data-testid="lapis-editor-status">{status}</span>
    <span data-testid="lapis-editor-attempt">{attempt}</span>
    <span data-testid="lapis-editor-target-write-count">{targetWriteCount}</span
    >
    <span data-testid="lapis-editor-last-write-path">{lastWritePath}</span>
    <output data-testid="lapis-editor-target-contents">{targetContents}</output>
    <output data-testid="lapis-editor-registered-views">
      {registeredViews}
    </output>
    <output data-testid="lapis-editor-vault-paths">
      {vaultPaths}
    </output>
    <output data-testid="lapis-editor-active-view">{activeViewType}</output>
    {#if selectedScenario === "startup-failure"}
      <button
        type="button"
        data-testid="lapis-editor-replay-failure"
        onclick={() => boot()}
      >
        Replay startup failure
      </button>
    {/if}
  </div>
</div>
