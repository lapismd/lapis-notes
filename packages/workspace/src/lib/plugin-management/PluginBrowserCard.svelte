<script lang="ts">
  import ArrowUpCircleIcon from "@lucide/svelte/icons/arrow-up-circle";
  import CheckCircleIcon from "@lucide/svelte/icons/circle-check";
  import DownloadIcon from "@lucide/svelte/icons/download";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";

  import {
    formatRegistryBytes,
    registryStatusLabel,
    titleCaseRegistryValue,
    type RegistryInstallAction,
  } from "./community-presentation/model-adapter";
  import type { PluginCatalogEntry as RegistryCatalogEntry } from "@lapis-notes/api";
  import CommunityChip from "./community-presentation/CommunityChip.svelte";
  import { communityChipToneForState } from "./community-presentation/model.js";
  import RegistryPluginIcon from "./RegistryPluginIcon.svelte";

  let {
    plugin,
    variant = "card",
    action,
    showInstalledBadge = true,
    onOpen,
    onInstall,
    onUninstall,
  }: {
    plugin: RegistryCatalogEntry;
    variant?: "card" | "list" | "compact";
    action?: RegistryInstallAction;
    showInstalledBadge?: boolean;
    onOpen: (plugin: RegistryCatalogEntry) => void;
    onInstall?: (plugin: RegistryCatalogEntry) => void | Promise<void>;
    onUninstall?: (plugin: RegistryCatalogEntry) => void | Promise<void>;
  } = $props();

  function openPlugin(event: MouseEvent): void {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    onOpen(plugin);
  }

  const actionLabel = $derived(
    action?.label ??
      (action?.state === "installing"
        ? "Installing…"
        : action?.state === "installed"
          ? "Installed"
          : action?.state === "rejected"
            ? "Retry install"
            : action?.state === "disabled"
              ? "Install unavailable"
              : "Install"),
  );
</script>

<article
  class="registry-plugin-card"
  data-variant={variant}
  data-installed={action?.state === "installed" ||
    Boolean(action?.installedVersion) ||
    undefined}
