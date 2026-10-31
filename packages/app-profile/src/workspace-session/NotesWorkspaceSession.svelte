<script lang="ts">
  import { provideApplicationState, type VaultProfile } from "@lapis-notes/api";
  import { DEFAULT_APP_STATE_DIRECTORY } from "@lapis-notes/api/path";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import type { WorkspaceNavigation } from "@lapismd/design-core/workspace/app-shell";
  import {
    WorkspaceStartup,
    type WorkspaceStartupFailure,
    type WorkspaceStartupTask,
  } from "@lapismd/design-core/workspace/startup";
  import { onMount, untrack } from "svelte";
  import { notesPluginProfile } from "../index";
  import { createNativeChatPlugin } from "../native-chat/plugin";
  import { registerNativeRepository } from "../native-repository";
  import { createNotesApplication } from "./application";
  import { registerSessionDatabaseStatus } from "./database-status";
  import { createNotesSessionLifecycle } from "./lifecycle";
  import type { NotesWorkspaceSessionProps } from "./types";

  let options: NotesWorkspaceSessionProps = $props();
  const application = untrack(() => createNotesApplication(options));
  const { app } = application;
  provideApplicationState(app);
  const startupTasks: WorkspaceStartupTask[] = [
    { id: "vault", label: "Open the vault", status: "pending" },
    { id: "configuration", label: "Load app configuration", status: "pending" },
    { id: "plugins", label: "Load configured core plugins", status: "pending" },
    { id: "layout", label: "Restore the workspace layout", status: "pending" },
  ];
  let ready = $state(false);
  let tasks = $state(structuredClone(startupTasks));
  let failure = $state<WorkspaceStartupFailure | null>(null);
  let booting = false;
  let bootFlight: Promise<void> | undefined;
  let corePluginsRegistered = false;
  let stopMetadataTracking: (() => void) | undefined;
  let releaseDatabase: (() => void) | undefined;
  let releaseConfiguration: (() => void) | undefined;
  let releaseRepository: (() => void) | undefined;
  let recentVaults = $state.raw<VaultProfile[]>([]);
  const lifecycle = createNotesSessionLifecycle({
    app,
    session: untrack(() => options.session),
    fence: () => {
      ready = false;
    },
    releaseObservers,
    releaseServices: application.disposeServices,
    releaseHostServices: application.disposeHostServices,
    releaseApplication: () => {
      releaseRepository?.();
      application.release();
    },
  });

  const workspaceNavigation = $derived.by<WorkspaceNavigation>(() => {
    const profile = options.profile;
    const candidates = recentVaults.filter(
      (candidate) => candidate.kind !== "desktop-folder",
    );
    const profiles = (
      candidates.some((candidate) => candidate.id === profile.id)
        ? candidates
        : [profile, ...candidates]
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
        if (selected) return options.onOpenRecent(selected);
      },
      onManage: () => options.onManageVaults(),
    };
  });

  onMount(() => {
    void initialize();
    return () => {
      void dispose(false);
    };
  });

  function releaseObservers(): void {
    stopMetadataTracking?.();
    releaseDatabase?.();
    releaseConfiguration?.();
    stopMetadataTracking = releaseDatabase = releaseConfiguration = undefined;
  }

  function startMetadataCache(): void {
    if (!lifecycle.canRecoverLeave() || stopMetadataTracking) return;
    stopMetadataTracking = app.metadataTypeManager.trackChanges();
    void app.metadataCache.load();
  }

  function setTask(
    id: string,
    status: WorkspaceStartupTask["status"],
    detail?: string,
  ): void {
    tasks = tasks.map((task) =>
      task.id === id
        ? { ...task, status, detail: status === "active" ? detail : undefined }
        : task,
    );
  }

  async function teardownPartialBoot(): Promise<void> {
    ready = false;
    releaseObservers();
    await app.vaultChanges.stop();
    for (const plugin of [...app.plugins.plugins.values()].reverse()) {
      await plugin.disable();
    }
  }

  function initialize(retry = false): Promise<void> {
    if (bootFlight) return bootFlight;
    bootFlight = start(retry).finally(() => {
      bootFlight = undefined;
    });
    return bootFlight;
  }

  async function start(retry: boolean): Promise<void> {
    if (!lifecycle.canRecoverLeave() || booting) return;
    booting = true;
    failure = null;
    tasks = structuredClone(startupTasks);
    let activeTask = "vault";
    try {
      if (corePluginsRegistered || stopMetadataTracking)
        await teardownPartialBoot();
      if (!lifecycle.canRecoverLeave()) return;
      setTask(activeTask, "active");
      if (!corePluginsRegistered) {
        app.plugins.registerStaticPlugins(notesPluginProfile);
        if (options.repositoryFactory) {
          releaseRepository = registerNativeRepository(
            app,
            options.repositoryFactory,
          );
        }
        if (options.nativeChat)
          app.plugins.registerStaticPlugins([
            {
              plugin: createNativeChatPlugin(options.nativeChat),
              required: false,
              enabledByDefault: false,
            },
          ]);
        corePluginsRegistered = true;
      }
      await app.vault.load({ retry });
      await application.syncHost.ready({ retry });
      await app.vault.mkpath(DEFAULT_APP_STATE_DIRECTORY);
      if (!lifecycle.canRecoverLeave()) return;
      setTask(activeTask, "complete");
      activeTask = "configuration";
      setTask(activeTask, "active");
      await app.configuration.load();
      releaseConfiguration =
        (await options.host?.configure?.(app)) ?? undefined;
      if (!lifecycle.canRecoverLeave()) return;
      setTask(activeTask, "complete");
      activeTask = "plugins";
      setTask(activeTask, "active");
      await app.plugins.loadPlugins({
        communityPlugins: "configured",
        optionalCorePlugins: "configured",
        onProgress: ({ name }) =>
          setTask(activeTask, "active", `Loading ${name}`),
      });
      if (!lifecycle.canRecoverLeave()) return;
      setTask(activeTask, "complete");
      activeTask = "layout";
      setTask(activeTask, "active");
      await app.workspace.loadLayout();
      recentVaults = await options.listProfiles();
      releaseDatabase = registerSessionDatabaseStatus(
        app,
        options.session,
        options.runtime,
      );
      await app.vaultChanges.start();
      if (!lifecycle.canRecoverLeave()) return;
      setTask(activeTask, "complete");
      ready = true;
      await options.onReady(app);
      startMetadataCache();
    } catch (error) {
      ready = false;
      setTask(activeTask, "failed");
      failure = {
        title: "Lapis Notes could not start",
        description:
          activeTask === "plugins"
            ? "A configured core plugin failed while the workspace was starting."
            : "The workspace could not complete its startup sequence.",
        detail: error instanceof Error ? error.message : String(error),
        actions: [
          {
            id: "retry",
            label: "Retry",
            icon: "refresh-cw",
            onSelect: () => initialize(true),
          },
        ],
      };
    } finally {
      booting = false;
    }
  }

  export const persistLayout = lifecycle.persistLayout;
  export const canRecoverLeave = lifecycle.canRecoverLeave;
  export async function dispose(persist: boolean): Promise<void> {
    await bootFlight;
    await lifecycle.dispose(persist);
  }
</script>

<section
  class="notes-workspace-session"
  data-notes-session-ready={ready}
  data-web-runtime={options.runtime}
  data-vault-id={options.profile.id}
  aria-label="Notes workspace"
  role="group"
>
  {#if ready}
    <WorkspaceShell
      {app}
      displayMode="desktop"
      workspaceLabel={options.profile.name}
      {workspaceNavigation}
    />
  {:else}
    <WorkspaceStartup title="Opening Lapis Notes" {tasks} {failure} />
  {/if}
</section>

<style>
  .notes-workspace-session {
    display: grid;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }
</style>
