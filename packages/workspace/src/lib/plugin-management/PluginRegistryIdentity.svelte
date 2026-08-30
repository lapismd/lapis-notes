<script lang="ts">
  import Bookmark from "@lucide/svelte/icons/bookmark";
  import FileCode2 from "@lucide/svelte/icons/file-code-2";
  import FileText from "@lucide/svelte/icons/file-text";
  import History from "@lucide/svelte/icons/history";
  import ListChecks from "@lucide/svelte/icons/list-checks";
  import Network from "@lucide/svelte/icons/network";
  import PackageIcon from "@lucide/svelte/icons/package";
  import Search from "@lucide/svelte/icons/search";
  import Sparkles from "@lucide/svelte/icons/sparkles";
  import SpellCheck2 from "@lucide/svelte/icons/spell-check-2";
  import Table2 from "@lucide/svelte/icons/table-2";
  import WholeWord from "@lucide/svelte/icons/whole-word";
  import {
    fetchVerifiedPluginImage,
    type PluginAppearance,
    type PluginAppearanceIcon,
  } from "@lapis-notes/api";

  let {
    appearance,
    fallbackIcon = "package",
    size = "standard",
  }: {
    appearance?: PluginAppearance;
    fallbackIcon?: string;
    size?: "compact" | "standard" | "large";
  } = $props();

  const icons = {
    bookmark: Bookmark,
    "file-code-2": FileCode2,
    "file-text": FileText,
    history: History,
    "list-checks": ListChecks,
    network: Network,
    package: PackageIcon,
    search: Search,
    sparkles: Sparkles,
    "spell-check-2": SpellCheck2,
    "table-2": Table2,
    "whole-word": WholeWord,
  };
  const fallbackIcons: Record<string, PluginAppearanceIcon> = {
    ai: "sparkles",
    automation: "list-checks",
    database: "table-2",
    diagnostics: "list-checks",
    documents: "file-text",
    editor: "file-code-2",
    graph: "network",
    history: "history",
    markdown: "file-text",
    search: "search",
    visualization: "network",
    writing: "whole-word",
  };

  let verifiedLogoUrl = $state<string | null>(null);
  let logoFailed = $state(false);
  let iconName = $derived(
    appearance?.icon ?? fallbackIcons[fallbackIcon] ?? "package",
  );
  let Icon = $derived(icons[iconName]);
  let accent = $derived(appearance?.accent ?? "#8A5CF5");

  $effect(() => {
    const reference = appearance?.logo;
    verifiedLogoUrl = null;
    logoFailed = false;
    if (!reference) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    void fetchVerifiedPluginImage(reference)
      .then((blob) => {
        if (cancelled || typeof URL.createObjectURL !== "function") return;
        objectUrl = URL.createObjectURL(blob);
        verifiedLogoUrl = objectUrl;
      })
      .catch(() => {
        if (!cancelled) logoFailed = true;
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  });
</script>

<span
  class="lapis-plugin-identity"
  data-size={size}
  data-media-state={verifiedLogoUrl
    ? "verified-logo"
    : appearance?.logo && !logoFailed
      ? "loading-logo"
      : "icon-fallback"}
  style={`--plugin-identity-accent: ${accent}`}
  aria-hidden="true"
>
  {#if verifiedLogoUrl && appearance?.logo}
    <img
      src={verifiedLogoUrl}
      width={appearance.logo.width}
      height={appearance.logo.height}
      alt=""
    />
  {:else}
    <Icon />
  {/if}
</span>

<style>
  .lapis-plugin-identity {
    --plugin-identity-accent: #8a5cf5;
    display: grid;
    width: 2rem;
    height: 2rem;
    flex: none;
    place-items: center;
    overflow: hidden;
    border: 1px solid
      color-mix(
        in srgb,
        var(--plugin-identity-accent) 34%,
        var(--ui-lapis-plugin-border)
      );
    border-radius: var(--ui-workspace-radius-small, 0.375rem);
    color: var(--plugin-identity-accent);
    background:
      radial-gradient(
        circle at 28% 20%,
        color-mix(in srgb, var(--plugin-identity-accent) 28%, transparent),
        transparent 64%
      ),
      color-mix(
        in srgb,
        var(--plugin-identity-accent) 12%,
        var(--ui-lapis-plugin-muted-surface)
      );
    box-shadow: inset 0 1px 0 color-mix(in srgb, white 7%, transparent);
  }

  .lapis-plugin-identity[data-size="compact"] {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 0.3125rem;
  }

  .lapis-plugin-identity[data-size="large"] {
    width: 2.75rem;
    height: 2.75rem;
    border-radius: var(--ui-workspace-radius-medium, 0.5rem);
  }

  .lapis-plugin-identity :global(svg) {
    width: 1rem;
    height: 1rem;
  }

  .lapis-plugin-identity[data-size="compact"] :global(svg) {
    width: 0.75rem;
    height: 0.75rem;
  }

  .lapis-plugin-identity[data-size="large"] :global(svg) {
    width: 1.25rem;
    height: 1.25rem;
  }

  .lapis-plugin-identity img {
    width: 76%;
    height: 76%;
    object-fit: contain;
  }
</style>
