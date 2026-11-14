<script lang="ts">
  import BookmarkIcon from "@lucide/svelte/icons/bookmark";
  import FileTextIcon from "@lucide/svelte/icons/file-text";
  import HistoryIcon from "@lucide/svelte/icons/history";
  import NetworkIcon from "@lucide/svelte/icons/network";
  import PackageIcon from "@lucide/svelte/icons/package";
  import PresentationIcon from "@lucide/svelte/icons/presentation";
  import SearchIcon from "@lucide/svelte/icons/search";
  import SparklesIcon from "@lucide/svelte/icons/sparkles";
  import Table2Icon from "@lucide/svelte/icons/table-2";
  import ArrowUpCircleIcon from "@lucide/svelte/icons/arrow-up-circle";
  import CheckCircleIcon from "@lucide/svelte/icons/circle-check";
  import DownloadIcon from "@lucide/svelte/icons/download";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import { Button } from "@lapismd/design-core/shadcn/button";

  import {
    formatRegistryBytes,
    registryStatusLabel,
    titleCaseRegistryValue,
    type RegistryInstallAction,
  } from "./community-presentation/model-adapter";
  import type { PluginCatalogEntry as RegistryCatalogEntry } from "@lapis-notes/api";
  import CommunityChip from "./community-presentation/CommunityChip.svelte";
  import { communityChipToneForState } from "./community-presentation/model.js";
  import RegistryVerifiedImage from "./community-presentation/RegistryVerifiedImage.svelte";

  let {
    plugin,
    variant = "card",
    action,
    onOpen,
    onInstall,
    onUninstall,
  }: {
    plugin: RegistryCatalogEntry;
    variant?: "card" | "list" | "compact";
    action?: RegistryInstallAction;
    onOpen: (plugin: RegistryCatalogEntry) => void;
    onInstall?: (plugin: RegistryCatalogEntry) => void | Promise<void>;
    onUninstall?: (plugin: RegistryCatalogEntry) => void | Promise<void>;
  } = $props();

  import { imageReference } from "./community-presentation/model-adapter";
  const fallbackIcon = $derived(
    plugin.appearance?.icon ?? plugin.categories[0],
  );
  const PluginIcon = $derived(
    fallbackIcon === "sparkles" || fallbackIcon === "ai"
      ? SparklesIcon
      : fallbackIcon === "table-2" || fallbackIcon === "data"
        ? Table2Icon
        : fallbackIcon === "bookmark"
          ? BookmarkIcon
          : fallbackIcon === "network" || fallbackIcon === "graph"
            ? NetworkIcon
            : fallbackIcon === "history"
              ? HistoryIcon
              : fallbackIcon === "search"
                ? SearchIcon
                : fallbackIcon === "presentation"
                  ? PresentationIcon
                  : fallbackIcon === "file-text" || fallbackIcon === "markdown"
                    ? FileTextIcon
                    : PackageIcon,
  );

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

{#snippet pluginIcon()}
  <PluginIcon aria-hidden="true" />
{/snippet}

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
    <span
      class="registry-plugin-card__identity"
      style:--registry-plugin-accent={plugin.appearance?.accent ??
        "var(--primary)"}
    >
      {#if plugin.appearance?.logo}
        <RegistryVerifiedImage
          reference={imageReference(plugin.appearance.logo)}
          alt={plugin.appearance.logo.alt}
          fallback={pluginIcon}
          loading="lazy"
        />
      {:else}
        <PluginIcon aria-hidden="true" />
      {/if}
    </span>
    <span class="registry-plugin-card__content">
      <span class="registry-plugin-card__title">{plugin.name}</span>
      <span class="registry-plugin-card__description">{plugin.description}</span>
      {#if variant !== "compact"}
        <span class="registry-plugin-card__metadata">
          <span>{plugin.latestVersion}</span>
          {#if plugin.latestRelease}
            <span>{formatRegistryBytes(plugin.latestRelease.bundleSize)}</span>
          {/if}
          <span>{plugin.platforms.map(titleCaseRegistryValue).join(", ")}</span>
        </span>
        <span class="registry-plugin-card__categories" aria-label="Plugin tags">
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
      {#if action.state === "installed" || action.installedVersion}
        <CommunityChip tone="success" size="compact">
          {action.state === "installed" ? actionLabel : "Installed"}
        </CommunityChip>
      {/if}
      {#if action.state === "available" || action.state === "rejected"}
        <Button
          type="button"
          size="sm"
          aria-label={`${actionLabel} ${plugin.name}`}
          onclick={() => void onInstall?.(plugin)}
        >
          {#if action.label === "Update"}<ArrowUpCircleIcon
              data-icon="inline-start"
              aria-hidden="true"
            />{:else}<DownloadIcon
              data-icon="inline-start"
              aria-hidden="true"
            />{/if}
          {actionLabel}
        </Button>
      {:else if action.state === "installing"}
        <Button type="button" size="sm" disabled aria-busy="true">
          <DownloadIcon data-icon="inline-start" aria-hidden="true" />
          Installing…
        </Button>
      {:else if action.state === "installed" && !onUninstall}
        <CheckCircleIcon aria-hidden="true" />
      {/if}
      {#if onUninstall}
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-label={`Uninstall ${plugin.name}`}
          onclick={() => void onUninstall(plugin)}
        >
          <Trash2Icon data-icon="inline-start" aria-hidden="true" />
          Uninstall
        </Button>
      {/if}
    </div>
  {/if}
</article>

<style>
  .registry-plugin-card {
    display: grid;
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
    gap: 0.4rem;
  }

  .registry-plugin-card__actions > :global(svg) {
    width: 1rem;
    color: var(--muted-foreground);
  }

  .registry-plugin-card__identity {
    display: grid;
    width: 2.75rem;
    height: 2.75rem;
    place-items: center;
    overflow: hidden;
    border: 1px solid
      color-mix(in srgb, var(--registry-plugin-accent) 38%, var(--border));
    border-radius: calc(var(--radius) * 1.1);
    color: var(--registry-plugin-accent);
    background: color-mix(
      in srgb,
      var(--registry-plugin-accent) 14%,
      var(--muted)
    );
  }

  .registry-plugin-card__identity :global(svg) {
    width: 1.35rem;
    height: 1.35rem;
  }

  .registry-plugin-card__identity :global(img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
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
