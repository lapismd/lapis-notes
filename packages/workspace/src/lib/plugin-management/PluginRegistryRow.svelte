<script lang="ts">
  import PackageIcon from "@lucide/svelte/icons/package";
  import type { Snippet } from "svelte";
  import PluginRegistryBadge, {
    type PluginRegistryBadgeTone,
  } from "./PluginRegistryBadge.svelte";
  import PluginRegistryStatus from "./PluginRegistryStatus.svelte";

  export interface RegistryRowBadge {
    label: string;
    tone?: PluginRegistryBadgeTone;
  }

  let {
    id,
    name,
    description,
    metadata = [],
    badges = [],
    status,
    selected = false,
    onopen,
    actions,
  }: {
    id: string;
    name: string;
    description: string;
    metadata?: string[];
    badges?: RegistryRowBadge[];
    status?: {
      label: string;
      reason?: string;
      tone?: "neutral" | "success" | "warning" | "danger";
    };
    selected?: boolean;
    onopen?: () => void;
    actions?: Snippet;
  } = $props();
</script>

<article
  class="lapis-plugin-registry-row"
  data-ui-component="plugin-registry-row"
  data-plugin-id={id}
  data-selected={selected || undefined}
>
  <div class="lapis-plugin-registry-row__icon" aria-hidden="true">
    <PackageIcon />
  </div>
  {#if onopen}
    <button
      type="button"
      class="lapis-plugin-registry-row__main"
      aria-label={`View details for ${name}`}
      onclick={onopen}
    >
      <span class="lapis-plugin-registry-row__heading">
        <strong>{name}</strong>
        <span class="lapis-plugin-registry-row__badges">
          {#each badges as item (item.label)}
            <PluginRegistryBadge label={item.label} tone={item.tone} />
          {/each}
        </span>
      </span>
      <span class="lapis-plugin-registry-row__description">{description}</span>
      {#if metadata.length}
        <span class="lapis-plugin-registry-row__metadata">
          {#each metadata as item (item)}<span>{item}</span>{/each}
        </span>
      {/if}
      {#if status}<PluginRegistryStatus {...status} />{/if}
    </button>
  {:else}
    <div class="lapis-plugin-registry-row__main">
      <div class="lapis-plugin-registry-row__heading">
        <strong>{name}</strong>
        <span class="lapis-plugin-registry-row__badges">
          {#each badges as item (item.label)}
            <PluginRegistryBadge label={item.label} tone={item.tone} />
          {/each}
        </span>
      </div>
      <p class="lapis-plugin-registry-row__description">{description}</p>
      {#if metadata.length}
        <div class="lapis-plugin-registry-row__metadata">
          {#each metadata as item (item)}<span>{item}</span>{/each}
        </div>
      {/if}
      {#if status}<PluginRegistryStatus {...status} />{/if}
    </div>
  {/if}
  {#if actions}
    <div class="lapis-plugin-registry-row__actions">{@render actions()}</div>
  {/if}
</article>
