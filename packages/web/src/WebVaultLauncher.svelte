<script lang="ts">
  import Archive from "@lucide/svelte/icons/archive";
  import Copy from "@lucide/svelte/icons/copy";
  import Ellipsis from "@lucide/svelte/icons/ellipsis";
  import FolderInput from "@lucide/svelte/icons/folder-input";
  import FolderOpen from "@lucide/svelte/icons/folder-open";
  import FolderPlus from "@lucide/svelte/icons/folder-plus";
  import PenLine from "@lucide/svelte/icons/pen-line";
  import Search from "@lucide/svelte/icons/search";
  import Settings from "@lucide/svelte/icons/settings";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import X from "@lucide/svelte/icons/x";
  import type { BootstrapAppearanceMode, BrowserFileSystemDirectoryHandle, VaultProfile } from "@lapis-notes/api";
  import { webVaultLauncherServices, type WebVaultLauncherServices } from "./web-vault-launcher-services";
  import lapisLogo from "./web-launcher-logo.svg";
  import "./web-vault-launcher.css";
  import "./web-vault-launcher-controls.css";
  import * as Button from "@lapismd/design-core/shadcn/button";
  import * as Card from "@lapismd/design-core/shadcn/card";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";
  import * as DropdownMenu from "@lapismd/design-core/shadcn/dropdown-menu";
  import * as Input from "@lapismd/design-core/shadcn/input";
  import { onMount } from "svelte";
  import {
    applyWebHostAppearance as applyAppearance,
    observeWebHostAppearance,
  } from "./host-appearance";
  import {
    isAbortError,
  } from "./vault-transfer";

  export type WebLauncherStatus = "loading" | "landing" | "opening" | "error";

  let {
    status,
    services = webVaultLauncherServices,
    errorMessage = "",
    canReturn = false,
    currentVaultId,
    onCreate,
    onOpen,
    onImport,
    onOpenRecent,
    onClose,
    onCurrentVaultDeleted,
  }: {
    status: WebLauncherStatus;
    services?: WebVaultLauncherServices;
    errorMessage?: string;
    canReturn?: boolean;
    currentVaultId?: string;
    onCreate(name: string): Promise<void>;
    onOpen(): Promise<void>;
    onImport(name: string, handle: BrowserFileSystemDirectoryHandle): Promise<void>;
    onOpenRecent(profile: VaultProfile): Promise<void>;
    onClose?(): void;
    onCurrentVaultDeleted?(): Promise<void>;
  } = $props();

  const appearanceOptions: Array<{
    value: BootstrapAppearanceMode;
    label: string;
  }> = [
    { value: "system", label: "Match System" },
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
  ];

  let recentVaults = $state.raw<VaultProfile[]>([]);
  let recentVaultQuery = $state("");
  let recentVaultDialogOpen = $state(false);
  let settingsOpen = $state(false);
  let appearanceMode = $state<BootstrapAppearanceMode>("system");
  let appearanceReady = $state(false);
  let localError = $state("");
  let actionMessage = $state("");
  let activeActionId = $state<string | null>(null);
  let createDialogOpen = $state(false);
  let createDialogName = $state("");
  let importDialogOpen = $state(false);
  let importDialogName = $state("");
  let importHandle = $state.raw<BrowserFileSystemDirectoryHandle | null>(null);
  let renameDialogOpen = $state(false);
  let renameDialogName = $state("");
  let renameTarget = $state.raw<VaultProfile | null>(null);
  let deleteDialogOpen = $state(false);
  let deleteTarget = $state.raw<VaultProfile | null>(null);

  const busy = $derived(status === "loading" || status === "opening");
  const inlineRecentVaults = $derived(recentVaults.slice(0, 4));
  const filteredRecentVaults = $derived(
    recentVaults.filter((profile) => {
      const query = recentVaultQuery.trim().toLowerCase();
      return (
        !query ||
        profile.name.toLowerCase().includes(query) ||
        profile.id.toLowerCase().includes(query) ||
        profile.kind.toLowerCase().includes(query)
      );
    }),
  );

  onMount(() => {
    void refresh();
  });

  $effect(() => {
    if (appearanceReady) return observeWebHostAppearance(appearanceMode);
  });

  async function refresh(): Promise<void> {
    try {
      [recentVaults, appearanceMode] = await Promise.all([
        services.listProfiles(),
        services.getAppearance(),
      ]);
      applyAppearance(appearanceMode);
      appearanceReady = true;
    } catch (error) {
      localError = error instanceof Error ? error.message : String(error);
    }
  }

  async function invoke(action: () => Promise<void>): Promise<void> {
    localError = "";
    actionMessage = "";
    try {
      await action();
    } catch (error) {
      localError = error instanceof Error ? error.message : String(error);
    }
  }

  async function runAction(
    profile: VaultProfile,
    action: () => Promise<void>,
    successMessage?: string,
  ): Promise<void> {
    activeActionId = profile.id;
    localError = "";
    actionMessage = "";
    try {
      await action();
      await refresh();
      actionMessage = successMessage ?? "";
    } catch (error) {
      localError = error instanceof Error ? error.message : String(error);
    } finally {
      activeActionId = null;
    }
  }

  async function updateAppearance(mode: BootstrapAppearanceMode): Promise<void> {
    appearanceMode = mode;
    applyAppearance(mode);
    await services.saveAppearance(mode);
  }

  async function copyVaultId(profile: VaultProfile): Promise<void> {
    await runAction(
      profile,
      async () => services.copyId(profile),
      "Vault ID copied",
    );
  }

  function openRenameDialog(profile: VaultProfile): void {
    renameTarget = profile;
    renameDialogName = profile.name;
    renameDialogOpen = true;
  }

  function openDeleteDialog(profile: VaultProfile): void {
    deleteTarget = profile;
    deleteDialogOpen = true;
  }

  async function submitCreate(): Promise<void> {
    const name = createDialogName.trim();
    if (!name) return;
    await invoke(async () => {
      await onCreate(name);
      createDialogOpen = false;
      createDialogName = "";
    });
  }

  async function startImport(): Promise<void> {
    await invoke(async () => {
      try {
        const handle = await services.pickDirectory();
        importHandle = handle;
        importDialogName = handle.name ?? "";
        importDialogOpen = true;
      } catch (error) {
        if (isAbortError(error)) {
          return;
        }
        throw error;
      }
    });
  }

  async function submitImport(): Promise<void> {
    const name = importDialogName.trim();
    const handle = importHandle;
    if (!name || !handle) return;
    await invoke(async () => {
      await onImport(name, handle);
      importDialogOpen = false;
      importDialogName = "";
      importHandle = null;
    });
  }

  async function submitRename(): Promise<void> {
    if (!renameTarget) return;
    const name = renameDialogName.trim();
    if (!name) {
      localError = "Vault name is required";
      return;
    }
    const profile = renameTarget;
    await runAction(
      profile,
      () =>
        services.rename(profile, name),
      "Vault renamed",
    );
    if (!localError) renameDialogOpen = false;
  }

  async function submitDelete(): Promise<void> {
    if (!deleteTarget) return;
    const profile = deleteTarget;
    const deletingCurrent = profile.id === currentVaultId;
    await runAction(profile, () => services.deleteVault(profile), "Vault deleted");
    if (localError) return;
    deleteDialogOpen = false;
    if (deletingCurrent) await onCurrentVaultDeleted?.();
  }

  async function removeRecent(profile: VaultProfile): Promise<void> {
    await runAction(
      profile,
      () => services.removeProfile(profile),
      "Vault removed from recent projects",
    );
  }

  $effect(() => {
    if (!recentVaultDialogOpen && recentVaultQuery) recentVaultQuery = "";
  });

  $effect(() => {
    if (!renameDialogOpen) {
      renameTarget = null;
      renameDialogName = "";
    }
  });

  $effect(() => {
    if (!deleteDialogOpen) deleteTarget = null;
  });
