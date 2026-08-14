<script lang="ts">
  import type { BasesEntry, BasesView } from "../../bases.svelte";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import { useResizeObserver } from "../../hooks/useResizeObserver.svelte";
  import throttle from "lodash-es/throttle";
  import { createVirtualizer, type MetadataType } from "@lapis-notes/api";
  import { toNumber } from "..";
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";
  import Cell from "../../cell.svelte";
  import SummaryStrip from "../../components/summary-strip.svelte";
  import { getMetadataTypeInfo } from "../../metadata-type-info";
  import { onMount } from "svelte";
  import CardPlaceholder from "./card-placeholder.svelte";
  import CardImage from "../../components/card-image.svelte";

  let {
    view,
  }: {
    view: BasesView;
  } = $props();
  let queryResults = $derived(view.data);
  let groups = $derived(queryResults.groupedData);
  let groupBy = $derived(queryResults.groupBy);
  let groupLabel = $derived.by(() => {
    if (!groupBy) return "";
    return view.config.getDisplayName(groupBy) || groupBy;
  });
  let cardSize: number = $derived(toNumber(view.config.get("cardSize")) || 0);
  let imageAspectRatio: number = $derived(
    toNumber(view.config.get("imageAspectRatio")) || 1,
  );

  let imageSize: number = $derived.by(() => {
    if (!view.config.get("image")) {
      return 0;
    }
    return cardSize * imageAspectRatio;
  });
  let types = $derived.by(() => {
    return queryResults.properties
      .filter((it) => !(it.startsWith("file.") || it.startsWith("formula.")))
      .reduce<Record<string, { type: MetadataType; icon: string }>>(
        (acc, id) => {
          const key = id.startsWith("note.") ? id.substring(5) : id;
          const { type, icon } = getMetadataTypeInfo(
            key,
            "text",
            view.controller.app,
          );

          acc[id] = { type, icon };
          acc[key] = { type, icon };
          return acc;
        },
        {},
      );
  });

  let containerSize = useResizeObserver();
  let containerEl: HTMLDivElement = $state()!;
  let cardHeight = $derived.by(() => {
    return view.config.getOrder().length * 56 + 17 + imageSize + 28;
  });
  let imageFit = $derived(String(view.config.get("imageFit") || "contain"));
  let imageColumn = $derived(String(view.config.get("image") || ""));

  let gap = $state({ x: 10, y: 10 });
  let columns = $state(3);
  let rows = $derived(Math.ceil(queryResults.data.length / columns));
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

  const handleResize = throttle(() => {
    const size = Math.floor(containerSize.size.width / (cardSize + gap.x));
    columns = size;
  }, 200);

  $effect(() => {
    if (!containerSize.size.width) return;
    if (!cardSize) return;
    handleResize();
  });

  let rowVirtualizer = createVirtualizer({
    get count() {
      return rows;
    },
    getScrollElement: () => containerEl,
    estimateSize: () => cardHeight + gap.y,
    measureElement:
      typeof window !== "undefined" &&
      navigator.userAgent.indexOf("Firefox") === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 2,
  });
  $effect(() => {
    rowVirtualizer.setOptions({ count: rows });
  });

  let columnVirtualizer = createVirtualizer({
    horizontal: true,
    get count() {
      return columns;
    },
    getScrollElement: () => containerEl,
    estimateSize: () => cardSize + gap.x,
    measureElement:
      typeof window !== "undefined" &&
      navigator.userAgent.indexOf("Firefox") === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 2,
  });
  $effect(() => {
    columnVirtualizer.setOptions({ count: columns });
  });

  $effect(() => {
    const _ = [cardHeight, columns];
    rowVirtualizer.measure();
    columnVirtualizer.measure();
  });

  let show = $state(false);
  onMount(() => {
    setTimeout(() => {
      show = true;
    });
  });
</script>

