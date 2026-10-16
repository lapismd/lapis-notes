<script lang="ts">
  import Archive from "@lucide/svelte/icons/archive";
  import Copy from "@lucide/svelte/icons/copy";
  import Ellipsis from "@lucide/svelte/icons/ellipsis";
  import FolderInput from "@lucide/svelte/icons/folder-input";
  import FolderOpen from "@lucide/svelte/icons/folder-open";
  import FolderPlus from "@lucide/svelte/icons/folder-plus";
  import PenLine from "@lucide/svelte/icons/pen-line";
  import Settings from "@lucide/svelte/icons/settings";
  import X from "@lucide/svelte/icons/x";
  import type { VaultProfile } from "@lapis-notes/api";
  import * as Button from "@lapismd/design-core/shadcn/button";
  import * as Card from "@lapismd/design-core/shadcn/card";
  import * as DropdownMenu from "@lapismd/design-core/shadcn/dropdown-menu";
  import { onMount, untrack } from "svelte";
  import { DesktopVaultLauncherState } from "./desktop-vault-launcher.svelte";
  import {
    getVaultProfileLocation,
    getVaultProfileRootPath,
    type LauncherStatus,
    type DesktopVaultLauncherHost,
  } from "./desktop-vault-launcher";
  import DesktopVaultLauncherDialogs from "./DesktopVaultLauncherDialogs.svelte";
  import lapisLogo from "./lapis-logo.svg";
  import "./desktop-vault-launcher.css";
  import "./desktop-vault-launcher-controls.css";
  let {
    status,
    errorMessage = "",
    canReturn = false,
    host,
    onCreate,
    onOpen,
    onOpenRecent,
    onClose,
  }: {
    status: LauncherStatus;
    errorMessage?: string;
    canReturn?: boolean;
    host: DesktopVaultLauncherHost;
    onCreate(): Promise<void>;
    onOpen(): Promise<void>;
    onOpenRecent(profile: VaultProfile): Promise<void>;
    onClose?(): void;
  } = $props();
  const model = new DesktopVaultLauncherState(untrack(() => host));
  const busy = $derived(status === "loading" || status === "opening");
  const visibleError = $derived(errorMessage || model.actionError);
  const actionClass = "desktop-launcher__action";
  const outlineActionClass = `${actionClass} desktop-launcher__outline`;
  onMount(() => {
    void model.refresh();
  });
</script>

<section
  class="desktop-launcher"
  data-ui-component="desktop-vault-launcher"
  data-desktop-vault-launcher
  data-desktop-drag-region
  aria-label="Vaults"
  aria-busy={busy}
