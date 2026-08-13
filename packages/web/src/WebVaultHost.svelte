<script lang="ts">
  import {
    FileSystemAccessAdapter,
    OpfsVaultAdapter,
    clearCurrentVaultProfile,
    createOpfsVault,
    createVaultSession,
    getCurrentVaultProfile,
    listOpfsVaultIds,
    pickFileSystemAccessVault,
    type BrowserFileSystemDirectoryHandle,
    type VaultAdapter,
    type VaultProfile,
    type VaultSession,
  } from "@lapis-notes/api";
  import { onMount, tick } from "svelte";
  import WebVaultLauncher, {
    type WebLauncherStatus,
  } from "./WebVaultLauncher.svelte";
  import WebWorkspaceSession from "./WebWorkspaceSession.svelte";

  type HostStatus = "loading" | "landing" | "opening" | "ready" | "error";
  type PreparedSession = {
    adapter: VaultAdapter;
    profile: VaultProfile;
    session: VaultSession;
  };
  type SessionComponent = { dispose(persistLayout: boolean): Promise<void> };

  let status = $state<HostStatus>("loading");
  let prepared = $state<PreparedSession | null>(null);
  let sessionComponent = $state<SessionComponent | null>(null);
  let errorMessage = $state("");
  let switchQueue = Promise.resolve();
  let resolvePrepared: (() => void) | null = null;
  let rejectPrepared: ((error: Error) => void) | null = null;

  onMount(() => {
    void restoreVault();
    return () => {
      void disposeActiveSession(false);
    };
  });

  function serialize(task: () => Promise<void>): Promise<void> {
    switchQueue = switchQueue.then(task, task);
    return switchQueue;
  }

  function isPickerCancellation(error: unknown): boolean {
    return error instanceof DOMException && error.name === "AbortError";
  }

  async function adapterFromProfile(
    profile: VaultProfile,
    requestPermission: boolean,
  ): Promise<VaultAdapter> {
    if (profile.kind === "opfs") {
      if (!(await listOpfsVaultIds()).includes(profile.id)) {
        throw new Error("The browser-local vault is unavailable");
      }
      return OpfsVaultAdapter.create({
        vaultId: profile.id,
        name: profile.name,
      });
    }
    if (profile.kind === "file-system-access") {
      const handle = profile.handle as BrowserFileSystemDirectoryHandle | undefined;
      if (!handle || handle.kind !== "directory") {
        throw new Error("The saved folder handle is unavailable");
      }
      let permission = await handle.queryPermission?.({ mode: "readwrite" });
      if (permission !== "granted" && requestPermission) {
        permission = await handle.requestPermission?.({ mode: "readwrite" });
      }
      if (permission !== undefined && permission !== "granted") {
        throw new Error("Folder permission is required to reopen this vault");
      }
      return FileSystemAccessAdapter.fromHandle(handle, {
        vaultId: profile.id,
        name: profile.name,
      });
    }
    throw new Error(`Unsupported web vault kind: ${profile.kind}`);
  }

  async function restoreVault(): Promise<void> {
    const profile = await getCurrentVaultProfile();
    if (profile && profile.kind !== "desktop-folder") {
      try {
        await openVault(await adapterFromProfile(profile, false), profile);
        return;
      } catch {
        await clearCurrentVaultProfile();
      }
    } else if (profile) {
      await clearCurrentVaultProfile();
    }
    status = "landing";
  }

  function createVault(name: string): Promise<void> {
    return serialize(async () => {
      status = "opening";
      errorMessage = "";
      try {
        const adapter = await createOpfsVault({ name });
        const profile = await getCurrentVaultProfile();
        if (!profile || profile.id !== adapter.getVaultId()) {
          throw new Error("The browser vault profile was not saved");
        }
        await openVault(adapter, profile);
      } catch (error) {
        errorMessage = error instanceof Error ? error.message : String(error);
        status = "error";
      }
    });
  }

  function openFolder(): Promise<void> {
    return serialize(async () => {
      status = "opening";
      errorMessage = "";
      try {
        const adapter = await pickFileSystemAccessVault();
        const profile = await getCurrentVaultProfile();
        if (!profile || profile.id !== adapter.getVaultId()) {
          throw new Error("The folder vault profile was not saved");
        }
        await openVault(adapter, profile);
      } catch (error) {
        if (isPickerCancellation(error)) {
          status = "landing";
          return;
        }
        errorMessage = error instanceof Error ? error.message : String(error);
        status = "error";
      }
    });
  }

  function openRecent(profile: VaultProfile): Promise<void> {
    return serialize(async () => {
      status = "opening";
      errorMessage = "";
      try {
        await openVault(await adapterFromProfile(profile, true), profile);
      } catch (error) {
        await clearCurrentVaultProfile();
        errorMessage = error instanceof Error ? error.message : String(error);
        status = "error";
      }
    });
  }

  function showLauncher(): Promise<void> {
    return serialize(async () => {
      await disposeActiveSession(true);
      await clearCurrentVaultProfile();
      errorMessage = "";
      status = "landing";
    });
  }

  async function openVault(
    adapter: VaultAdapter,
    profile: VaultProfile,
  ): Promise<void> {
    await disposeActiveSession(true);
    const session = await createVaultSession(adapter, {
      runtime: "web-pwa",
      profile,
    });
    if (!session.appDatabase || session.appDatabaseState.status === "blocked") {
      await session.close();
      throw new Error(
        session.appDatabaseState.message ?? "The Turso database is unavailable",
      );
    }
    try {
      const ready = new Promise<void>((resolve, reject) => {
        resolvePrepared = resolve;
        rejectPrepared = reject;
      });
      prepared = { adapter, profile, session };
      await tick();
      await ready;
      status = "ready";
    } catch (error) {
      await disposeActiveSession(false);
      throw error;
    } finally {
      resolvePrepared = null;
      rejectPrepared = null;
    }
  }

  async function disposeActiveSession(persistLayout: boolean): Promise<void> {
    const current = sessionComponent;
    const pending = prepared?.session;
    if (current) await current.dispose(persistLayout);
    else if (pending) await pending.close();
    sessionComponent = null;
    prepared = null;
    await tick();
  }
</script>

<main class="web-host" data-web-host-state={status}>
  {#if prepared}
    <WebWorkspaceSession
      bind:this={sessionComponent}
      {...prepared}
      onReady={() => resolvePrepared?.()}
      onFailure={(error) =>
        rejectPrepared?.(error instanceof Error ? error : new Error(String(error)))}
      onOpenRecent={openRecent}
      onManageVaults={showLauncher}
    />
  {:else}
    <WebVaultLauncher
      status={status as WebLauncherStatus}
      {errorMessage}
      onCreate={createVault}
      onOpen={openFolder}
      onOpenRecent={openRecent}
    />
  {/if}
</main>
