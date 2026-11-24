<script lang="ts">
  import {
    App,
    MemoryAppDatabase,
    MemoryVaultAdapter,
    type BackgroundJobSnapshot,
    type BackgroundJobCommand,
  } from "@lapis-notes/api";
  import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
  import { registerPluginManagementSettings } from "@lapis-notes/workspace";
  import { WorkspaceSettingsSurface } from "@lapismd/design-core/workspace/settings";
  import { onMount } from "svelte";
  let { fail = false }: { fail?: boolean } = $props();
  let lastCommand = $state("");
  let snapshot: BackgroundJobSnapshot = {
    revision: 0,
    runnerId: "89b52d9a-2fe1-43f1-877f-09581c5533c6",
    vaultId: "6c9a720b-21d6-46fd-8326-5640693cd1fd",
    nativeNotificationsAvailable: true,
    trusted: true,
    safeMode: false,
    transfer: null,
    jobs: [
      {
        pluginId: "example",
        fingerprint: "a".repeat(64),
        configuration: null,
        phase: "paused",
        runs: [],
        nextRunAt: null,
        unavailableReason: null,
        descriptor: {
          id: "refresh",
          title: "Refresh saved data",
          description: "Check saved vault metadata on a schedule.",
          entry: "jobs/refresh.js",
          schedule: { kind: "interval", seconds: 300 },
          permissions: {
            metadataRead: true,
            frontmatterRead: false,
            notifications: true,
            frontmatterFields: [],
          },
        },
      },
    ],
  };
  const app = new App({
    version: "0.1.0-story",
    configPath: ".lapis/app.json",
    adapter: new MemoryVaultAdapter(),
    appDatabase: new MemoryAppDatabase("background-jobs-story"),
    nativeBackgroundJobs: {
      async call(command: BackgroundJobCommand) {
        if (command.kind !== "list") {
          lastCommand = JSON.stringify(command);
          if (fail)
            throw new Error(
              "The native runner is unavailable. Refresh status before retrying.",
            );
          const job = snapshot.jobs[0];
          if (command.kind === "configure") {
            job.configuration = command.configuration;
            job.phase = command.configuration.enabled ? "ready" : "paused";
          }
          if (command.kind === "pause" && job.configuration) {
            job.configuration.enabled = false;
            job.phase = "paused";
          }
          if (command.kind === "runNow") job.phase = "completed";
          snapshot.revision++;
        }
        return JSON.parse(JSON.stringify(snapshot)) as BackgroundJobSnapshot;
      },
    },
  });
  const dispose = registerPluginManagementSettings(app);
  const controller = getWorkspaceHostBinding(app.workspace).controller.settings;
  controller.selectSection("background-jobs");
  controller.open();
  let ready = $state(false);
  onMount(() => {
    let disposed = false;
    void app
      .backgroundJobs!.initialize({ trusted: true, safeMode: false })
      .then(() => {
        if (!disposed) ready = true;
      });
    return () => {
      disposed = true;
      dispose();
      void (async () => {
        await app.backgroundJobs?.detach();
        await app.workspace.disposeWorkspaceHost();
        await app.metadataCache.dispose();
        await app.appDatabase.close();
      })();
    };
  });
</script>

<div data-ready={ready || undefined}>
  {#if ready}<WorkspaceSettingsSurface {controller} />{/if}
  <output class="sr-only" data-testid="job-command">{lastCommand}</output>
</div>