>
  <div
    class="desktop-launcher__content"
    data-desktop-vault-launcher-content
    data-desktop-drag-region="false"
  >
    <div class="desktop-launcher__header">
      <div class="desktop-launcher__brand">
        <img src={lapisLogo} alt="" class="desktop-launcher__logo" />
        <div class="desktop-launcher__copy">
          <div class="desktop-launcher__eyebrow">Lapis Notes</div>
          <h1 class="desktop-launcher__heading">
            {model.recentVaults.length === 0
              ? "Create a vault"
              : "Open a vault"}
          </h1>
          <p class="desktop-launcher__description">
            {#if model.recentVaults.length === 0}
              Start a new vault on this Mac, or open an existing folder if you
              already have one.
            {:else}
              Jump back into a recent vault or create a new one on this Mac.
            {/if}
          </p>
        </div>
      </div>
      <div class="desktop-launcher__header-actions">
        <Button.Root
          variant="link"
          size="sm"
          class="desktop-launcher__settings-trigger"
          onclick={() => (model.settingsOpen = true)}
        >
          <Settings class="desktop-launcher__icon" />
          Settings
        </Button.Root>
        {#if canReturn}
          <Button.Root
            type="button"
            variant="secondary"
            size="icon-lg"
            class="desktop-launcher__close"
            aria-label="Return to previous vault"
            onclick={() => onClose?.()}
          >
            <X class="desktop-launcher__large-icon" />
          </Button.Root>
        {/if}
      </div>
    </div>

    {#if visibleError}
      <div class="desktop-launcher__error" role="alert">
        {visibleError}
      </div>
    {:else if model.actionMessage}
      <div class="desktop-launcher__message" role="status">
        {model.actionMessage}
      </div>
    {/if}

    <div class="desktop-launcher__columns">
      <Card.Root class="desktop-launcher__actions desktop-launcher__card">
        <Card.Header class="desktop-launcher__card-header">
          <Card.Title class="desktop-launcher__card-title">
            {model.recentVaults.length === 0
              ? "New Desktop Vault"
              : "Desktop Vaults"}
          </Card.Title>
          <Card.Description>
            {model.recentVaults.length === 0
              ? "Create a new vault directory first, or open an existing folder."
              : "Choose an existing folder or create a new vault directory."}
          </Card.Description>
        </Card.Header>
        <Card.Content class="desktop-launcher__action-list">
          <Button.Root
            variant={model.recentVaults.length === 0 ? "default" : "outline"}
            class={model.recentVaults.length === 0
              ? actionClass
              : outlineActionClass}
            disabled={busy}
            onclick={() => void model.invoke(onCreate)}
          >
            <FolderPlus class="desktop-launcher__large-icon" />
            <span class="desktop-launcher__action-copy">
              <span class="desktop-launcher__label">Create New Vault</span>
              <span class="desktop-launcher__hint">
                Pick a new folder location and open it immediately.
              </span>
            </span>
          </Button.Root>
          <Button.Root
            variant={model.recentVaults.length === 0 ? "outline" : "default"}
            class={model.recentVaults.length === 0
              ? outlineActionClass
              : actionClass}
            disabled={busy}
            onclick={() => void model.invoke(onOpen)}
          >
            <FolderOpen class="desktop-launcher__large-icon" />
            <span class="desktop-launcher__action-copy">
              <span class="desktop-launcher__label">Open Vault</span>
              <span class="desktop-launcher__hint">
                Choose a folder you have already been using as a vault.
              </span>
            </span>
          </Button.Root>
        </Card.Content>
      </Card.Root>

      <Card.Root class="desktop-launcher__recents desktop-launcher__card">
        <Card.Header class="desktop-launcher__card-header">
          <div class="desktop-launcher__recents-header">
            <div>
              <Card.Title class="desktop-launcher__card-title"
                >Recent Projects</Card.Title
              >
              <Card.Description
                >Recently opened vaults stored on this device.</Card.Description
              >
            </div>
            {#if model.recentVaults.length > 0}
              <Button.Root
                variant="link"
                size="sm"
                class="desktop-launcher__link"
                onclick={() => (model.recentVaultDialogOpen = true)}
              >
                View all
              </Button.Root>
            {/if}
          </div>
        </Card.Header>
        <Card.Content class="desktop-launcher__recent-list">
          {#if model.inlineRecentVaults.length > 0}
            {#each model.inlineRecentVaults as profile (profile.id)}
              <div class="desktop-launcher__recent">
                <button
                  class="desktop-launcher__recent-open"
                  data-ui-part="recent-open"
                  type="button"
                  disabled={busy || model.activeActionId === profile.id}
                  onclick={() => void model.invoke(() => onOpenRecent(profile))}
                >
                  <FolderOpen class="desktop-launcher__recent-icon" />
                  <span class="desktop-launcher__recent-copy">
                    <span class="desktop-launcher__recent-name"
                      >{profile.name}</span
                    >
                    <span class="desktop-launcher__location"
                      >{getVaultProfileLocation(profile)}</span
                    >
                  </span>
                </button>
                {#if host.copyId || host.rename || host.move || host.reveal || host.remove}
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger
                      class="desktop-launcher__recent-menu"
                      aria-label={`Open actions for ${profile.name}`}
                      title={`Open actions for ${profile.name}`}
                      disabled={busy || model.activeActionId === profile.id}
                    >
                      <Ellipsis class="desktop-launcher__icon" />
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end" side="bottom">
                      {#if host.copyId}<DropdownMenu.Item
                          onclick={() => void model.copyVaultId(profile)}
                        >
                          <Copy class="desktop-launcher__icon" />
                          Copy vault ID
                        </DropdownMenu.Item>{/if}
                      {#if host.rename}<DropdownMenu.Item
                          onclick={() => model.openRenameDialog(profile)}
                        >
                          <PenLine class="desktop-launcher__icon" />
                          Rename vault...
                        </DropdownMenu.Item>{/if}
                      {#if host.move}<DropdownMenu.Item
                          disabled={!getVaultProfileRootPath(profile)}
                          onclick={() => void model.moveRecentVault(profile)}
                        >
                          <FolderInput class="desktop-launcher__icon" />
                          Move vault...
                        </DropdownMenu.Item>{/if}
                      {#if host.reveal}<DropdownMenu.Item
                          disabled={!getVaultProfileRootPath(profile)}
                          onclick={() => void model.revealRecentVault(profile)}
                        >
                          <FolderOpen class="desktop-launcher__icon" />
                          {host.revealLabel ?? "Reveal vault in file manager"}
                        </DropdownMenu.Item>{/if}
                      {#if host.remove}<DropdownMenu.Separator />{/if}
                      {#if host.remove}<DropdownMenu.Item
                          onclick={() => void model.removeRecentVault(profile)}
                        >
                          <Archive class="desktop-launcher__icon" />
                          Remove from list
                        </DropdownMenu.Item>{/if}
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                {/if}
              </div>
            {/each}
          {:else}
            <div class="desktop-launcher__empty">
              Your recent vaults will appear here after you create or open one.
            </div>
          {/if}
        </Card.Content>
      </Card.Root>
    </div>
  </div>
</section>

<DesktopVaultLauncherDialogs {model} {onOpenRecent} />
