<script lang="ts">
  import type { MetadataType } from "@lapis-notes/api";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import Cell from "../cell.svelte";
  import type { BasesView } from "../bases.svelte";
  import SummaryStrip from "../components/summary-strip.svelte";
  import { getMetadataTypeInfo } from "../metadata-type-info";

  let {
    view,
  }: {
    view: BasesView;
  } = $props();

  let groups = $derived(view.data.groupedData);
  let groupBy = $derived(view.data.groupBy);
  let groupLabel = $derived.by(() => {
    if (!groupBy) return "";
    return view.config.getDisplayName(groupBy) || groupBy;
  });
  let types = $derived.by(() => {
    return view.allProperties.reduce<Record<string, { type: MetadataType }>>(
      (acc, id) => {
        if (id.startsWith("note.")) {
          const key = id.substring(5);
          acc[id] = {
            type: getMetadataTypeInfo(
              key,
              "text",
              view.controller.app,
            ).type,
          };
        } else {
          acc[id] = { type: "text" };
        }
        return acc;
      },
      {},
    );
  });
  let visibleProperties = $derived(view.config.getOrder());
  let showsFileIdentity = $derived.by(() => {
    return visibleProperties.some((id) =>
      [
        "file",
        "file.name",
        "file.basename",
        "file.file",
        "file.fullname",
      ].includes(id),
    );
  });
  let collapsedGroups = $state<Record<string, boolean>>({});

  function groupId(
    group: { key?: { toString(): string } | null },
    index: number,
  ) {
    return `${groupBy || "ungrouped"}:${group.key?.toString() ?? `ungrouped_${index}`}`;
  }

  function isCollapsed(
    group: { key?: { toString(): string } | null },
    index: number,
  ) {
    return !!collapsedGroups[groupId(group, index)];
  }

  function toggleGroup(
    group: { key?: { toString(): string } | null },
    index: number,
  ) {
    const key = groupId(group, index);
    collapsedGroups = {
      ...collapsedGroups,
      [key]: !collapsedGroups[key],
    };
  }
</script>

<div
  class="bases-card-grid bases-style-h-full-668b21 bases-style-overflow-auto-73fc3f bases-style-px-4-f0faeb bases-style-pb-10-cbd82b"
  data-layout="list"
  data-ui-component="bases-list-view"
  data-ui-part="viewport"
>
  <SummaryStrip
    {view}
    class="bases-card-grid__summary sticky bases-style-top-0-216740 bases-style-z-20-145745 bases-style-border-b-65fdba bases-style-px-1-d8e0e3 bases-style-py-3-1b2d54 backdrop-blur"
  />
  {#each groups as group, index (index)}
    {#if groupBy}
      <div
        class="bases-card-grid__group-header sticky bases-style-top-0-216740 bases-style-z-10-236812 bases-style-border-b-65fdba bases-style-px-1-d8e0e3 bases-style-py-3-1b2d54 bases-style-text-xs-359090 bases-style-font-semibold-e83a70 bases-style-tracking-0-18em-a82f6f uppercase backdrop-blur"
      >
        <button
          type="button"
          data-ui-part="group-toggle"
          class="bases-style-flex-60fbb7 bases-style-w-full-6da6a3 bases-style-items-center-3960ff bases-style-gap-2-77a2a2 bases-style-text-left-2eba0d"
          aria-expanded={!isCollapsed(group, index)}
          onclick={() => toggleGroup(group, index)}
        >
          {#if isCollapsed(group, index)}
            <ChevronRight class="bases-style-size-4-f7b5fa bases-style-shrink-0-012fbd" />
          {:else}
            <ChevronDown class="bases-style-size-4-f7b5fa bases-style-shrink-0-012fbd" />
          {/if}
          <span>{groupLabel}</span>
          <span class="bases-card-grid__group-value">
            {#if group.hasKey()}
              {group.key?.toString()}
            {:else}
              Ungrouped
            {/if}
          </span>
        </button>
      </div>
    {/if}

    {#if !isCollapsed(group, index)}
      <ul class="bases-style-marker-text-muted-foreground-ff5bf1 bases-style-list-disc-1f33b4 bases-style-space-y-2-6f7e01 bases-style-py-3-1b2d54 bases-style-pl-6-9079b6">
        {#each group.entries as row (row.id)}
          <li
            class="bases-style-text-card-foreground-0474d7 bases-style-text-sm-fc7473 bases-style-leading-6-18550d"
            data-ui-part="row"
          >
            {#if !showsFileIdentity}
              <span class="bases-style-font-medium-2689f3">{row.file.basename}</span>
              {#if visibleProperties.length > 0}
                <span class="bases-style-text-muted-foreground-bfa603">, </span>
              {/if}
            {/if}

            {#each visibleProperties as id, index (id)}
              <span class="bases-style-inline-block-bb0c4b bases-style-align-baseline-8d378d">
                <Cell
                  app={view.controller.app}
                  name={id}
                  file={row.file}
                  readOnly={view.controller.readOnly}
                  type={types[id]?.type}
                  value={row.getValue(id)}
                  class="bases-style-inline-block-bb0c4b bases-style-h-auto-b8f0a0 bases-style-w-auto-23e1f6 bases-style-align-baseline-8d378d"
                />
              </span>
              {#if index < visibleProperties.length - 1}
                <span class="bases-style-text-muted-foreground-bfa603">, </span>
              {/if}
            {/each}
          </li>
        {/each}
      </ul>
    {/if}
  {/each}
</div>