>
  <a
    href={`#/registry/plugins/${encodeURIComponent(plugin.id)}`}
    class="registry-plugin-card__open"
    aria-label={`Open ${plugin.name}`}
    onclick={openPlugin}
  >
    <RegistryPluginIcon
      {plugin}
      class="registry-plugin-card__identity"
      loading="lazy"
    />
    <span class="registry-plugin-card__content">
      <span class="registry-plugin-card__title">{plugin.name}</span>
      <span class="registry-plugin-card__description">{plugin.description}</span
      >
      {#if variant !== "compact"}
        <span class="registry-plugin-card__metadata">
          <span>{plugin.latestVersion}</span>
          {#if plugin.latestRelease}
            <span>{formatRegistryBytes(plugin.latestRelease.bundleSize)}</span>
          {/if}
          <span>{plugin.platforms.map(titleCaseRegistryValue).join(", ")}</span>
        </span>
        <span class="registry-plugin-card__categories" aria-label="Plugin tags">
          {#if showInstalledBadge && action && (action.state === "installed" || action.installedVersion)}
            {#if action.label === "Update" && action.installedVersion && action.targetVersion}
              <CommunityChip tone="warning" size="compact">
                Update {action.installedVersion} → {action.targetVersion}
              </CommunityChip>
            {:else}
              <CommunityChip tone="accent" size="compact">
                {action.state === "installed" ? actionLabel : "Installed"}
              </CommunityChip>
            {/if}
          {/if}
          <CommunityChip
            tone={communityChipToneForState(plugin.status ?? "active")}
            >{registryStatusLabel(plugin.status)}</CommunityChip
          >
          {#each plugin.categories.slice(0, 3) as category}
            <CommunityChip>{titleCaseRegistryValue(category)}</CommunityChip>
          {/each}
        </span>
      {/if}
    </span>
  </a>
  {#if action}
    <div class="registry-plugin-card__actions">
      {#if action.state === "available" || action.state === "rejected"}
        {@const actionKind = action.label === "Update" ? "update" : "install"}
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger>
              {#snippet child({ props })}
                <Button
                  {...props}
                  type="button"
                  size="icon"
                  class="registry-plugin-card__action"
                  data-plugin-action={actionKind}
                  aria-label={`${actionLabel} ${plugin.name}`}
                  onclick={() => void onInstall?.(plugin)}
                >
                  {#if actionKind === "update"}<ArrowUpCircleIcon
                      aria-hidden="true"
                    />{:else}<DownloadIcon aria-hidden="true" />{/if}
                </Button>
              {/snippet}
            </Tooltip.Trigger>
            <Tooltip.Content>{actionLabel} {plugin.name}</Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>
      {:else if action.state === "installing"}
        <Button
          type="button"
          size="icon"
          class="registry-plugin-card__action"
          data-plugin-action="install"
          aria-label={`Installing ${plugin.name}`}
          disabled
          aria-busy="true"
        >
          <DownloadIcon aria-hidden="true" />
        </Button>
      {:else if action.state === "installed" && !onUninstall}
        <CheckCircleIcon aria-hidden="true" />
      {/if}
      {#if onUninstall}
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger>
              {#snippet child({ props })}
                <Button
                  {...props}
                  type="button"
                  size="icon"
                  variant="destructive"
                  class="registry-plugin-card__action"
                  data-plugin-action="uninstall"
                  aria-label={`Uninstall ${plugin.name}`}
                  onclick={() => void onUninstall(plugin)}
                >
                  <Trash2Icon aria-hidden="true" />
                </Button>
              {/snippet}
            </Tooltip.Trigger>
            <Tooltip.Content>Uninstall {plugin.name}</Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>
      {/if}
    </div>
  {/if}
</article>

<style>
  .registry-plugin-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    width: 100%;
    gap: 0.65rem;
    border: 1px solid var(--border);
    border-radius: calc(var(--radius) * 1.35);
    padding: 1rem;
    color: var(--foreground);
    background: color-mix(in srgb, var(--card) 94%, transparent);
    text-align: start;
    transition:
      border-color 150ms ease,
      background 150ms ease,
      transform 150ms ease;
  }

  .registry-plugin-card__open {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.85rem;
    color: inherit;
    text-decoration: none;
  }

  .registry-plugin-card[data-variant="compact"] {
    border: 0;
    border-radius: var(--radius);
    padding: 0.65rem;
    background: transparent;
  }

  .registry-plugin-card[data-variant="list"] {
    border-color: transparent;
    border-radius: calc(var(--radius) * 1.2);
    background: color-mix(in srgb, var(--secondary) 64%, transparent);
  }

  .registry-plugin-card:has(.registry-plugin-card__open:hover),
  .registry-plugin-card:has(.registry-plugin-card__open:focus-visible) {
    border-color: color-mix(in srgb, var(--primary) 45%, var(--border));
    background: var(--accent);
    outline: none;
  }

  .registry-plugin-card[data-variant="card"]:has(
      .registry-plugin-card__open:hover
    ) {
    transform: translateY(-1px);
  }

  .registry-plugin-card__open:focus-visible {
    outline: none;
  }

  .registry-plugin-card__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    align-self: start;
    gap: 0.4rem;
  }

  .registry-plugin-card__actions > :global(svg) {
    width: 1rem;
    color: var(--muted-foreground);
  }

  :global(.registry-plugin-card__action[data-ui-component="button"]) {
    width: 2rem;
    height: 2rem;
    min-height: 2rem;
    border-radius: 999px;
    color: var(--primary-foreground);
    background: var(--primary);
  }

  :global(.registry-plugin-card__action[data-ui-component="button"]:hover),
  :global(
      .registry-plugin-card__action[data-ui-component="button"]:focus-visible
    ) {
    background: color-mix(in srgb, var(--primary) 82%, black);
  }

  :global(.registry-plugin-card__action[data-plugin-action="uninstall"]) {
    color: var(--destructive-foreground);
    background: var(--destructive);
  }

  :global(.registry-plugin-card__action[data-plugin-action="uninstall"]:hover),
  :global(
      .registry-plugin-card__action[data-plugin-action="uninstall"]:focus-visible
    ) {
    background: color-mix(in srgb, var(--destructive) 82%, black);
  }

  .registry-plugin-card__content {
    display: grid;
    min-width: 0;
    gap: 0.35rem;
  }

  .registry-plugin-card__title {
    font-weight: 700;
    line-height: 1.2;
  }

  .registry-plugin-card__description {
    display: -webkit-box;
    overflow: hidden;
    color: var(--muted-foreground);
    font-size: var(--community-text-body);
    line-height: 1.35;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }

  .registry-plugin-card[data-variant="compact"]
    .registry-plugin-card__description {
    -webkit-line-clamp: 1;
    line-clamp: 1;
  }

  .registry-plugin-card__metadata,
  .registry-plugin-card__categories {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem 0.65rem;
    color: var(--muted-foreground);
    font-size: var(--community-text-secondary);
  }
</style>
