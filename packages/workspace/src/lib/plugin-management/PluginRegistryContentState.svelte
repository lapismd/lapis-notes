<script lang="ts">
  import AlertTriangle from "@lucide/svelte/icons/alert-triangle";
  import CircleCheck from "@lucide/svelte/icons/circle-check";
  import PackageIcon from "@lucide/svelte/icons/package";
  import SearchX from "@lucide/svelte/icons/search-x";
  import Sparkles from "@lucide/svelte/icons/sparkles";
  import * as Button from "@lapismd/design-core/shadcn/button";

  let {
    kind,
    heading,
    description,
    actionLabel,
    onaction,
    sourceUrl,
    diagnostic,
    compact = false,
    part,
  }: {
    kind: "empty" | "filtered" | "success" | "loading" | "error" | "warning";
    heading: string;
    description: string;
    actionLabel?: string;
    onaction?: () => void;
    sourceUrl?: string;
    diagnostic?: string;
    compact?: boolean;
    part?: string;
  } = $props();
</script>

<div
  class="lapis-plugin-registry-state"
  data-ui-component="plugin-registry-content-state"
  data-state-kind={kind}
  data-compact={compact || undefined}
  data-ui-part={part}
  role={kind === "error" || kind === "warning" ? "status" : undefined}
>
  <div
    class="lapis-plugin-registry-state__icon"
    data-empty-icon={kind === "success"
      ? "circle-check"
      : kind === "filtered"
        ? "search-x"
        : kind === "error" || kind === "warning"
          ? "alert-triangle"
          : "package"}
    aria-hidden="true"
  >
    {#if kind === "success"}
      <CircleCheck />
    {:else if kind === "filtered"}
      <SearchX />
    {:else if kind === "error" || kind === "warning"}
      <AlertTriangle />
    {:else}
      <PackageIcon />
      {#if kind !== "loading"}<Sparkles />{/if}
    {/if}
  </div>
  <div class="lapis-plugin-registry-state__body">
    <h2>{heading}</h2>
    <p>{description}</p>
    <div class="lapis-plugin-registry-state__actions">
      {#if actionLabel && onaction}
        <Button.Root size="sm" variant={kind === "error" ? "outline" : "default"} onclick={onaction}
          >{actionLabel}</Button.Root
        >
      {/if}
      {#if sourceUrl}<a href={sourceUrl}>View source</a>{/if}
    </div>
    {#if diagnostic}
      <details>
        <summary>Diagnostic</summary>
        <code>{diagnostic}</code>
      </details>
    {/if}
  </div>
</div>
