<script lang="ts">
  import FolderOpen from "@lucide/svelte/icons/folder-open";
  import FolderPlus from "@lucide/svelte/icons/folder-plus";
  import Search from "@lucide/svelte/icons/search";
  import Settings from "@lucide/svelte/icons/settings";
  import {
    deleteVaultProfile,
    getBootstrapAppearanceMode,
    listVaultProfiles,
    saveBootstrapAppearanceMode,
    type BootstrapAppearanceMode,
    type VaultProfile,
  } from "@lapis-notes/api";
  import * as Button from "@lapismd/design-core/shadcn/button";
  import * as Card from "@lapismd/design-core/shadcn/card";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";
  import * as Input from "@lapismd/design-core/shadcn/input";
  import { onMount } from "svelte";

  export type WebLauncherStatus = "loading" | "landing" | "opening" | "error";

  let {
    status,
    errorMessage = "",
    onCreate,
    onOpen,
    onOpenRecent,
  }: {
    status: WebLauncherStatus;
    errorMessage?: string;
    onCreate(name: string): Promise<void>;
    onOpen(): Promise<void>;
    onOpenRecent(profile: VaultProfile): Promise<void>;
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
  let newVaultName = $state("My Vault");
  let recentVaultQuery = $state("");
  let recentVaultDialogOpen = $state(false);
  let settingsOpen = $state(false);
  let appearanceMode = $state<BootstrapAppearanceMode>("system");
  let localError = $state("");

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

  function applyAppearance(mode: BootstrapAppearanceMode): void {
    const dark =
      mode === "dark" ||
      (mode === "system" &&
        globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches);
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
      localError = error instanceof Error ? error.message : String(error);
    }
  }

  async function invoke(action: () => Promise<void>): Promise<void> {
    localError = "";
    try {
      await action();
    } catch (error) {
      localError = error instanceof Error ? error.message : String(error);
    }
  }

  async function updateAppearance(mode: BootstrapAppearanceMode): Promise<void> {
    appearanceMode = mode;
    applyAppearance(mode);
    await saveBootstrapAppearanceMode(mode);
  }

  async function removeRecent(profile: VaultProfile): Promise<void> {
    await deleteVaultProfile(profile.id);
    await refresh();
  }
</script>

<section
  class="web-vault-launcher bg-background text-foreground"
  data-web-vault-launcher
  aria-busy={busy}
>
  <div class="web-vault-launcher__content">
    <header class="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
      <div class="flex min-w-0 items-center gap-4">
        <img src="/favicon.svg" alt="" class="size-14 shrink-0" />
        <div class="min-w-0">
          <div class="text-muted-foreground text-xs font-semibold tracking-[0.28em] uppercase">
            Lapis Notes
          </div>
          <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">
            {recentVaults.length ? "Open a vault" : "Create a vault"}
          </h1>
          <p class="text-muted-foreground mt-1 text-sm">
            Keep notes in browser-local storage or open a folder from this device.
          </p>
        </div>
      </div>
      <Button.Root variant="link" size="sm" onclick={() => (settingsOpen = true)}>
        <Settings class="size-4" />
        Settings
      </Button.Root>
    </header>

    {#if errorMessage || localError}
      <div class="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border px-4 py-3 text-sm" role="alert">
        {errorMessage || localError}
      </div>
    {/if}

    <div class="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <Card.Root class="border-border/70 bg-card/90 min-w-0 gap-0">
        <Card.Header class="px-6 pb-0">
          <Card.Title class="text-xl">Browser Vaults</Card.Title>
          <Card.Description>Create private OPFS storage or open an existing folder.</Card.Description>
        </Card.Header>
        <Card.Content class="grid gap-3 px-6 pb-6">
          <label class="grid gap-2 text-sm">
            <span class="font-medium">New vault name</span>
            <Input.Root bind:value={newVaultName} autocomplete="off" disabled={busy} />
          </label>
          <Button.Root
            class="web-vault-launcher__action"
            disabled={busy || !newVaultName.trim()}
            onclick={() => void invoke(() => onCreate(newVaultName.trim()))}
          >
            <FolderPlus class="size-5 shrink-0" />
            <span class="flex flex-col items-start gap-1 text-left">
              <span class="font-medium">Create Browser Vault</span>
              <span class="text-xs font-normal opacity-80">Stored locally through OPFS.</span>
            </span>
          </Button.Root>
          <Button.Root
            variant="outline"
            class="web-vault-launcher__action"
            disabled={busy}
            onclick={() => void invoke(onOpen)}
          >
            <FolderOpen class="size-5 shrink-0" />
            <span class="flex flex-col items-start gap-1 text-left">
              <span class="font-medium">Open Folder</span>
              <span class="text-xs font-normal opacity-80">Use the File System Access API.</span>
            </span>
          </Button.Root>
        </Card.Content>
      </Card.Root>

      <Card.Root class="border-border/70 bg-card/90 min-w-0 gap-0">
        <Card.Header class="px-6 pb-0">
          <div class="flex items-start justify-between gap-3">
            <div>
              <Card.Title class="text-xl">Recent Projects</Card.Title>
              <Card.Description>Vaults stored for this browser profile.</Card.Description>
            </div>
            {#if recentVaults.length}
              <Button.Root variant="link" size="sm" onclick={() => (recentVaultDialogOpen = true)}>
                View all
              </Button.Root>
            {/if}
          </div>
        </Card.Header>
        <Card.Content class="grid gap-2 px-4 pb-4">
          {#if inlineRecentVaults.length}
            {#each inlineRecentVaults as profile (profile.id)}
              <div class="border-border/60 flex items-center gap-1 rounded-xl border p-1">
                <button
                  type="button"
                  class="web-vault-launcher__recent"
                  disabled={busy}
                  onclick={() => void invoke(() => onOpenRecent(profile))}
                >
                  <FolderOpen class="text-muted-foreground size-4 shrink-0" />
                  <span class="flex min-w-0 flex-1 flex-col text-left">
                    <span class="truncate font-medium">{profile.name}</span>
                    <span class="text-muted-foreground truncate text-xs">{profile.kind}</span>
                  </span>
                </button>
                <Button.Root
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove ${profile.name} from recent projects`}
                  onclick={() => void invoke(() => removeRecent(profile))}
                >
                  Remove
                </Button.Root>
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
  <Dialog.Content class="web-vault-launcher__settings sm:max-w-[28rem]">
    <Dialog.Header>
      <Dialog.Title>Web Settings</Dialog.Title>
      <Dialog.Description>Choose how the launcher follows light and dark mode.</Dialog.Description>
    </Dialog.Header>
    <div class="grid gap-3">
      {#each appearanceOptions as option (option.value)}
        <Button.Root
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
