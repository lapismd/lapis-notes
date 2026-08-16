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
  import {
    getBootstrapAppearanceMode,
    getNativeDesktopPlatform,
    listVaultProfiles,
    moveNativeDesktopVaultProfile,
    removeStoredVaultProfile,
    replaceVaultProfile,
    revealNativeDesktopVaultPath,
    saveBootstrapAppearanceMode,
    type BootstrapAppearanceMode,
    type VaultProfile,
  } from "@lapis-notes/api";
  import { fuzzySearch } from "@lapis-notes/ui";
  import * as Button from "@lapismd/design-core/shadcn/button";
  import * as Card from "@lapismd/design-core/shadcn/card";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";
  import * as DropdownMenu from "@lapismd/design-core/shadcn/dropdown-menu";
  import * as Input from "@lapismd/design-core/shadcn/input";
  import { onMount } from "svelte";
  import lapisLogo from "../build/icon.png";
  import {
    getVaultProfileLocation,
    getVaultProfileRootPath,
  } from "./desktop-vault-profiles";

  export type LauncherStatus = "loading" | "landing" | "opening" | "error";

  let {
    status,
    errorMessage = "",
    onCreate,
    onOpen,
    onOpenRecent,
  }: {
    status: LauncherStatus;
    errorMessage?: string;
    onCreate: () => Promise<void>;
    onOpen: () => Promise<void>;
    onOpenRecent: (profile: VaultProfile) => Promise<void>;
  } = $props();

  const appearanceOptions: Array<{
    value: BootstrapAppearanceMode;
    label: string;
    description: string;
  }> = [
    {
      value: "system",
      label: "Match System",
      description: "Follow the current macOS appearance.",
    },
    {
      value: "light",
      label: "Light",
      description: "Use the light workspace palette on the vault chooser.",
    },
    {
      value: "dark",
      label: "Dark",
      description: "Use the dark workspace palette on the vault chooser.",
    },
  ];

  const actionClass =
    "workspace-shell__vault-chooser-action h-auto w-full min-w-0 items-start justify-start whitespace-normal rounded-xl px-4 py-4 text-left transition-colors";
  const outlineActionClass = `${actionClass} workspace-shell__vault-chooser-outline-control`;
  const actionTextClass =
    "flex min-w-0 flex-1 flex-col items-start gap-1 text-left";
  const recentOpenClass =
    "workspace-shell__vault-chooser-recent-open flex min-w-0 flex-1 items-start gap-3 rounded-[calc(theme(borderRadius.xl)-0.25rem)] px-3 py-2 text-left transition-colors disabled:opacity-50";
  const settingsOptionClass =
    "workspace-shell__vault-chooser-settings-option h-auto w-full min-w-0 items-start justify-start whitespace-normal rounded-xl px-4 py-3 text-left transition-colors";

  // Profiles cross the context-isolated IPC boundary when reopened or edited.
  // Keep them as plain records rather than wrapping nested handles in Svelte
  // proxies, which Electron cannot structured-clone.
  let recentVaults = $state.raw<VaultProfile[]>([]);
  let recentVaultQuery = $state("");
  let recentVaultDialogOpen = $state(false);
  let settingsOpen = $state(false);
  let appearanceMode = $state<BootstrapAppearanceMode>("system");
  let activeActionId = $state<string | null>(null);
  let renameDialogOpen = $state(false);
  let renameDialogName = $state("");
  let renameTarget = $state.raw<VaultProfile | null>(null);
  let actionError = $state("");
  let actionMessage = $state("");

  const inlineRecentVaults = $derived(recentVaults.slice(0, 4));
  const filteredRecentVaults = $derived.by(() => {
    const entries = recentVaults.map((profile) => ({
      profile,
      name: profile.name,
      location: getVaultProfileLocation(profile),
      kind: profile.kind,
    }));
    if (!recentVaultQuery.trim()) return entries;
    return fuzzySearch(entries, recentVaultQuery, {
      keys: ["name", "location", "kind"],
    }).map((result) => result.item);
  });
  const busy = $derived(status === "loading" || status === "opening");
  const visibleError = $derived(errorMessage || actionError);

  onMount(() => {
    void refresh();
  });

  function resolveAppearance(
    mode: BootstrapAppearanceMode,
  ): "dark" | "light" {
    if (mode === "system") {
      return globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return mode;
  }

  function applyAppearance(mode: BootstrapAppearanceMode): void {
    const dark = resolveAppearance(mode) === "dark";
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.classList.toggle("light", !dark);
    document.documentElement.classList.toggle("theme-dark", dark);
    document.documentElement.classList.toggle("theme-light", !dark);
  }

  async function refresh(): Promise<void> {
    try {
      [recentVaults, appearanceMode] = await Promise.all([
        listVaultProfiles(),
        getBootstrapAppearanceMode(),
      ]);
      applyAppearance(appearanceMode);
    } catch (error) {
      actionError = formatError(error);
    }
  }

  function formatError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  function revealVaultLabel(): string {
    const os = getNativeDesktopPlatform()?.os;
    if (os === "macos") return "Reveal vault in Finder";
    if (os === "windows") return "Reveal vault in File Explorer";
    return "Reveal vault in file manager";
  }

  function openRenameDialog(profile: VaultProfile): void {
    renameTarget = profile;
    renameDialogName = profile.name;
    renameDialogOpen = true;
  }

  async function runAction(
    profile: VaultProfile,
    action: () => Promise<void>,
    successMessage?: string,
  ): Promise<void> {
    activeActionId = profile.id;
    actionError = "";
    actionMessage = "";
    try {
      await action();
      await refresh();
      actionMessage = successMessage ?? "";
    } catch (error) {
      actionError = formatError(error);
    } finally {
      activeActionId = null;
    }
  }

  async function copyVaultId(profile: VaultProfile): Promise<void> {
    await runAction(
      profile,
      async () => navigator.clipboard.writeText(profile.id),
      "Vault ID copied",
    );
  }

  async function moveRecentVault(profile: VaultProfile): Promise<void> {
    activeActionId = profile.id;
    actionError = "";
    actionMessage = "";
    try {
      const moved = await moveNativeDesktopVaultProfile(profile);
      if (!moved) return;
      await refresh();
      actionMessage = "Vault moved";
    } catch (error) {
      actionError = formatError(error);
    } finally {
      activeActionId = null;
    }
  }

  async function revealRecentVault(profile: VaultProfile): Promise<void> {
    const rootPath = getVaultProfileRootPath(profile);
    if (!rootPath) {
      actionError = "Vault folder is unavailable";
      return;
    }
    await runAction(profile, () =>
      revealNativeDesktopVaultPath(rootPath, "/"),
    );
  }

  async function removeRecentVault(profile: VaultProfile): Promise<void> {
    await runAction(
      profile,
      () => removeStoredVaultProfile(profile.id),
      "Vault removed from recent projects",
    );
  }

  async function submitRename(): Promise<void> {
    if (!renameTarget) return;
    const name = renameDialogName.trim();
    if (!name) {
      actionError = "Vault name is required";
      return;
    }
    const profile = renameTarget;
    await runAction(
      profile,
      () =>
        replaceVaultProfile(profile.id, {
          ...profile,
          name,
          updatedAt: Date.now(),
        }),
      "Vault renamed",
    );
    if (!actionError) renameDialogOpen = false;
  }

  async function updateAppearance(mode: BootstrapAppearanceMode): Promise<void> {
    appearanceMode = mode;
    applyAppearance(mode);
    await saveBootstrapAppearanceMode(mode);
  }

  async function invoke(action: () => Promise<void>): Promise<void> {
    actionError = "";
    actionMessage = "";
    try {
      await action();
    } catch (error) {
      actionError = formatError(error);
    }
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
</script>

<section
  class="workspace-shell__vault-chooser flex h-full min-h-full overflow-auto bg-background px-4 py-10 text-foreground sm:px-6"
  data-desktop-vault-launcher
  aria-busy={busy}
>
  <div
    class="mx-auto my-auto grid w-full max-w-5xl min-w-0 gap-6"
    data-desktop-vault-launcher-content
  >
    <div class="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
      <div class="flex min-w-0 items-center gap-4">
        <img
          src={lapisLogo}
          alt=""
          class="size-14 shrink-0 rounded-2xl border border-border/70 bg-card object-cover shadow-sm"
        />
        <div class="min-w-0">
          <div class="text-muted-foreground text-xs font-semibold tracking-[0.28em] uppercase">
            Lapis Notes
          </div>
          <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">
            {recentVaults.length === 0 ? "Create a vault" : "Open a vault"}
          </h1>
          <p class="text-muted-foreground mt-1 text-sm">
            {#if recentVaults.length === 0}
              Start a new vault on this Mac, or open an existing folder if you
              already have one.
            {:else}
              Jump back into a recent vault or create a new one on this Mac.
            {/if}
          </p>
        </div>
      </div>
      <Button.Root
        variant="link"
        size="sm"
        class="px-0 text-sm"
        onclick={() => (settingsOpen = true)}
      >
        <Settings class="size-4" />
        Settings
      </Button.Root>
    </div>

    {#if visibleError}
      <div
        class="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border px-4 py-3 text-sm"
        role="alert"
      >
        {visibleError}
      </div>
    {:else if actionMessage}
      <div class="border-border/70 bg-card rounded-xl border px-4 py-3 text-sm" role="status">
        {actionMessage}
      </div>
    {/if}

    <div class="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <Card.Root class="workspace-shell__vault-chooser-actions border-border/70 bg-card/90 min-w-0 gap-0 backdrop-blur">
        <Card.Header class="px-6 pb-0">
          <Card.Title class="text-xl">
            {recentVaults.length === 0 ? "New Desktop Vault" : "Desktop Vaults"}
          </Card.Title>
          <Card.Description>
            {recentVaults.length === 0
              ? "Create a new vault directory first, or open an existing folder."
              : "Choose an existing folder or create a new vault directory."}
          </Card.Description>
        </Card.Header>
        <Card.Content class="grid gap-3 px-6 pb-6">
          <Button.Root
            variant={recentVaults.length === 0 ? "default" : "outline"}
            class={recentVaults.length === 0 ? actionClass : outlineActionClass}
            disabled={busy}
            onclick={() => void invoke(onCreate)}
          >
            <FolderPlus class="size-5 shrink-0" />
            <span class={actionTextClass}>
              <span class="font-medium">Create New Vault</span>
              <span class="text-xs font-normal opacity-80">
                Pick a new folder location and open it immediately.
              </span>
            </span>
          </Button.Root>
          <Button.Root
            variant={recentVaults.length === 0 ? "outline" : "default"}
            class={recentVaults.length === 0 ? outlineActionClass : actionClass}
            disabled={busy}
            onclick={() => void invoke(onOpen)}
          >
            <FolderOpen class="size-5 shrink-0" />
            <span class={actionTextClass}>
              <span class="font-medium">Open Vault</span>
              <span class="text-xs font-normal opacity-80">
                Choose a folder you have already been using as a vault.
              </span>
            </span>
          </Button.Root>
        </Card.Content>
      </Card.Root>

      <Card.Root class="workspace-shell__vault-chooser-recents border-border/70 bg-card/90 min-w-0 gap-0 backdrop-blur">
        <Card.Header class="px-6 pb-0">
          <div class="flex items-start justify-between gap-3">
            <div>
              <Card.Title class="text-xl">Recent Projects</Card.Title>
              <Card.Description>Recently opened vaults stored on this device.</Card.Description>
            </div>
            {#if recentVaults.length > 0}
              <Button.Root variant="link" size="sm" class="px-0" onclick={() => (recentVaultDialogOpen = true)}>
                View all
              </Button.Root>
            {/if}
          </div>
        </Card.Header>
        <Card.Content class="grid gap-2 px-4 pb-4">
          {#if inlineRecentVaults.length > 0}
            {#each inlineRecentVaults as profile (profile.id)}
              <div class="workspace-shell__vault-chooser-recent border-border/60 flex w-full items-stretch gap-1 rounded-xl border p-1">
                <button
                  class={recentOpenClass}
                  type="button"
                  disabled={busy || activeActionId === profile.id}
                  onclick={() => void invoke(() => onOpenRecent(profile))}
                >
                  <FolderOpen class="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <span class="flex min-w-0 flex-1 flex-col gap-1">
                    <span class="truncate font-medium">{profile.name}</span>
                    <span class="text-muted-foreground truncate text-xs">{getVaultProfileLocation(profile)}</span>
                  </span>
                </button>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger
                    class="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 my-auto flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors outline-none focus-visible:ring-[3px]"
                    aria-label={`Open actions for ${profile.name}`}
                    title={`Open actions for ${profile.name}`}
                    disabled={busy || activeActionId === profile.id}
                  >
                    <Ellipsis class="size-4" />
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content align="end" side="bottom">
                    <DropdownMenu.Item onclick={() => void copyVaultId(profile)}>
                      <Copy class="size-4" />
                      Copy vault ID
                    </DropdownMenu.Item>
                    <DropdownMenu.Item onclick={() => openRenameDialog(profile)}>
                      <PenLine class="size-4" />
                      Rename vault...
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      disabled={!getVaultProfileRootPath(profile)}
                      onclick={() => void moveRecentVault(profile)}
                    >
                      <FolderInput class="size-4" />
                      Move vault...
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      disabled={!getVaultProfileRootPath(profile)}
                      onclick={() => void revealRecentVault(profile)}
                    >
                      <FolderOpen class="size-4" />
                      {revealVaultLabel()}
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item onclick={() => void removeRecentVault(profile)}>
                      <Archive class="size-4" />
                      Remove from list
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </div>
            {/each}
          {:else}
            <div class="border-border/70 text-muted-foreground rounded-xl border border-dashed px-4 py-5 text-sm">
              Your recent vaults will appear here after you create or open one.
            </div>
          {/if}
        </Card.Content>
      </Card.Root>
    </div>
  </div>
</section>

<Dialog.Root bind:open={settingsOpen}>
  <Dialog.Content class="workspace-shell__vault-chooser-settings sm:max-w-[28rem]">
    <Dialog.Header>
      <Dialog.Title>Desktop Settings</Dialog.Title>
      <Dialog.Description>Choose how the vault chooser follows light and dark mode.</Dialog.Description>
    </Dialog.Header>
    <div class="grid gap-3">
      {#each appearanceOptions as option (option.value)}
        <Button.Root
          variant={appearanceMode === option.value ? "default" : "outline"}
          class={`${settingsOptionClass}${appearanceMode === option.value ? "" : " workspace-shell__vault-chooser-outline-control"}`}
          onclick={() => void updateAppearance(option.value)}
        >
          <span class="flex flex-col items-start gap-1">
            <span class="font-medium">{option.label}</span>
            <span class="text-xs font-normal opacity-80">{option.description}</span>
          </span>
        </Button.Root>
      {/each}
    </div>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={recentVaultDialogOpen}>
  <Dialog.Content
    class="workspace-shell__vault-chooser-command"
    showCloseButton={false}
  >
    <Dialog.Header class="sr-only">
      <Dialog.Title>Recent Projects</Dialog.Title>
      <Dialog.Description>Search and open a recent vault</Dialog.Description>
    </Dialog.Header>
    <CommandView.Root shouldFilter={false}>
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
            {#each filteredRecentVaults as entry (entry.profile.id)}
              <CommandView.Item
                value={`${entry.name} ${entry.location}`}
                onSelect={() => void invoke(() => onOpenRecent(entry.profile))}
              >
                <CommandView.ItemIcon>
                  <Search />
                </CommandView.ItemIcon>
                <CommandView.ItemLabel>{entry.name}</CommandView.ItemLabel>
                <CommandView.ItemDescription>
                  {entry.location}
                </CommandView.ItemDescription>
              </CommandView.Item>
            {/each}
          </CommandView.Group>
        {/if}
      </CommandView.List>
    </CommandView.Root>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={renameDialogOpen}>
  <Dialog.Content class="sm:max-w-[28rem]">
    <Dialog.Header>
      <Dialog.Title>Rename vault</Dialog.Title>
      <Dialog.Description>Update the stored vault name used in recent projects and app URLs.</Dialog.Description>
    </Dialog.Header>
    <form
      class="grid gap-4"
      onsubmit={(event) => {
        event.preventDefault();
        void submitRename();
      }}
    >
      <label class="grid gap-2 text-sm">
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
