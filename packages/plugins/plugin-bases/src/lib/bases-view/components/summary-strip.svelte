<script lang="ts">
  import { cn } from "@lapis-notes/api";
  import type { BasesPropertyId } from "../bases.svelte";
  import type { BasesView } from "../bases.svelte";
  import {
    resolveConfiguredSummaries,
    formatSummaryLabel,
  } from "../summary-core";

  let {
    view,
    class: className,
  }: {
    view: BasesView;
    class?: string;
  } = $props();

  let queryResults = $derived(view.data);
  let summaries = $derived.by(() => {
    return resolveConfiguredSummaries(
      view.config.getOrder(),
      view.controller.doc.summaries,
      view.config.get("summaries") as Record<string, string> | undefined,
    ).map(({ propertyId, summaryKey }) => ({
      propertyId,
      label: formatSummaryLabel(summaryKey),
      displayName: view.config.getDisplayName(propertyId as BasesPropertyId),
      value: queryResults
        .getSummaryValue(
          view.controller,
          queryResults.data,
          propertyId as BasesPropertyId,
          summaryKey,
        )
        .toString(),
    }));
  });
</script>

{#if summaries.length}
  <div class={cn("bases-style-flex-60fbb7 bases-style-flex-wrap-1eb5c6 bases-style-gap-2-77a2a2", className)}>
    {#each summaries as summary (`${summary.propertyId}_${summary.label}`)}
      <div
        class="bases-summary-strip__item bases-style-min-w-28-4460ce bases-style-rounded-md-421ac2 border bases-style-px-3-0e17f2 bases-style-py-2-03b4dd bases-style-text-xs-359090"
      >
        <div class="bases-summary-strip__label truncate">
          {summary.displayName}
          {summary.label}
        </div>
        <div class="bases-summary-strip__value truncate bases-style-text-sm-fc7473 bases-style-font-medium-2689f3">
          {summary.value}
        </div>
      </div>
    {/each}
  </div>
{/if}
