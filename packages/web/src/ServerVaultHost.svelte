<script lang="ts">
  import Archive from "@lucide/svelte/icons/archive";
  import Download from "@lucide/svelte/icons/download";
  import Ellipsis from "@lucide/svelte/icons/ellipsis";
  import FolderInput from "@lucide/svelte/icons/folder-input";
  import FolderOpen from "@lucide/svelte/icons/folder-open";
  import FolderPlus from "@lucide/svelte/icons/folder-plus";
  import LogOut from "@lucide/svelte/icons/log-out";
  import PenLine from "@lucide/svelte/icons/pen-line";
  import RotateCcw from "@lucide/svelte/icons/rotate-ccw";
  import Search from "@lucide/svelte/icons/search";
  import X from "@lucide/svelte/icons/x";
  import {
    createVaultSession,
    pickFileSystemAccessDirectoryHandle,
    type BrowserFileSystemDirectoryHandle,
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
    createServerPluginDistributionFetch,
    createServerPluginAssetServer,
  } from "@lapis-notes/server-node/browser";
  import * as Button from "@lapismd/design-core/shadcn/button";
  import * as Card from "@lapismd/design-core/shadcn/card";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";
  import * as DropdownMenu from "@lapismd/design-core/shadcn/dropdown-menu";
  import * as Input from "@lapismd/design-core/shadcn/input";
  import { onMount, tick } from "svelte";
  import {
    archiveServerImportDirectory,
    canPickServerImportDirectory,
  } from "./server-vault-import";
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
  let actionMessage = $state("");
  let buildId = $state("");
  let vaults: VaultRow[] = $state.raw([]);
  let prepared: Prepared | null = $state(null);
  let sessionComponent: SessionComponent | null = $state(null);
  let importInput: HTMLInputElement | null = $state(null);
  let activeAction = $state<string | null>(null);
  let createDialogOpen = $state(false);
  let renameDialogOpen = $state(false);
  let renameTarget = $state.raw<VaultRow | null>(null);
  let renameVaultName = $state("");
  let directoryDialogOpen = $state(false);
  let directoryHandle = $state.raw<BrowserFileSystemDirectoryHandle | null>(null);
  let directoryVaultName = $state("");
  let importProgress = $state("");
  let vaultQuery = $state("");
  let vaultDialogOpen = $state(false);

  const canImportDirectory = canPickServerImportDirectory();
  const searchableVaults = $derived(
    vaults.filter((vault) => vault.archivedAt === undefined),
  );
  const filteredVaults = $derived(
    searchableVaults.filter((vault) => {
      const query = vaultQuery.trim().toLowerCase();
      return (
        !query ||
        vault.name.toLowerCase().includes(query) ||
        vault.id.toLowerCase().includes(query) ||
        vault.role.toLowerCase().includes(query)
      );
    }),
  );

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

  async function createVault(): Promise<void> {
    const name = newVaultName.trim();
    if (!name) return;
    errorMessage = "";
    actionMessage = "";
    activeAction = "create";
    try {
      const created = await client.vault.create.mutate({ name });
      newVaultName = "";
      createDialogOpen = false;
      await refreshVaults();
      const row = vaults.find((vault) => vault.id === created.vaultId);
      if (row) await openVault(row);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      activeAction = null;
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
        runtime: "node-server",
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

  function returnToWorkspace(): void {
    if (!prepared) return;
    errorMessage = "";
    hostState = "workspace";
  }

  function showVaultSearch(): void {
    vaultQuery = "";
    vaultDialogOpen = true;
  }

  async function openVaultFromSearch(row: VaultRow): Promise<void> {
    vaultDialogOpen = false;
    await openVault(row);
  }

  async function runVaultAction(
    actionId: string,
    action: () => Promise<void>,
    successMessage = "",
  ): Promise<void> {
    activeAction = actionId;
    errorMessage = "";
    actionMessage = "";
    try {
      await action();
      await refreshVaults();
      actionMessage = successMessage;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      activeAction = null;
    }
  }

  async function archive(row: VaultRow): Promise<void> {
    await runVaultAction(
      `archive:${row.id}`,
      () => client.vault.archive.mutate({ vaultId: row.id }).then(() => undefined),
      `${row.name} archived`,
    );
  }

  async function restore(row: VaultRow): Promise<void> {
    await runVaultAction(
      `restore:${row.id}`,
      () => client.vault.restore.mutate({ vaultId: row.id }).then(() => undefined),
      `${row.name} restored`,
    );
  }

  function openRenameDialog(row: VaultRow): void {
    renameTarget = row;
    renameVaultName = row.name;
    renameDialogOpen = true;
  }

  async function renameVault(): Promise<void> {
    const target = renameTarget;
    const name = renameVaultName.trim();
    if (!target || !name || name === target.name) return;
    await runVaultAction(
      `rename:${target.id}`,
      () =>
        client.vault
          .rename.mutate({ vaultId: target.id, name })
          .then(() => undefined),
      `${name} renamed`,
    );
    if (!errorMessage) renameDialogOpen = false;
  }

  async function uploadVaultArchive(name: string, archive: Blob): Promise<void> {
    const response = await fetch(`/api/vaults/import?name=${encodeURIComponent(name)}`, {
      method: "POST",
      body: archive,
      credentials: "same-origin",
      headers: {
        "content-type": "application/zip",
        "x-lapis-csrf": serverSession.csrfToken() ?? "",
      },
    });
    if (!response.ok) throw new Error(`Import failed (${response.status})`);
  }

  async function importZip(): Promise<void> {
    const file = importInput?.files?.[0];
    if (!file) return;
    const name = file.name.replace(/\.zip$/iu, "") || "Imported vault";
    await runVaultAction(
      "import:zip",
      () => uploadVaultArchive(name, file),
      `${name} imported`,
    );
    if (importInput) importInput.value = "";
  }

  function isAbortError(error: unknown): boolean {
    return (error as { name?: string } | undefined)?.name === "AbortError";
  }

  async function pickImportDirectory(): Promise<void> {
    errorMessage = "";
    actionMessage = "";
    try {
      const handle = await pickFileSystemAccessDirectoryHandle({
        id: "lapis-server-import-vault",
        mode: "read",
      });
      directoryHandle = handle;
      directoryVaultName = handle.name || "Imported vault";
      directoryDialogOpen = true;
    } catch (error) {
      if (isAbortError(error)) return;
      errorMessage = error instanceof Error ? error.message : String(error);
    }
  }

  async function importDirectory(): Promise<void> {
    const handle = directoryHandle;
    const name = directoryVaultName.trim();
    if (!handle || !name) return;
    importProgress = `Scanning ${handle.name}…`;
    await runVaultAction(
      "import:directory",
      async () => {
        const archive = await archiveServerImportDirectory(handle, {
          onProgress: ({ collectedFiles, currentPath }) => {
            importProgress = `Preparing ${collectedFiles} file${collectedFiles === 1 ? "" : "s"}: ${currentPath ?? handle.name}`;
          },
        });
        importProgress = `Uploading ${archive.fileCount} file${archive.fileCount === 1 ? "" : "s"}…`;
        const buffer = archive.bytes.slice().buffer as ArrayBuffer;
        await uploadVaultArchive(
          name,
          new Blob([buffer], { type: "application/zip" }),
        );
      },
      `${name} imported`,
    );
    importProgress = "";
    if (!errorMessage) {
      directoryDialogOpen = false;
      directoryHandle = null;
      directoryVaultName = "";
    }
  }

  function downloadVault(row: VaultRow): void {
    const link = document.createElement("a");
    link.href = `/api/vaults/${encodeURIComponent(row.id)}/export`;
    link.download = "";
    document.body.append(link);
    link.click();
    link.remove();
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
  {#if prepared}
    <div
      class="server-workspace"
      hidden={hostState !== "workspace"}
      inert={hostState !== "workspace"}
    >
      <WebWorkspaceSession
        bind:this={sessionComponent}
        adapter={prepared.adapter}
        profile={prepared.profile}
        session={prepared.session}
        runtime="node-server"
        listProfiles={async () => activeProfiles()}
        pluginAssetServer={createServerPluginAssetServer(prepared.adapter)}
        pluginDistributionOptions={{
          fetch: createServerPluginDistributionFetch({
            vaultId: prepared.profile.id,
          }),
        }}
        onReady={() => (hostState = "workspace")}
        onOpenRecent={async (profile) => {
          const row = vaults.find((vault) => vault.id === profile.id);
          if (row) await openVault(row);
        }}
        onManageVaults={manageVaults}
      />
    </div>
  {/if}

  {#if hostState === "loading" || (hostState === "opening" && !prepared)}
    <section class="server-centered-surface" aria-live="polite">
      <Card.Root class="server-status-card">
        <Card.Header>
          <p class="server-eyebrow">Lapis Server</p>
          <h1 class="server-status-title">
            {hostState === "opening" ? "Opening vault" : "Connecting"}
          </h1>
          <Card.Description>
            Checking the server and preparing your managed workspace…
          </Card.Description>
        </Card.Header>
      </Card.Root>
    </section>
  {:else if hostState === "protocol"}
    <section class="server-centered-surface" role="alert">
      <Card.Root class="server-status-card">
        <Card.Header>
          <p class="server-eyebrow">Update required</p>
          <h1 class="server-status-title">This Lapis tab is out of date</h1>
          <Card.Description>
            The server protocol changed. Reload to use the client shipped with
            build {buildId}.
          </Card.Description>
        </Card.Header>
        <Card.Footer>
          <Button.Root class="server-full-button" onclick={() => location.reload()}>
            Reload Lapis
          </Button.Root>
        </Card.Footer>
      </Card.Root>
    </section>
  {:else if hostState === "login"}
    <section class="server-centered-surface server-login" data-server-login>
      <form onsubmit={login}>
        <Card.Root class="server-login-card">
          <Card.Header class="server-login-header">
            <img
              src="/favicon.svg"
              alt=""
              class="server-login-logo"
              data-server-login-logo
            />
            <div class="server-login-heading">
              <p class="server-eyebrow">Lapis Notes</p>
              <h1 class="server-login-title">Sign in</h1>
              <Card.Description>
                Open your managed Lapis vaults from this server.
              </Card.Description>
            </div>
          </Card.Header>
          <Card.Content class="server-login-fields">
            <label class="server-field">
              <span>Username</span>
              <Input.Root
                autocomplete="username"
                bind:value={username}
                required
              />
            </label>
            <label class="server-field">
              <span>Password</span>
              <Input.Root
                type="password"
                autocomplete="current-password"
                bind:value={password}
                required
              />
            </label>
            {#if errorMessage}
              <p class="server-error" role="alert">{errorMessage}</p>
            {/if}
            <Button.Root
              class="server-full-button"
              type="submit"
              data-server-login-submit
            >
              Sign in
            </Button.Root>
          </Card.Content>
        </Card.Root>
      </form>
    </section>
  {:else if hostState === "vaults"}
    <section
      class="web-vault-launcher server-vault-launcher"
      data-server-vault-launcher
      aria-busy={activeAction !== null}
    >
      <div class="web-vault-launcher__content">
        <header class="server-launcher-header">
          <div class="server-brand-heading">
            <img src="/favicon.svg" alt="" class="server-launcher-logo" />
            <div class="server-brand-copy">
              <p class="server-eyebrow">Lapis Notes</p>
              <h1 class="server-launcher-title">Your vaults</h1>
              <p class="server-launcher-description">
                Open a managed server vault or bring an existing project online.
              </p>
            </div>
          </div>
          <div class="server-launcher-actions">
            <Button.Root variant="link" size="sm" onclick={() => void logout()}>
              <LogOut />
              Sign out
            </Button.Root>
            {#if prepared}
              <Button.Root
                type="button"
                variant="secondary"
                size="icon-lg"
                class="web-vault-launcher__close"
                aria-label={`Return to ${prepared.profile.name}`}
                title={`Return to ${prepared.profile.name}`}
                onclick={returnToWorkspace}
              >
                <X />
              </Button.Root>
            {/if}
          </div>
        </header>

        {#if errorMessage}
          <div class="server-alert server-alert--error" role="alert">
            {errorMessage}
          </div>
        {:else if actionMessage}
          <div class="server-alert" role="status">{actionMessage}</div>
        {/if}

        <div class="server-vault-grid">
          <Card.Root class="server-vault-card">
            <Card.Header>
              <Card.Title class="server-card-title">Server Vaults</Card.Title>
              <Card.Description>
                Create a managed vault, import a local folder, or upload a ZIP.
              </Card.Description>
            </Card.Header>
            <Card.Content class="server-action-list">
              <Button.Root
                class="web-vault-launcher__action"
                disabled={activeAction !== null}
                onclick={() => {
                  newVaultName = "";
                  createDialogOpen = true;
                }}
              >
                <FolderPlus />
                <span class="server-action-copy">
                  <span class="server-action-title">Create New Vault</span>
                  <span class="server-action-description">
                    Start a private managed vault on this server.
                  </span>
                </span>
              </Button.Root>
              <Button.Root
                variant="outline"
                class="web-vault-launcher__action"
                disabled={activeAction !== null || !canImportDirectory}
                onclick={() => void pickImportDirectory()}
              >
                <FolderInput />
                <span class="server-action-copy">
                  <span class="server-action-title">Import Folder</span>
                  <span class="server-action-description">
                    {canImportDirectory
                      ? "Choose a folder with the File System Access API."
                      : "Use Import ZIP in browsers without folder access."}
                  </span>
                </span>
              </Button.Root>
              <Button.Root
                variant="outline"
                class="web-vault-launcher__action"
                disabled={activeAction !== null}
                onclick={() => importInput?.click()}
              >
                <Archive />
                <span class="server-action-copy">
                  <span class="server-action-title">Import ZIP</span>
                  <span class="server-action-description">
                    Upload a portable vault archive from this device.
                  </span>
                </span>
              </Button.Root>
              <input
                bind:this={importInput}
                class="sr-only"
                type="file"
                accept=".zip,application/zip"
                aria-label="Import ZIP"
                onchange={() => void importZip()}
              />
            </Card.Content>
          </Card.Root>

          <Card.Root class="server-vault-card">
            <Card.Header>
              <div class="server-card-header-row">
                <div>
                  <Card.Title class="server-card-title">Managed Vaults</Card.Title>
                  <Card.Description>
                    Vaults available to this account, including archived projects.
                  </Card.Description>
                </div>
                {#if searchableVaults.length > 1}
                  <Button.Root
                    variant="link"
                    size="sm"
                    class="server-view-all"
                    onclick={showVaultSearch}
                  >
                    View all
                  </Button.Root>
                {/if}
              </div>
            </Card.Header>
            <Card.Content class="server-managed-content">
              <ul class="server-vault-list">
                {#each vaults as vault (vault.id)}
                  <li class="server-vault-row" data-server-vault-row>
                    <button
                      type="button"
                      class="web-vault-launcher__recent server-vault-open"
                      disabled={activeAction !== null || vault.archivedAt !== undefined}
                      aria-label={vault.archivedAt
                        ? `${vault.name} is archived`
                        : `Open ${vault.name}`}
                      onclick={() => void openVault(vault)}
                    >
                      <FolderOpen />
                      <span class="server-vault-copy">
                        <span class="server-vault-name">{vault.name}</span>
                        <span class="server-vault-meta">
                          {vault.role}{vault.archivedAt ? " · archived" : " · server-hosted"}
                        </span>
                      </span>
                    </button>
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger
                        class="server-vault-menu-trigger"
                        aria-label={`Open actions for ${vault.name}`}
                        title={`Open actions for ${vault.name}`}
                        disabled={activeAction !== null}
                      >
                        <Ellipsis />
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content align="end" side="bottom">
                        {#if vault.archivedAt}
                          <DropdownMenu.Item onclick={() => void restore(vault)}>
                            <RotateCcw />
                            Restore
                          </DropdownMenu.Item>
                        {:else}
                          <DropdownMenu.Item onclick={() => void openVault(vault)}>
                            <FolderOpen />
                            Open
                          </DropdownMenu.Item>
                          <DropdownMenu.Item onclick={() => downloadVault(vault)}>
                            <Download />
                            Export ZIP
                          </DropdownMenu.Item>
                          {#if vault.role === "owner"}
                            <DropdownMenu.Item onclick={() => openRenameDialog(vault)}>
                              <PenLine />
                              Rename...
                            </DropdownMenu.Item>
                            <DropdownMenu.Separator />
                            <DropdownMenu.Item onclick={() => void archive(vault)}>
                              <Archive />
                              Archive
                            </DropdownMenu.Item>
                          {/if}
                        {/if}
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  </li>
                {:else}
                  <li class="server-vault-empty">
                    Your managed vaults will appear here after you create or import one.
                  </li>
                {/each}
              </ul>
            </Card.Content>
          </Card.Root>
        </div>
      </div>
    </section>
  {/if}
</main>

<Dialog.Root bind:open={vaultDialogOpen}>
  <Dialog.Content
    class="web-vault-launcher__command"
    showCloseButton={false}
  >
    <Dialog.Header class="sr-only">
      <Dialog.Title>Managed Vaults</Dialog.Title>
      <Dialog.Description>Search and open a managed server vault</Dialog.Description>
    </Dialog.Header>
    <CommandView.Root shouldFilter={false}>
      <CommandView.Input
        bind:value={vaultQuery}
        placeholder="Search managed vaults..."
        aria-label="Search managed vaults"
        autocomplete="off"
        spellcheck="false"
      />
      <CommandView.List aria-label="Managed vaults">
        <CommandView.Empty>No matching managed vaults</CommandView.Empty>
        {#if filteredVaults.length > 0}
          <CommandView.Group>
            {#each filteredVaults as vault (vault.id)}
              <CommandView.Item
                value={`${vault.name} ${vault.id} ${vault.role}`}
                onSelect={() => void openVaultFromSearch(vault)}
              >
                <CommandView.ItemIcon>
                  <Search />
                </CommandView.ItemIcon>
                <CommandView.ItemLabel>{vault.name}</CommandView.ItemLabel>
                <CommandView.ItemDescription>
                  {vault.role} · server-hosted
                </CommandView.ItemDescription>
              </CommandView.Item>
            {/each}
          </CommandView.Group>
        {/if}
      </CommandView.List>
    </CommandView.Root>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={createDialogOpen}>
  <Dialog.Content class="web-vault-launcher__settings">
    <Dialog.Header>
      <Dialog.Title>New Server Vault</Dialog.Title>
      <Dialog.Description>
        Choose the name shown in this account's managed vault list.
      </Dialog.Description>
    </Dialog.Header>
    <form
      class="server-dialog-form"
      onsubmit={(event) => {
        event.preventDefault();
        void createVault();
      }}
    >
      <label class="server-field">
        <span>Name</span>
        <Input.Root bind:value={newVaultName} autocomplete="off" autofocus />
      </label>
      <Dialog.Footer>
        <Button.Root type="button" variant="ghost" onclick={() => (createDialogOpen = false)}>
          Cancel
        </Button.Root>
        <Button.Root type="submit" disabled={!newVaultName.trim() || activeAction !== null}>
          Create vault
        </Button.Root>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={directoryDialogOpen}>
  <Dialog.Content class="web-vault-launcher__settings">
    <Dialog.Header>
      <Dialog.Title>Import Server Vault</Dialog.Title>
      <Dialog.Description>
        Upload a managed copy of {directoryHandle?.name ?? "the selected folder"}.
      </Dialog.Description>
    </Dialog.Header>
    <form
      class="server-dialog-form"
      onsubmit={(event) => {
        event.preventDefault();
        void importDirectory();
      }}
    >
      <label class="server-field">
        <span>Name</span>
        <Input.Root bind:value={directoryVaultName} autocomplete="off" autofocus />
      </label>
      {#if importProgress}
        <p class="server-import-progress" role="status">{importProgress}</p>
      {/if}
      <Dialog.Footer>
        <Button.Root
          type="button"
          variant="ghost"
          disabled={activeAction !== null}
          onclick={() => (directoryDialogOpen = false)}
        >
          Cancel
        </Button.Root>
        <Button.Root
          type="submit"
          disabled={!directoryVaultName.trim() || activeAction !== null}
        >
          Import vault
        </Button.Root>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={renameDialogOpen}>
  <Dialog.Content class="web-vault-launcher__settings">
    <Dialog.Header>
      <Dialog.Title>Rename vault</Dialog.Title>
      <Dialog.Description>Update the managed vault name for this account.</Dialog.Description>
    </Dialog.Header>
    <form
      class="server-dialog-form"
      onsubmit={(event) => {
        event.preventDefault();
        void renameVault();
      }}
    >
      <label class="server-field">
        <span>Name</span>
        <Input.Root bind:value={renameVaultName} autocomplete="off" autofocus />
      </label>
      <Dialog.Footer>
        <Button.Root type="button" variant="ghost" onclick={() => (renameDialogOpen = false)}>
          Cancel
        </Button.Root>
        <Button.Root
          type="submit"
          disabled={!renameVaultName.trim() || activeAction !== null}
        >
          Save
        </Button.Root>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