{#snippet cardBody(row: BasesEntry)}
  <ScrollArea class="bases-style-h-full-668b21 bases-style-w-full-6da6a3">
    {#if imageSize}
      <CardImage
        app={view.controller.app}
        value={imageColumn ? row.getValue(imageColumn) : null}
        sourceFile={row.file}
        height={imageSize}
        fit={imageFit || "contain"}
      />
    {/if}

    {#each view.config.getOrder() as id}
      <div class="bases-style-grid-f3c543 bases-style-grid-cols-1-d7c833 bases-style-items-center-3960ff bases-style-gap-2-77a2a2 bases-style-px-2-d5eab2 bases-style-pt-2-f46b61">
        <div
          class="bases-card__label bases-style-overflow-hidden-2cd02d bases-style-text-ellipsis-6e2e11 bases-style-whitespace-nowrap-e82ae8"
        >
          {view.config.getDisplayName(id)}
        </div>
        <div
          class="bases-style-h-full-668b21 bases-style-w-full-6da6a3 bases-style-overflow-hidden-2cd02d bases-style-text-ellipsis-6e2e11 bases-style-whitespace-nowrap-e82ae8"
        >
          <Cell
            app={view.controller.app}
            name={id}
            file={row.file}
            readOnly={view.controller.readOnly}
            type={types[id]?.type}
            value={row.getValue(id)}
            class="bases-style-z-1-0bcb04 bases-style-h-full-668b21 bases-style-w-full-6da6a3 bases-style-min-w-full-a1e7a8 bases-style-overflow-hidden-2cd02d bases-style-text-nowrap-621d3b bases-style-overflow-ellipsis-5b2ef5"
          />
        </div>
      </div>
    {/each}
  </ScrollArea>
{/snippet}

{#if show}
  <div
    class="bases-card-grid bases-style-h-full-668b21 bases-style-w-full-6da6a3 bases-style-flex-grow-95a3df bases-style-overflow-auto-73fc3f bases-style-pb-16-db15dd bases-style-pl-5-151215"
    data-layout="cards"
    data-ui-component="bases-card-view"
    data-ui-part="viewport"
    bind:this={
      () => containerEl,
      (value) => {
        containerEl = value;
        containerSize.ref = value;
      }
    }
    style={`scrollbar-gutter: stable; transform: translate3d(0,0,0);`}
  >
    <SummaryStrip
      {view}
      class="bases-card-grid__summary sticky bases-style-top-0-216740 bases-style-left-0-c78fac bases-style-z-90-3d4b39 bases-style-mb-4-da0198 bases-style-py-3-1b2d54 bases-style-pr-5-752a63 backdrop-blur"
    />
    {#if groupBy}
      <div class="bases-style-space-y-6-b3542e bases-style-pr-5-752a63">
        {#each groups as group, index (`${index}_${group.key?.toString() ?? "ungrouped"}`)}
          <section class="bases-style-space-y-3-6ed543">
            <div
              class="bases-card-grid__group-header sticky bases-style-top-0-216740 bases-style-z-10-236812 bases-style-border-b-65fdba bases-style-px-1-d8e0e3 bases-style-py-3-1b2d54 bases-style-text-xs-359090 bases-style-font-semibold-e83a70 bases-style-tracking-0-18em-a82f6f uppercase backdrop-blur"
            >
              <button
                type="button"
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
            {#if !isCollapsed(group, index)}
              <div
                class="bases-style-grid-f3c543 bases-style-justify-start-4b5cc1"
                style={`grid-template-columns: repeat(auto-fill, minmax(${cardSize}px, ${cardSize}px)); gap: ${gap.y}px ${gap.x}px;`}
              >
                {#each group.entries as row (row.id)}
                  <div
                    class="bases-card bases-style-overflow-hidden-2cd02d bases-style-rounded-lg-5f22e6 border bases-style-text-sm-fc7473 bases-style-whitespace-nowrap-e82ae8"
                    data-ui-part="card"
                    style={`width: ${cardSize}px; height: ${cardHeight}px;`}
                  >
                    {@render cardBody(row)}
                  </div>
                {/each}
              </div>
            {/if}
          </section>
        {/each}
      </div>
    {:else}
      <div
        class="relative"
        style={`height: ${rowVirtualizer.getTotalSize() + cardHeight}px; width: ${columnVirtualizer.getTotalSize()}px;`}
      >
        {#each rowVirtualizer.getVirtualItems() as virtualRow (virtualRow.key)}
          {#each columnVirtualizer.getVirtualItems() as virtualColumn (virtualColumn.key)}
            {@const row =
              queryResults.data[
                virtualRow.index * columns + virtualColumn.index
              ]}
            {#if row}
              <div
                data-coord={`${virtualRow.index},${virtualColumn.index}`}
                data-ui-part="card"
                style={`width: ${cardSize}px; height: ${cardHeight}px;transform: translateX(${virtualColumn.start}px) translateY(${virtualRow.start}px)`}
                class="bases-card absolute bases-style-top-0-216740 bases-style-left-0-c78fac bases-style-w-full-6da6a3 bases-style-overflow-hidden-2cd02d bases-style-rounded-lg-5f22e6 border bases-style-text-sm-fc7473 bases-style-whitespace-nowrap-e82ae8"
              >
                {@render cardBody(row)}
              </div>
            {/if}
          {/each}
        {/each}
      </div>
    {/if}
  </div>
{:else}
  <CardPlaceholder {view} />
{/if}
