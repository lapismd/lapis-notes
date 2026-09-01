<script lang="ts">
  import {
    createVaultSession,
    type VaultSession,
  } from "@lapis-notes/api";
  import {
    LAPIS_SERVER_PROTOCOL_MAJOR,
    type ServerVaultProfile,
  } from "@lapis-notes/api/server-host";
  import {
    ServerAppDatabaseProvider,
    ServerVaultAdapter,
    ServerVaultEventStream,
    createServerClientSession,
    createServerPluginAssetServer,
  } from "@lapis-notes/server-deno/browser";
  import { onMount, tick } from "svelte";
  import WebWorkspaceSession from "./WebWorkspaceSession.svelte";

  type VaultRow = {
    id: string;
    name: string;
    role: "owner" | "editor" | "viewer";
    archivedAt?: number;
  };
  type Prepared = {
    adapter: ServerVaultAdapter;
    events: ServerVaultEventStream;
    profile: ServerVaultProfile;
    session: VaultSession;
  };
  type SessionComponent = {
    dispose(persistLayout: boolean): Promise<void>;
    persistLayout(): Promise<void>;
  };

  const serverSession = createServerClientSession();
  const client = serverSession.client;
  type HostState =
    | "loading"
    | "login"
    | "vaults"
    | "opening"
    | "workspace"
    | "protocol";
  let hostState: HostState = $state("loading");
  let username = $state("");
  let password = $state("");
  let newVaultName = $state("");
  let errorMessage = $state("");
  let buildId = $state("");
  let vaults: VaultRow[] = $state.raw([]);
  let prepared: Prepared | null = $state(null);
  let sessionComponent: SessionComponent | null = $state(null);
  let importInput: HTMLInputElement | null = $state(null);

  onMount(() => {
    void initialize();
    return () => {
      void disposeWorkspace(false);
    };
  });

  function profileFor(row: VaultRow): ServerVaultProfile {
    const now = Date.now();
    return {
      id: row.id,
      name: row.name,
      kind: "server-hosted",
      role: row.role,
      archived: row.archivedAt !== undefined,
      createdAt: now,
      updatedAt: now,
    };
  }

  async function initialize(): Promise<void> {
    errorMessage = "";
    try {
      const info = await client.system.info.query();
      buildId = info.buildId;
      if (info.protocolMajor !== LAPIS_SERVER_PROTOCOL_MAJOR) {
        hostState = "protocol";
        return;
      }
      try {
        const current = await client.auth.current.query();
        serverSession.setCsrfToken(current.csrfToken);
        await refreshVaults();
        hostState = "vaults";
      } catch {
        hostState = "login";
      }
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
      hostState = "login";
    }
  }

  async function login(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    errorMessage = "";
    try {
      const result = await client.auth.login.mutate({ username, password });
      password = "";
      serverSession.setCsrfToken(result.csrfToken);
      await refreshVaults();
      hostState = "vaults";
    } catch (error) {
      password = "";
      errorMessage = error instanceof Error ? error.message : String(error);
    }
  }

  async function refreshVaults(): Promise<void> {
    vaults = await client.vault.list.query({ includeArchived: true });
  }

  function activeProfiles() {
    return vaults
      .filter((vault) => vault.archivedAt === undefined)
      .map(profileFor);
  }

  async function createVault(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const name = newVaultName.trim();
    if (!name) return;
    errorMessage = "";
    try {
      const created = await client.vault.create.mutate({ name });
      newVaultName = "";
      await refreshVaults();
      const row = vaults.find((vault) => vault.id === created.vaultId);
      if (row) await openVault(row);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    }
  }

  async function openVault(row: VaultRow): Promise<void> {
    if (row.archivedAt !== undefined) return;
    hostState = "opening";
    errorMessage = "";
    try {
      await disposeWorkspace(true);
      await client.vault.open.query({ vaultId: row.id });
      const profile = profileFor(row);
      const events = new ServerVaultEventStream(client, row.id);
      const adapter = new ServerVaultAdapter({
        client,
        profile,
        csrfToken: serverSession.csrfToken,
        events,
      });
      const session = await createVaultSession(adapter, {
        runtime: "deno-server",
        profile,
        appDatabaseProvider: new ServerAppDatabaseProvider(client, events),
      });
      prepared = { adapter, events, profile, session };
      await tick();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
      hostState = "vaults";
    }
  }

  async function disposeWorkspace(persistLayout: boolean): Promise<void> {
    const active = prepared;
    if (sessionComponent) await sessionComponent.dispose(persistLayout);
    else if (active) await active.session.close();
    active?.events.close();
    sessionComponent = null;
    prepared = null;
  }

  async function manageVaults(): Promise<void> {
    await sessionComponent?.persistLayout();
    await refreshVaults();
    hostState = "vaults";
  }

  async function archive(row: VaultRow): Promise<void> {
    await client.vault.archive.mutate({ vaultId: row.id });
    await refreshVaults();
  }

  async function restore(row: VaultRow): Promise<void> {
    await client.vault.restore.mutate({ vaultId: row.id });
    await refreshVaults();
  }

  async function rename(row: VaultRow): Promise<void> {
    const name = globalThis.prompt("Vault name", row.name)?.trim();
    if (!name || name === row.name) return;
    await client.vault.rename.mutate({ vaultId: row.id, name });
    await refreshVaults();
  }

  async function importVault(): Promise<void> {
    const file = importInput?.files?.[0];
    if (!file) return;
    const name = file.name.replace(/\.zip$/iu, "") || "Imported vault";
    const response = await fetch(`/api/vaults/import?name=${encodeURIComponent(name)}`, {
      method: "POST",
      body: file,
      credentials: "same-origin",
      headers: { "x-lapis-csrf": serverSession.csrfToken() ?? "" },
    });
    if (!response.ok) throw new Error(`Import failed (${response.status})`);
    if (importInput) importInput.value = "";
    await refreshVaults();
  }

  async function logout(): Promise<void> {
    await disposeWorkspace(true);
    await client.auth.logout.mutate();
    serverSession.setCsrfToken();
    vaults = [];
    username = "";
    hostState = "login";
  }
