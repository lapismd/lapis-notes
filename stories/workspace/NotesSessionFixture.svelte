<script lang="ts" module>
  const disposers = new Set<() => Promise<void>>();
  const readyGates = new Set<() => void>();
  export function releaseNotesSessionReadiness() {
    for (const release of readyGates) release();
    readyGates.clear();
  }
  export async function disposeNotesSessionFixtures() {
    for (const dispose of disposers) await dispose();
    disposers.clear();
  }
</script>

<script lang="ts">
  import {
    createVaultSession,
    MemoryAppDatabase,
    MemoryVaultAdapter,
    Plugin,
    type App,
    type VaultSession,
    type VaultProfile,
  } from "@lapis-notes/api";
  import {
    NotesWorkspaceSession,
    type NotesWorkspaceSessionHandle,
  } from "@lapis-notes/app-profile/workspace-session";
  import { onMount } from "svelte";

  let {
    failOnce = false,
    nativeRepository = false,
    holdReady = false,
    probePluginProgress = false,
  }: {
    failOnce?: boolean;
    nativeRepository?: boolean;
    holdReady?: boolean;
    probePluginProgress?: boolean;
  } = $props();
  const unselectedReader = async (): Promise<never> => {
    throw new Error("The catalog has not selected a native history read");
  };
  const profile: VaultProfile = {
    id: "notes-session-fixture",
    name: "Notes session",
    kind: "opfs",
    createdAt: 1,
    updatedAt: 1,
  };
  let session = $state.raw<VaultSession>();
  let component: NotesWorkspaceSessionHandle | undefined = $state();
  let attempts = 0;
  let hostReadyPending = $state(false);
  let root: HTMLDivElement;
  let paintedStatus = "";
  let startupObservations = $state<string[]>([]);
  let releaseReady = () => {};
  const hostReady = new Promise<void>((resolve) => {
    releaseReady = resolve;
  });
  const ready = $derived(!!session);
  onMount(() => {
    let frame = 0;
    let stopped = false;
    const observeFrame = () => {
      paintedStatus =
        root.querySelector('[data-ui-part="message"]')?.textContent?.trim() ?? "";
      if (!stopped) frame = requestAnimationFrame(observeFrame);
    };
    const stopFrames = () => {
      stopped = true;
      cancelAnimationFrame(frame);
    };
    if (probePluginProgress) frame = requestAnimationFrame(observeFrame);
    const adapter = new MemoryVaultAdapter({
      "Welcome.md": "# Shared Notes session\n\nA real Notes workspace.\n",
    });
    void createVaultSession(adapter, {
      runtime: "web-pwa",
      profile,
      appDatabase: new MemoryAppDatabase(adapter.getVaultId()),
    }).then((value) => {
      session = value;
    });
    disposers.add(async () => {
      stopFrames();
      releaseReady();
      readyGates.delete(releaseReady);
      await component?.dispose(false);
    });
    return stopFrames;
  });

  function progressProbe(id: string, name: string) {
    return class extends Plugin {
      constructor(app: App) {
        super(app, {
          id,
          name,
          version: "1.0.0",
          minAppVersion: "0.0.0",
          description: "",
          author: "test",
        });
      }
      onload() {
        startupObservations.push(paintedStatus);
      }
    };
  }
</script>

<div
  bind:this={root}
  class="notes-session-fixture"
  data-session-host-pending={hostReadyPending}
  data-startup-observations={JSON.stringify(startupObservations)}
>
  {#if ready && session}
    <NotesWorkspaceSession
      bind:this={
        () => component,
        (session) => {
          if (session) component = session;
        }
      }
      {session}
      {profile}
      runtime="web-pwa"
      repositoryFactory={nativeRepository
        ? () => ({
            reader: {
              heads: unselectedReader,
              open: unselectedReader,
              status: unselectedReader,
              read: unselectedReader,
              close: unselectedReader,
            },
            close: async () => {},
          })
        : undefined}
      listProfiles={async () => [profile]}
      onOpenRecent={async () => {}}
      onManageVaults={async () => {}}
      onReady={async (app) => {
        if (holdReady) {
          hostReadyPending = true;
          readyGates.add(releaseReady);
          await hostReady;
          hostReadyPending = false;
        }
        const file = app.vault.getFileByPath("Welcome.md");
        if (file) await app.openFile(file);
      }}
      host={{
        configure: async (app) => {
          if (failOnce && attempts++ === 0)
            throw new Error("Fixture configuration failure");
          if (probePluginProgress)
            app.plugins.registerStaticPlugins([
              progressProbe("progress-first", "First progress probe"),
              progressProbe("progress-second", "Second progress probe"),
            ]);
        },
      }}
    />
  {/if}
</div>

<style>
  .notes-session-fixture {
    width: 100%;
    height: 100dvh;
    min-height: 0;
    overflow: hidden;
  }
</style>
