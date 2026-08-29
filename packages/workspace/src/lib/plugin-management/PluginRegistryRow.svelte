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
    version,
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
    version?: string;
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
  data-has-actions={actions ? "true" : undefined}
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
        <span class="lapis-plugin-registry-row__identity">
          <strong>{name}</strong>
          {#each badges as item (item.label)}
            <PluginRegistryBadge label={item.label} tone={item.tone} />
          {/each}
          {#if status}
            <PluginRegistryStatus label={status.label} tone={status.tone} />
          {/if}
        </span>
        {#if version}
          <span class="lapis-plugin-registry-row__version">{version}</span>
        {/if}
      </span>
      <span class="lapis-plugin-registry-row__description">{description}</span>
      {#if metadata.length}
        <span class="lapis-plugin-registry-row__metadata">
          {#each metadata as item (item)}<span>{item}</span>{/each}
        </span>
      {/if}
      {#if status?.reason}
        <span
          class="lapis-plugin-registry-row__status-reason"
          data-status-tone={status.tone ?? "neutral"}>{status.reason}</span
        >
      {/if}
    </button>
  {:else}
    <div class="lapis-plugin-registry-row__main">
      <div class="lapis-plugin-registry-row__heading">
        <span class="lapis-plugin-registry-row__identity">
          <strong>{name}</strong>
          {#each badges as item (item.label)}
            <PluginRegistryBadge label={item.label} tone={item.tone} />
          {/each}
          {#if status}
            <PluginRegistryStatus label={status.label} tone={status.tone} />
          {/if}
        </span>
        {#if version}
          <span class="lapis-plugin-registry-row__version">{version}</span>
        {/if}
      </div>
      <p class="lapis-plugin-registry-row__description">{description}</p>
      {#if metadata.length}
        <div class="lapis-plugin-registry-row__metadata">
          {#each metadata as item (item)}<span>{item}</span>{/each}
        </div>
      {/if}
      {#if status?.reason}
        <p
          class="lapis-plugin-registry-row__status-reason"
          data-status-tone={status.tone ?? "neutral"}>{status.reason}</p
        >
      {/if}
    </div>
  {/if}
  {#if actions}
    <div class="lapis-plugin-registry-row__actions">{@render actions()}</div>
  {/if}
</article>