</script>

<main class="server-host" data-server-host-state={hostState}>
  {#if hostState === "loading" || (hostState === "opening" && !prepared)}
    <section class="server-card" aria-live="polite">
      <p class="server-eyebrow">Lapis Server</p>
      <h1>{hostState === "opening" ? "Opening vault" : "Connecting"}</h1>
      <p>Checking the server and preparing your managed workspace…</p>
    </section>
  {:else if hostState === "protocol"}
    <section class="server-card" role="alert">
      <p class="server-eyebrow">Update required</p>
      <h1>This Lapis tab is out of date</h1>
      <p>The server protocol changed. Reload to use the client shipped with build {buildId}.</p>
      <button class="server-primary" onclick={() => location.reload()}>Reload Lapis</button>
    </section>
  {:else if hostState === "login"}
    <form class="server-card" onsubmit={login}>
      <p class="server-eyebrow">Lapis Server</p>
      <h1>Sign in</h1>
      <p>Open your managed Lapis vaults from this server.</p>
      <label>Username<input autocomplete="username" bind:value={username} required /></label>
      <label>Password<input type="password" autocomplete="current-password" bind:value={password} required /></label>
      {#if errorMessage}<p class="server-error" role="alert">{errorMessage}</p>{/if}
      <button class="server-primary" type="submit">Sign in</button>
    </form>
  {:else if hostState === "vaults"}
    <section class="server-card server-card--wide">
      <header class="server-heading">
        <div><p class="server-eyebrow">Lapis Server</p><h1>Your vaults</h1></div>
        <button onclick={logout}>Sign out</button>
      </header>
      <form class="server-create" onsubmit={createVault}>
        <label>New vault<input bind:value={newVaultName} placeholder="Vault name" required /></label>
        <button class="server-primary" type="submit">Create</button>
      </form>
      <label class="server-import">Import ZIP<input bind:this={importInput} type="file" accept=".zip,application/zip" onchange={() => void importVault()} /></label>
      {#if errorMessage}<p class="server-error" role="alert">{errorMessage}</p>{/if}
      <ul class="server-vaults">
        {#each vaults as vault (vault.id)}
          <li>
            <div><strong>{vault.name}</strong><span>{vault.role}{vault.archivedAt ? " · archived" : ""}</span></div>
            <div class="server-actions">
              {#if vault.archivedAt}
                <button onclick={() => void restore(vault)}>Restore</button>
              {:else}
                <button class="server-primary" onclick={() => void openVault(vault)}>Open</button>
                <a href={`/api/vaults/${vault.id}/export`}>Export</a>
                {#if vault.role === "owner"}
                  <button onclick={() => void rename(vault)}>Rename</button>
                  <button onclick={() => void archive(vault)}>Archive</button>
                {/if}
              {/if}
            </div>
          </li>
        {:else}
          <li class="server-empty">Create a vault or import a ZIP to get started.</li>
        {/each}
      </ul>
    </section>
  {:else if prepared}
    <div class="server-workspace">
      <WebWorkspaceSession
        bind:this={sessionComponent}
        adapter={prepared.adapter}
        profile={prepared.profile}
        session={prepared.session}
        runtime="deno-server"
        listProfiles={async () => activeProfiles()}
        pluginAssetServer={createServerPluginAssetServer(prepared.adapter)}
        onReady={() => (hostState = "workspace")}
        onOpenRecent={async (profile) => {
          const row = vaults.find((vault) => vault.id === profile.id);
          if (row) await openVault(row);
        }}
        onManageVaults={manageVaults}
      />
    </div>
  {/if}
</main>

<style>
  .server-host { min-height: 100dvh; display: grid; place-items: center; padding: 2rem; background: var(--background); color: var(--foreground); }
  .server-workspace { position: fixed; inset: 0; }
  .server-card { width: min(100%, 28rem); display: grid; gap: 1rem; padding: 2rem; border: 1px solid var(--border); border-radius: 0.75rem; background: var(--card); box-shadow: 0 1rem 3rem color-mix(in srgb, var(--foreground) 10%, transparent); }
  .server-card--wide { width: min(100%, 58rem); }
  .server-eyebrow { margin: 0; color: var(--muted-foreground); font-size: 0.75rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
  h1, p { margin: 0; }
  label { display: grid; gap: 0.4rem; font-size: 0.875rem; font-weight: 600; }
  input { min-height: 2.5rem; padding: 0.55rem 0.7rem; border: 1px solid var(--input); border-radius: 0.4rem; background: var(--background); color: var(--foreground); font: inherit; }
  button, a { min-height: 2.25rem; display: inline-flex; align-items: center; justify-content: center; padding: 0.45rem 0.75rem; border: 1px solid var(--border); border-radius: 0.4rem; background: var(--background); color: var(--foreground); font: inherit; text-decoration: none; cursor: pointer; }
  .server-primary { border-color: var(--primary); background: var(--primary); color: var(--primary-foreground); }
  .server-error { color: var(--destructive); }
  .server-heading, .server-create, .server-actions { display: flex; align-items: end; justify-content: space-between; gap: 0.75rem; }
  .server-create label { flex: 1; }
  .server-import { width: fit-content; }
  .server-vaults { display: grid; gap: 0.6rem; margin: 0; padding: 0; list-style: none; }
  .server-vaults li { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.8rem; border: 1px solid var(--border); border-radius: 0.5rem; }
  .server-vaults li > div:first-child { display: grid; gap: 0.2rem; }
  .server-vaults span { color: var(--muted-foreground); font-size: 0.8rem; }
  .server-empty { color: var(--muted-foreground); }
  @media (max-width: 44rem) { .server-host { padding: 1rem; } .server-card { padding: 1.25rem; } .server-heading, .server-create, .server-vaults li { align-items: stretch; flex-direction: column; } .server-actions { flex-wrap: wrap; justify-content: flex-start; } }
</style>
