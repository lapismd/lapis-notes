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

  import {
    formatRegistryBytes,
    registryStatusLabel,
    titleCaseRegistryValue,
  } from "./community-presentation/model-adapter";
  import type { PluginCatalogEntry as RegistryCatalogEntry } from "@lapis-notes/api";
  import CommunityChip from "./community-presentation/CommunityChip.svelte";
  import { communityChipToneForState } from "./community-presentation/model.js";
  import RegistryVerifiedImage from "./community-presentation/RegistryVerifiedImage.svelte";

  let {
    plugin,
    variant = "card",
    onOpen,
  }: {
    plugin: RegistryCatalogEntry;
    variant?: "card" | "list" | "compact";
    onOpen: (plugin: RegistryCatalogEntry) => void;
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
</script>

{#snippet pluginIcon()}
  <PluginIcon aria-hidden="true" />
{/snippet}

<a
  href={`#/registry/plugins/${encodeURIComponent(plugin.id)}`}
  class="registry-plugin-card"
  data-variant={variant}
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

<style>
  .registry-plugin-card {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    width: 100%;
    gap: 0.85rem;
    border: 1px solid var(--border);
    border-radius: calc(var(--radius) * 1.35);
    padding: 1rem;
    color: var(--foreground);
    background: color-mix(in srgb, var(--card) 94%, transparent);
    text-align: start;
    text-decoration: none;
    cursor: pointer;
    transition:
      border-color 150ms ease,
      background 150ms ease,
      transform 150ms ease;
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

  .registry-plugin-card:hover,
  .registry-plugin-card:focus-visible {
    border-color: color-mix(in srgb, var(--primary) 45%, var(--border));
    background: var(--accent);
    outline: none;
  }

  .registry-plugin-card[data-variant="card"]:hover {
    transform: translateY(-1px);
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
