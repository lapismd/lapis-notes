<script lang="ts">
  import {
    App,
    installApplicationCompatibility,
    listVaultProfiles,
    provideApplicationState,
    type BrowserCoordinatedAppDatabase,
    type VaultAdapter,
    type VaultProfile,
    type VaultSession,
  } from "@lapis-notes/api";
  import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
  import { AiPlugin } from "@lapis-notes/ai";
  import "@lapis-notes/ai/styles.css";
  import { BasesPlugin } from "@lapis-notes/bases";
  import "@lapis-notes/bases/styles.css";
  import { FileExplorerPlugin } from "@lapis-notes/file-explorer";
  import { MarkdownPlugin } from "@lapis-notes/markdown";
  import { MarkdownLintPlugin } from "@lapis-notes/markdown-lint";
  import { SpellcheckPlugin } from "@lapis-notes/spellcheck";
  import { RolesPlugin } from "@lapis-notes/lapis-plugin-cv-roles";
  import { TerminalPlugin } from "@lapis-notes/lapis-plugin-terminal";
  import { HistoryPlugin } from "@lapis-notes/history";
  import { SearchPlugin } from "@lapis-notes/search";
  import { WordCountPlugin } from "@lapis-notes/wordcount";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import type { WorkspaceNavigation } from "@lapismd/design-core/workspace/app-shell";
  import {
    WorkspaceStartup,
    type WorkspaceStartupFailure,
    type WorkspaceStartupTask,
  } from "@lapismd/design-core/workspace/startup";
  import { onMount, untrack } from "svelte";
  import { registerWebAgentRuntimeBridge } from "./agent-runtime-attach";
  import {
    registerWebAgentRuntimeSettings,
    syncWebAgentRuntime,
  } from "./agent-runtime-settings";
  import { registerWebTerminalRuntimeBridge } from "./terminal-runtime-attach";
  import {
    registerWebTerminalRuntimeSettings,
    syncWebTerminalRuntime,
  } from "./terminal-runtime-settings";
  import { registerWebVaultTransferSettings } from "./vault-transfer-settings";
  import { createWebPluginAssetServer } from "./plugin-asset-server";
  import { setPwaRuntimeApplication } from "./pwa";

  let {
    adapter,
    profile,
    session,
    onReady,
    onOpenRecent,
    onManageVaults,
  }: {
    adapter: VaultAdapter;
    profile: VaultProfile;
    session: VaultSession;
    onReady(): void;
    onOpenRecent(profile: VaultProfile): Promise<void>;
    onManageVaults(): Promise<void>;
  } = $props();

  const STARTUP_TASKS: WorkspaceStartupTask[] = [
    { id: "vault", label: "Open the vault", status: "pending" },
    { id: "configuration", label: "Load app configuration", status: "pending" },
    { id: "plugins", label: "Load configured core plugins", status: "pending" },
    { id: "layout", label: "Restore the workspace layout", status: "pending" },
  ];

  const app = untrack(
    () =>
      new App({
        version: "2026.6.3",
        configPath: ".obsidian/app.json",
        session,
        pluginAssetServer: createWebPluginAssetServer({ adapter }),
        workspaceShell: {
          application: {
            name: "Lapis Notes",
            buildTime: null,
            copyright: "Copyright © Lapis Notes contributors.",
          },
          notifications: true,
        },
        markdownRenderer: async () => {},
      }),
  );
  provideApplicationState(app);
  const disposeApplicationCompatibility =
    installApplicationCompatibility(app);
  const disposePwaRuntimeApplication = setPwaRuntimeApplication(app);
  let ready = $state(false);
  let tasks = $state<WorkspaceStartupTask[]>(structuredClone(STARTUP_TASKS));
  let failure = $state<WorkspaceStartupFailure | null>(null);
  let disposed = false;
  let booting = false;
  let corePluginsRegistered = false;
  let stopMetadataTracking: (() => void) | null = null;
  let disposeDatabaseStatus: (() => void) | null = null;
  let disposeCoordinationListener: (() => void) | null = null;
  let disposeAgentRuntimeSettings: (() => void) | null = null;
  let disposeTerminalRuntimeSettings: (() => void) | null = null;
  let disposeVaultTransferSettings: (() => void) | null = null;
  let recentVaults = $state.raw<VaultProfile[]>([]);
  let workspaceNavigation = $derived.by<WorkspaceNavigation>(() => {
    const browserProfiles = recentVaults.filter(
      (candidate) => candidate.kind !== "desktop-folder",
    );
    const profiles = (
      browserProfiles.some((candidate) => candidate.id === profile.id)
        ? browserProfiles
        : [profile, ...browserProfiles]
    ).slice(0, 8);
    return {
      currentLabel: profile.name,
      menuLabel: "Recent vaults",
      items: profiles.map((candidate) => ({
        id: candidate.id,
        label: candidate.name,
        description: candidate.kind,
        disabled: candidate.id === profile.id,
      })),
      emptyLabel: "No recent vaults",
      manageLabel: "Manage Vaults",
      onSelect: (item) => {
        const selected = profiles.find((candidate) => candidate.id === item.id);
        if (selected) return onOpenRecent(selected);
      },
      onManage: onManageVaults,
    };
  });

  onMount(() => {
    void initialize();
    return () => {
      void dispose(false);
    };
  });

  function startMetadataCache(): void {
    if (disposed || stopMetadataTracking) return;
    stopMetadataTracking = app.metadataTypeManager.trackChanges();
    void app.metadataCache.load();
  }

  function setTask(
    id: string,
    taskStatus: WorkspaceStartupTask["status"],
    detail?: string,
  ): void {
    tasks = tasks.map((task) =>
      task.id === id
        ? {
            ...task,
            status: taskStatus,
            detail: taskStatus === "active" ? detail : undefined,
          }
        : task,
    );
  }

  function syncDatabaseStatus(role: "owner" | "proxy"): void {
    disposeDatabaseStatus?.();
    disposeDatabaseStatus = getWorkspaceHostBinding(
      app.workspace,
    ).controller.status.addItem({
      id: "app:web-database-role",
      label: role === "proxy" ? "DB Proxy" : "DB Owner",
      icon: "database",
      tooltip:
        role === "proxy"
          ? "Database requests are delegated to this vault's owner tab."
          : "This tab owns the local Turso database for this vault.",
      align: "right",
      priority: 850,
    });
  }

  function registerDatabaseStatus(): void {
    const role = session.appDatabase?.descriptor.role === "proxy" ? "proxy" : "owner";
    syncDatabaseStatus(role);
    const coordinated = session.appDatabase as BrowserCoordinatedAppDatabase & {
      onCoordinationModeChange?: (
        listener: (mode: "turso-owner" | "turso-proxy") => void,
      ) => () => void;
    };
    disposeCoordinationListener = coordinated.onCoordinationModeChange?.(
      (mode) => syncDatabaseStatus(mode === "turso-proxy" ? "proxy" : "owner"),
    ) ?? null;
  }

  async function teardownPartialBoot(): Promise<void> {
    ready = false;
    stopMetadataTracking?.();
    stopMetadataTracking = null;
    disposeCoordinationListener?.();
    disposeDatabaseStatus?.();
    disposeAgentRuntimeSettings?.();
    disposeTerminalRuntimeSettings?.();
    disposeVaultTransferSettings?.();
    disposeCoordinationListener = null;
    disposeDatabaseStatus = null;
    disposeAgentRuntimeSettings = null;
    disposeTerminalRuntimeSettings = null;
    disposeVaultTransferSettings = null;
    await app.workspace.disposeWorkspaceHost().catch(() => undefined);
    await app.metadataCache.dispose().catch(() => undefined);
    for (const plugin of [...app.plugins.corePlugins].reverse()) {
      await plugin.disable().catch(() => undefined);
    }
  }

  async function initialize(): Promise<void> {
    if (disposed || booting) return;
    booting = true;
    failure = null;
    tasks = structuredClone(STARTUP_TASKS);
    let activeTask = "vault";
    try {
      if (corePluginsRegistered || stopMetadataTracking) {
        await teardownPartialBoot();
      }
      if (disposed) return;

      setTask(activeTask, "active");
      registerWebAgentRuntimeBridge();
      registerWebTerminalRuntimeBridge();
      if (!corePluginsRegistered) {
        app.plugins.registerCorePlugins([
          { plugin: MarkdownPlugin, required: false, enabledByDefault: true },
          { plugin: MarkdownLintPlugin, required: false, enabledByDefault: true },
          { plugin: SpellcheckPlugin, required: false, enabledByDefault: true },
          { plugin: FileExplorerPlugin, required: false, enabledByDefault: true },
          { plugin: SearchPlugin, required: false, enabledByDefault: true },
          { plugin: HistoryPlugin, required: false, enabledByDefault: true },
          { plugin: WordCountPlugin, required: false, enabledByDefault: true },
          {
            plugin: BasesPlugin,
            required: false,
            enabledByDefault: true,
            distribution: "bundled",
          },
          {
            plugin: AiPlugin,
            required: false,
            enabledByDefault: true,
            distribution: "bundled",
          },
          {
            plugin: TerminalPlugin,
            required: false,
            enabledByDefault: true,
            distribution: "first-party-external",
          },
          {
            plugin: RolesPlugin,
            required: false,
            enabledByDefault: true,
            distribution: "first-party-external",
          },
        ]);
        corePluginsRegistered = true;
      }
      await app.vault.load();
      await app.vault.mkpath(".obsidian");
      if (disposed) return;
      setTask(activeTask, "complete");

      activeTask = "configuration";
      setTask(activeTask, "active");
      await app.configuration.load();
      disposeAgentRuntimeSettings?.();
      disposeTerminalRuntimeSettings?.();
      disposeVaultTransferSettings?.();
      disposeAgentRuntimeSettings = registerWebAgentRuntimeSettings(app);
      disposeTerminalRuntimeSettings = registerWebTerminalRuntimeSettings(app);
      disposeVaultTransferSettings = registerWebVaultTransferSettings(app);
      syncWebAgentRuntime(app);
      syncWebTerminalRuntime(app);
      if (disposed) return;
      setTask(activeTask, "complete");

      activeTask = "plugins";
      setTask(activeTask, "active");
      await app.plugins.loadPlugins({
        communityPlugins: "disabled",
        optionalCorePlugins: "configured",
        onProgress: ({ name }) => {
          setTask(activeTask, "active", `Loading ${name}`);
        },
      });
      if (disposed) return;
      setTask(activeTask, "complete");

      activeTask = "layout";
      setTask(activeTask, "active");
      await app.workspace.loadLayout();
      recentVaults = await listVaultProfiles();
      registerDatabaseStatus();
      if (disposed) return;
      setTask(activeTask, "complete");
      ready = true;
      onReady();
      startMetadataCache();
      const launch = new URL(window.location.href);
      if (launch.pathname === "/open") {
        const url = launch.searchParams.get("url");
        if (url) await app.urls.dispatch(url);
      }
    } catch (error) {
      setTask(activeTask, "failed");
      const detail = error instanceof Error ? error.message : String(error);
      failure = {
        title: "Lapis Notes could not start",
        description:
          activeTask === "plugins"
            ? "A configured core plugin failed while the workspace was starting."
            : "The workspace could not complete its startup sequence.",
        detail,
        actions: [
          {
            id: "retry",
            label: "Retry",
            icon: "refresh-cw",
            onSelect: () => initialize(),
          },
        ],
      };
    } finally {
      booting = false;
    }
  }

  async function writeWorkspaceLayout(): Promise<void> {
    if (!app.workspace.layoutReady) return;
    const serializedLayout = JSON.stringify(app.workspace.getLayout(), null, 2);
    await session.vaultAdapter.mkdir(".obsidian", { recursive: true });
    await session.vaultAdapter.write(
      ".obsidian/workspace.json",
      serializedLayout,
    );
  }

  export async function persistLayout(): Promise<void> {
    if (disposed) return;
    await writeWorkspaceLayout();
  }

  export async function dispose(persistLayout: boolean): Promise<void> {
    if (disposed) return;
    disposed = true;
    try {
      if (persistLayout) await writeWorkspaceLayout();
      ready = false;
      await app.workspace.disposeWorkspaceHost();
      stopMetadataTracking?.();
      stopMetadataTracking = null;
      await app.metadataCache.dispose();
      for (const plugin of [...app.plugins.corePlugins].reverse()) {
        await plugin.disable().catch(() => undefined);
      }
      disposeCoordinationListener?.();
      disposeDatabaseStatus?.();
      disposeAgentRuntimeSettings?.();
      disposeTerminalRuntimeSettings?.();
      disposeVaultTransferSettings?.();
      disposeCoordinationListener = null;
      disposeDatabaseStatus = null;
      disposeAgentRuntimeSettings = null;
      disposeTerminalRuntimeSettings = null;
      disposeVaultTransferSettings = null;
      await session.close();
    } finally {
      disposePwaRuntimeApplication();
      disposeApplicationCompatibility();
    }
  }
</script>

<section class="web-host__workspace" data-web-runtime="web-pwa" data-vault-id={profile.id}>
  {#if ready}
    <WorkspaceShell
      {app}
      displayMode="desktop"
      workspaceLabel={profile.name}
      {workspaceNavigation}
    />
  {:else}
    <WorkspaceStartup
      title="Opening Lapis Notes"
      {tasks}
      {failure}
    />
  {/if}
</section>
