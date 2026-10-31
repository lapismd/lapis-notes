<script lang="ts" module>
  const disposers = new Set<() => Promise<void>>();
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
  }: { failOnce?: boolean; nativeRepository?: boolean } = $props();
  const unselectedReader = async (): Promise<never> => {
    throw new Error("The catalog has not selected a native history read");
  };
  const profile: VaultProfile = {
    id: "notes-session-fixture",
    name: "Notes session",
    kind: "browser-opfs",
    createdAt: 1,
    updatedAt: 1,
  };
  let session = $state.raw<VaultSession>();
  let component: NotesWorkspaceSessionHandle | undefined = $state();
  let attempts = 0;
  onMount(() => {
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
      await component?.dispose(false);
    });
  });
</script>

<div class="notes-session-fixture">
  {#if session}
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
        const file = app.vault.getFileByPath("Welcome.md");
        if (file) await app.workspace.getLeaf(false).openFile(file);
      }}
      host={{
        configure: async () => {
          if (failOnce && attempts++ === 0)
            throw new Error("Fixture configuration failure");
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