</script>

<section
  class="web-vault-launcher"
  data-web-vault-launcher
  aria-busy={busy}
>
  <div class="web-vault-launcher__content">
    <header class="web-vault-launcher__header">
      <div class="web-vault-launcher__brand">
        <img src={lapisLogo} alt="" class="web-vault-launcher__logo" />
        <div class="web-vault-launcher__copy">
          <div class="web-vault-launcher__eyebrow">
            Lapis Notes
          </div>
          <h1 class="web-vault-launcher__heading">
            {recentVaults.length ? "Open a vault" : "Create a vault"}
          </h1>
          <p class="web-vault-launcher__description">
            Keep notes in browser-local storage or open a folder from this device.
          </p>
        </div>
      </div>
      <div class="web-vault-launcher__header-actions">
        <Button.Root variant="link" size="sm" class="web-vault-launcher__settings-trigger" onclick={() => (settingsOpen = true)}>
          <Settings class="web-vault-launcher__icon" />
          Settings
        </Button.Root>
        {#if canReturn}
          <Button.Root
            type="button"
            variant="secondary"
            size="icon-lg"
            class="web-vault-launcher__close"
            aria-label="Return to previous vault"
            onclick={() => onClose?.()}
          >
            <X class="web-vault-launcher__large-icon" />
          </Button.Root>
        {/if}
      </div>
    </header>

    {#if errorMessage || localError}
      <div class="web-vault-launcher__error" role="alert">
        {errorMessage || localError}
      </div>
    {:else if actionMessage}
      <div class="web-vault-launcher__message" role="status">
        {actionMessage}
      </div>
    {/if}

    <div class="web-vault-launcher__columns">
      <Card.Root class="web-vault-launcher__card">
        <Card.Header class="web-vault-launcher__card-header">
          <Card.Title class="web-vault-launcher__card-title">Browser Vaults</Card.Title>
          <Card.Description>Create private OPFS storage or open an existing folder.</Card.Description>
        </Card.Header>
        <Card.Content class="web-vault-launcher__action-list">
          <Button.Root
            class="web-vault-launcher__action"
            disabled={busy}
            onclick={() => {
              createDialogName = "";
              createDialogOpen = true;
            }}
          >
            <FolderPlus class="web-vault-launcher__large-icon" />
            <span class="web-vault-launcher__action-copy">
              <span class="web-vault-launcher__label">Create New Vault</span>
              <span class="web-vault-launcher__hint">Stored locally through OPFS.</span>
            </span>
          </Button.Root>
          <Button.Root
            variant="outline"
            class="web-vault-launcher__action web-vault-launcher__outline"
            disabled={busy}
            onclick={() => void invoke(onOpen)}
          >
            <FolderOpen class="web-vault-launcher__large-icon" />
            <span class="web-vault-launcher__action-copy">
              <span class="web-vault-launcher__label">Open Folder</span>
              <span class="web-vault-launcher__hint">Use the File System Access API.</span>
            </span>
          </Button.Root>
          <Button.Root
            variant="outline"
            class="web-vault-launcher__action web-vault-launcher__outline"
            disabled={busy}
            onclick={() => void startImport()}
          >
            <FolderInput class="web-vault-launcher__large-icon" />
            <span class="web-vault-launcher__action-copy">
              <span class="web-vault-launcher__label">Import Vault</span>
              <span class="web-vault-launcher__hint">Copy a local folder into private OPFS storage.</span>
            </span>
          </Button.Root>
        </Card.Content>
      </Card.Root>

      <Card.Root class="web-vault-launcher__card">
        <Card.Header class="web-vault-launcher__card-header">
          <div class="web-vault-launcher__recents-header">
            <div>
              <Card.Title class="web-vault-launcher__card-title">Recent Projects</Card.Title>
              <Card.Description>Vaults stored for this browser profile.</Card.Description>
            </div>
            {#if recentVaults.length}
              <Button.Root variant="link" size="sm" class="web-vault-launcher__link" onclick={() => (recentVaultDialogOpen = true)}>
                View all
              </Button.Root>
            {/if}
          </div>
        </Card.Header>
        <Card.Content class="web-vault-launcher__recent-list">
          {#if inlineRecentVaults.length}
            {#each inlineRecentVaults as profile (profile.id)}
              <div class="web-vault-launcher__recent">
                <button
                  type="button"
                  class="web-vault-launcher__recent-open"
                  disabled={busy || activeActionId === profile.id}
                  onclick={() => void invoke(() => onOpenRecent(profile))}
                >
                  <FolderOpen class="web-vault-launcher__recent-icon" />
                  <span class="web-vault-launcher__recent-copy">
                    <span class="web-vault-launcher__recent-name">{profile.name}</span>
                    <span class="web-vault-launcher__location">{profile.kind}</span>
                  </span>
                </button>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger
                    class="web-vault-launcher__recent-menu"
                    aria-label={`Open actions for ${profile.name}`}
                    title={`Open actions for ${profile.name}`}
                    disabled={busy || activeActionId === profile.id}
                  >
                    <Ellipsis class="web-vault-launcher__icon" />
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content align="end" side="bottom">
                    <DropdownMenu.Item onclick={() => void copyVaultId(profile)}>
                      <Copy class="web-vault-launcher__icon" />
                      Copy ID
                    </DropdownMenu.Item>
                    <DropdownMenu.Item onclick={() => openRenameDialog(profile)}>
                      <PenLine class="web-vault-launcher__icon" />
                      Rename...
                    </DropdownMenu.Item>
                    {#if profile.kind === "opfs"}
                      <DropdownMenu.Item onclick={() => openDeleteDialog(profile)}>
                        <Trash2 class="web-vault-launcher__icon" />
                        Delete...
                      </DropdownMenu.Item>
                    {/if}
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item onclick={() => void invoke(() => removeRecent(profile))}>
                      <Archive class="web-vault-launcher__icon" />
                      Remove from list
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </div>
            {/each}
          {:else}
            <div class="web-vault-launcher__empty">
              Your recent vaults will appear here after you create or open one.
            </div>
          {/if}
        </Card.Content>
      </Card.Root>
    </div>
  </div>
</section>

<Dialog.Root bind:open={settingsOpen}>
  <Dialog.Content class="web-vault-launcher__settings">
    <Dialog.Header>
      <Dialog.Title>Web Settings</Dialog.Title>
      <Dialog.Description>Choose how the launcher follows light and dark mode.</Dialog.Description>
    </Dialog.Header>
    <div class="web-vault-launcher__options">
      {#each appearanceOptions as option (option.value)}
        <Button.Root
          class="web-vault-launcher__option"
          variant={appearanceMode === option.value ? "default" : "outline"}
          onclick={() => void updateAppearance(option.value)}
        >
          {option.label}
        </Button.Root>
      {/each}
    </div>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={recentVaultDialogOpen}>
  <Dialog.Content class="web-vault-launcher__command" showCloseButton={false}>
    <Dialog.Header class="sr-only">
      <Dialog.Title>Recent Projects</Dialog.Title>
      <Dialog.Description>Search and open a recent browser vault</Dialog.Description>
    </Dialog.Header>
    <CommandView.Root shouldFilter={false} label="Search recent vaults">
      <CommandView.Input
        bind:value={recentVaultQuery}
        placeholder="Search recent vaults..."
        aria-label="Search recent vaults"
        autocomplete="off"
        spellcheck="false"
      />
      <CommandView.List aria-label="Recent projects">
        <CommandView.Empty>No matching recent vaults</CommandView.Empty>
        {#if filteredRecentVaults.length > 0}
          <CommandView.Group>
            {#each filteredRecentVaults as profile (profile.id)}
              <CommandView.Item
                value={`${profile.name} ${profile.id}`}
                onSelect={() => void invoke(() => onOpenRecent(profile))}
              >
                <CommandView.ItemIcon>
                  <Search />
                </CommandView.ItemIcon>
                <CommandView.ItemLabel>{profile.name}</CommandView.ItemLabel>
                <CommandView.ItemDescription>{profile.kind}</CommandView.ItemDescription>
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
      <Dialog.Title>New Browser Vault</Dialog.Title>
      <Dialog.Description>Choose a name for this private OPFS vault.</Dialog.Description>
    </Dialog.Header>
    <form
      class="web-vault-launcher__form"
      onsubmit={(event) => {
        event.preventDefault();
        void submitCreate();
      }}
    >
      <label class="web-vault-launcher__field">
        <span>Name</span>
        <Input.Root
          bind:value={createDialogName}
          autocomplete="off"
          autofocus
          aria-label="Name"
        />
      </label>
      <Dialog.Footer>
        <Button.Root type="button" variant="ghost" onclick={() => (createDialogOpen = false)}>
          Cancel
        </Button.Root>
        <Button.Root type="submit" disabled={!createDialogName.trim() || busy}>
          Create vault
        </Button.Root>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={importDialogOpen}>
  <Dialog.Content class="web-vault-launcher__settings">
    <Dialog.Header>
      <Dialog.Title>Import Browser Vault</Dialog.Title>
      <Dialog.Description>Choose a name for this private OPFS copy of the picked folder.</Dialog.Description>
    </Dialog.Header>
    <form
      class="web-vault-launcher__form"
      onsubmit={(event) => {
        event.preventDefault();
        void submitImport();
      }}
    >
      <label class="web-vault-launcher__field">
        <span>Name</span>
        <Input.Root
          bind:value={importDialogName}
          autocomplete="off"
          autofocus
          aria-label="Name"
        />
      </label>
      <Dialog.Footer>
        <Button.Root type="button" variant="ghost" onclick={() => (importDialogOpen = false)}>
          Cancel
        </Button.Root>
        <Button.Root type="submit" disabled={!importDialogName.trim() || busy}>
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
      <Dialog.Description>Update the stored vault name used in recent projects.</Dialog.Description>
    </Dialog.Header>
    <form
      class="web-vault-launcher__form"
      onsubmit={(event) => {
        event.preventDefault();
        void submitRename();
      }}
    >
      <label class="web-vault-launcher__field">
        <span>Name</span>
        <Input.Root bind:value={renameDialogName} autocomplete="off" autofocus />
      </label>
      <Dialog.Footer>
        <Button.Root type="button" variant="ghost" onclick={() => (renameDialogOpen = false)}>
          Cancel
        </Button.Root>
        <Button.Root type="submit" disabled={!renameDialogName.trim() || activeActionId === renameTarget?.id}>
          Save
        </Button.Root>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={deleteDialogOpen}>
  <Dialog.Content class="web-vault-launcher__settings">
    <Dialog.Header>
      <Dialog.Title>Delete vault</Dialog.Title>
      <Dialog.Description>
        Permanently delete {deleteTarget?.name ?? "this vault"} and its browser-local files.
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button.Root type="button" variant="ghost" onclick={() => (deleteDialogOpen = false)}>
        Cancel
      </Button.Root>
      <Button.Root
        type="button"
        variant="destructive"
        disabled={activeActionId === deleteTarget?.id}
        onclick={() => void submitDelete()}
      >
        Delete
      </Button.Root>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
