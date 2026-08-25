<script lang="ts">
  import {
    App,
    installApplicationCompatibility,
    listVaultProfiles,
    provideApplicationState,
    type NativeDesktopVaultAdapter,
    type VaultProfile,
    type VaultSession,
  } from "@lapis-notes/api";
  import { AiPlugin } from "@lapis-notes/ai";
  import "@lapis-notes/ai/styles.css";
  import { BasesPlugin } from "@lapis-notes/bases";
  import "@lapis-notes/bases/styles.css";
  import { BookmarksPlugin } from "@lapis-notes/bookmarks";
  import { FileExplorerPlugin } from "@lapis-notes/file-explorer";
  import { HistoryPlugin } from "@lapis-notes/history";
  import { RolesPlugin } from "@lapis-notes/lapis-plugin-cv-roles";
  import { TerminalPlugin } from "@lapis-notes/lapis-plugin-terminal";
  import { MarkdownPlugin } from "@lapis-notes/markdown";
  import { MarkdownLintPlugin } from "@lapis-notes/markdown-lint";
  import { SearchPlugin } from "@lapis-notes/search";
  import { SpellcheckPlugin } from "@lapis-notes/spellcheck";
  import { WordCountPlugin } from "@lapis-notes/wordcount";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import type { WorkspaceNavigation } from "@lapismd/design-core/workspace/app-shell";
  import {
    WorkspaceStartup,
    type WorkspaceStartupFailure,
    type WorkspaceStartupTask,
  } from "@lapismd/design-core/workspace/startup";
  import { onMount, untrack } from "svelte";
  import { getVaultProfileLocation } from "./desktop-vault-profiles";
  import { createDenoPluginAssetServer } from "./deno-plugin-asset-server";
  import type { DenoDesktopBridge, DesktopAppInfo } from "./main";

  let {
    adapter,
    profile,
    session,
    appInfo,
    bridge,
    onReady,
    onOpenRecent,
    onManageVaults,
  }: {
    adapter: NativeDesktopVaultAdapter;
    profile: VaultProfile;
    session: VaultSession;
    appInfo: DesktopAppInfo;
    bridge: DenoDesktopBridge;
    onReady(app: App): void;
    onOpenRecent(profile: VaultProfile): Promise<void>;
    onManageVaults(): Promise<void>;
  } = $props();

  const STARTUP_TASKS: WorkspaceStartupTask[] = [
    { id: "vault", label: "Open the vault", status: "pending" },
    { id: "configuration", label: "Load app configuration", status: "pending" },
    { id: "plugins", label: "Load configured core plugins", status: "pending" },
    { id: "layout", label: "Restore the workspace layout", status: "pending" },
  ];

  const pluginAssetServer = untrack(() =>
    createDenoPluginAssetServer({ adapter, bridge }),
  );
  const app = untrack(
    () =>
      new App({
        version: appInfo.version,
        configPath: ".obsidian/app.json",
        session,
        pluginAssetServer,
        workspaceShell: { application: appInfo, notifications: true },
        markdownRenderer: async () => {},
      }),
  );
  provideApplicationState(app);
  const disposeApplicationCompatibility =
    installApplicationCompatibility(app);
  let ready = $state(false);
  let tasks = $state<WorkspaceStartupTask[]>(structuredClone(STARTUP_TASKS));
  let failure = $state<WorkspaceStartupFailure | null>(null);
  let disposed = false;
  let booting = false;
  let corePluginsRegistered = false;
  let stopMetadataTracking: (() => void) | null = null;
  let recentVaults = $state.raw<VaultProfile[]>([]);
  let workspaceNavigation = $derived.by<WorkspaceNavigation>(() => {
    const desktopProfiles = recentVaults.filter(
      (candidate) => candidate.kind === "desktop-folder",
    );
    const profiles = (
      desktopProfiles.some((candidate) => candidate.id === profile.id)
        ? desktopProfiles
        : [profile, ...desktopProfiles]
    ).slice(0, 8);
    return {
      currentLabel: profile.name,
      menuLabel: "Recent vaults",
      items: profiles.map((candidate) => ({
        id: candidate.id,
        label: candidate.name,
        description: getVaultProfileLocation(candidate),
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
    void loadRecentVaults();
    void initialize();
    return () => {
      void dispose(false);
    };
  });

  async function loadRecentVaults(): Promise<void> {
    try {
      recentVaults = await listVaultProfiles();
    } catch {
      recentVaults = [];
    }
  }

  async function reportAcceptance(
    result: Record<string, unknown>,
  ): Promise<void> {
    if (bridge.platform.acceptance !== true) return;
    try {
      await bridge.invoke("desktop_acceptance_report", result);
    } catch (error) {
      console.error("[lapis-deno] acceptance report failed", error);
    }
  }

  async function collectAcceptanceEvidence(): Promise<
    Record<string, unknown>
  > {
    if (bridge.platform.acceptance !== true) return {};
    const diagnostics = await bridge.invoke<unknown[]>(
      "desktop_ls_diagnostics",
      {
        protocolVersion: 1,
        document: {
          uri: "vault://Welcome.md",
          languageId: "markdown",
          text: "#Heading\n",
          version: 1,
        },
      },
    );
    const pluginAssetUrl = await pluginAssetServer.getPluginAssetUrl({
      pluginId: "deno-smoke-extension",
      pluginPath: ".obsidian/plugins/deno-smoke-extension",
      relativePath: "main.mjs",
      version: "1.0.0",
    });
    const pluginAssetResponse = await fetch(pluginAssetUrl);
    const pluginAssetText = await pluginAssetResponse.text();
    if (!pluginAssetResponse.ok) {
      throw new Error(
        `Deno plugin asset acceptance failed (${pluginAssetResponse.status})`,
      );
    }
    const appUrl = await bridge.waitForAcceptanceAppUrl?.();
    const appToolBridge = await bridge.invoke<{ bridgeId: string }>(
      "desktop_agent_tools_open",
      {
        bindingId: "deno-acceptance-binding",
        conversationId: "deno-acceptance-conversation",
        descriptors: [],
      },
    );
    await bridge.invoke("desktop_agent_tools_close", {
      bridgeId: appToolBridge.bridgeId,
    });
    let agentProcessOutput = "";
    let agentTimeout: ReturnType<typeof setTimeout> | undefined;
    let unsubscribeAgent: (() => void) | undefined;
    try {
      let resolveAgent: () => void = () => {};
      let rejectAgent: (error: Error) => void = () => {};
      let processId = "";
      const agentExit = new Promise<void>((resolve, reject) => {
        resolveAgent = resolve;
        rejectAgent = reject;
        agentTimeout = setTimeout(
          () => reject(new Error("Deno agent process acceptance timed out")),
          10_000,
        );
      });
      unsubscribeAgent = bridge.onAgentProcessMessage?.((event) => {
        if (!processId) processId = event.processId;
        if (event.processId !== processId) return;
        if (event.type === "stdout") agentProcessOutput += event.data ?? "";
        if (event.type === "stderr") {
          rejectAgent(new Error(event.data ?? "Deno agent process failed"));
        }
        if (event.type === "exit") resolveAgent();
      });
      const command =
        bridge.platform.os === "windows" ? "cmd.exe" : "/usr/bin/printf";
      const args =
        bridge.platform.os === "windows"
          ? ["/d", "/s", "/c", "<nul set /p =deno-agent-process"]
          : ["deno-agent-process"];
      const spawned = await bridge.invoke<{ processId: string }>(
        "desktop_agent_process_spawn",
        { command, args },
      );
      processId = spawned.processId;
      await agentExit;
    } finally {
      if (agentTimeout !== undefined) clearTimeout(agentTimeout);
      unsubscribeAgent?.();
    }
    const watchPath = "deno-watch-smoke.tmp";
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let watchSubscription: { close(): void } | null | void = null;
    try {
      let resolveWatch: (type: string) => void = () => {};
      let rejectWatch: (error: Error) => void = () => {};
      const watchEvent = new Promise<string>((resolve, reject) => {
        resolveWatch = resolve;
        rejectWatch = reject;
        timeout = setTimeout(
          () => reject(new Error("Deno file-watch acceptance timed out")),
          10_000,
        );
      });
      watchSubscription = adapter.watch(
        "",
        { recursive: true },
        (event) => {
          if (event.type === "error") {
            rejectWatch(new Error(String(event.error)));
            return;
          }
          if (event.path === watchPath) resolveWatch(event.type);
        },
      );
      await new Promise((resolve) => setTimeout(resolve, 100));
      await adapter.write(watchPath, "watch acceptance\n");
      return {
        languageDiagnosticCount: Array.isArray(diagnostics)
          ? diagnostics.length
          : 0,
        fileWatchEventType: await watchEvent,
        pluginAssetText,
        pluginAssetContentType:
          pluginAssetResponse.headers.get("content-type") ?? "",
        agentProcessOutput,
        appToolBridgeOpened: Boolean(appToolBridge.bridgeId),
        appUrl,
      };
    } finally {
      if (timeout !== undefined) clearTimeout(timeout);
      watchSubscription?.close();
      await adapter.remove(watchPath).catch(() => undefined);
    }
  }

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

  async function teardownPartialBoot(): Promise<void> {
    ready = false;
    stopMetadataTracking?.();
    stopMetadataTracking = null;
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
      if (!corePluginsRegistered) {
        app.plugins.registerCorePlugins([
          { plugin: MarkdownPlugin, required: false, enabledByDefault: true },
          { plugin: MarkdownLintPlugin, required: false, enabledByDefault: true },
          { plugin: SpellcheckPlugin, required: false, enabledByDefault: true },
          { plugin: FileExplorerPlugin, required: false, enabledByDefault: true },
          { plugin: SearchPlugin, required: false, enabledByDefault: true },
          { plugin: BookmarksPlugin, required: false, enabledByDefault: true },
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
      if (disposed) return;
      setTask(activeTask, "complete");
      ready = true;
      onReady(app);
      startMetadataCache();
      console.info("[lapis-deno] workspace ready");
      await reportAcceptance({
        ok: true,
        runtime: bridge.runtime,
        vault: app.vault.getName(),
        plugins: [...app.plugins.plugins.keys()].sort(),
        database: app.appDatabase.descriptor,
        capabilities: bridge.capabilities,
        protocol: globalThis.location.protocol,
        crossOriginIsolated: globalThis.crossOriginIsolated,
        ...(await collectAcceptanceEvidence()),
      });
      if (bridge.platform.acceptance === true) {
        await bridge.invoke("desktop_acceptance_request_close");
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
      await reportAcceptance({ ok: false, activeTask, detail });
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
      await session.close();
    } finally {
      disposeApplicationCompatibility();
    }
  }
</script>

<section
  class="desktop-host__workspace"
  data-native-runtime="deno-desktop"
  data-vault-id={profile.id}
>
  {#if ready}
    <WorkspaceShell
      {app}
      displayMode="desktop"
      workspaceLabel={profile.name}
      {workspaceNavigation}
    />
  {:else}
    <WorkspaceStartup title="Opening Lapis Notes" {tasks} {failure} />
  {/if}
</section>
