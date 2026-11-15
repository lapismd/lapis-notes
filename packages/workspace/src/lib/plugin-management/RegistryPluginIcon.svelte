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
  import type { PluginCatalogEntry } from "@lapis-notes/api";

  import { imageReference } from "./community-presentation/model-adapter";
  import RegistryVerifiedImage from "./community-presentation/RegistryVerifiedImage.svelte";

  let {
    plugin,
    loading = "lazy",
    class: className = "",
  }: {
    plugin: PluginCatalogEntry;
    loading?: "eager" | "lazy";
    class?: string;
  } = $props();

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
</script>

{#snippet fallback()}
  <PluginIcon aria-hidden="true" />
{/snippet}

<span
  class={`registry-plugin-icon ${className}`.trim()}
  data-ui-part="registry-plugin-icon"
  data-plugin-id={plugin.id}
  style:--registry-plugin-accent={plugin.appearance?.accent ?? "var(--primary)"}
  aria-hidden="true"
>
  {#if plugin.appearance?.logo}
    <RegistryVerifiedImage
      reference={imageReference(plugin.appearance.logo)}
      alt={plugin.appearance.logo.alt}
      {fallback}
      {loading}
    />
  {:else}
    <PluginIcon />
  {/if}
</span>

<style>
  .registry-plugin-icon {
    display: grid;
    width: 2.75rem;
    height: 2.75rem;
    flex: none;
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

  .registry-plugin-icon :global(svg) {
    width: 1.35rem;
    height: 1.35rem;
  }

  .registry-plugin-icon :global(img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>
