<script lang="ts" generics="TData, TValue">
  import {
    getCoreRowModel,
    getSortedRowModel,
    type ColumnDef,
    type ColumnOrderState,
    type ColumnSizingInfoState,
    type ColumnSizingState,
    type Header,
    type VisibilityState,
  } from "@tanstack/table-core";
  import TableHeader from "./table-header.svelte";
  import { DragDropProvider } from "@dnd-kit/svelte";
  import type { DragEndEvent } from "@dnd-kit/dom";
  import { arrayMove } from "@dnd-kit/helpers";
  import { createVirtualizer, type MetadataType } from "@lapis-notes/api";
  import Cell from "../../cell.svelte";
  import {
    BasesEntry,
    type BasesPropertyId,
    type BasesView,
    type QueryController,
  } from "../../bases.svelte";
  import {
    createSvelteTable,
    renderComponent,
  } from "../../data-table-adapter";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import type { SortColumn } from "../../models";
  import { getMetadataTypeInfo } from "../../metadata-type-info";
  import {
    formatSummaryLabel,
    resolveConfiguredSummaries,
  } from "../../summary-core";
  import SortHeader from "./sort-header.svelte";
  import { resolveVirtualTotalSize } from "./table-virtualizer-core";
  import * as ScrollArea from "@lapismd/design-core/shadcn/scroll-area";
  import { onDestroy, onMount, untrack } from "svelte";
  import TablePlaceholder from "./table-placeholder.svelte";
  import { useResizeObserver } from "../../hooks/useResizeObserver.svelte";
  import { resolveTableColumnTracks } from "./table-column-tracks";

  type DataTableProps = {
    view: BasesView;
  };

  type GroupConfig = {
    property: BasesPropertyId;
    direction: "ASC" | "DESC";
  };

  type TableDisplayItem =
    | {
        kind: "group";
        key: string;
        label: string;
        value: string;
        collapsed: boolean;
      }
    | {
        kind: "row";
        key: string;
        row: BasesEntry;
      };

  type GroupSection = {
    key: string;
    label: string;
    value: string;
    collapsed: boolean;
    start: number;
  };

  let { view }: DataTableProps = $props();

  let queryResults = $derived(view.data);

  let columnSizingInfo: ColumnSizingInfoState = $state({
    columnSizingStart: [],
    deltaOffset: null,
    deltaPercentage: null,
    isResizingColumn: false,
    startOffset: null,
    startSize: null,
  });

  let types = $derived.by(() => {
    return queryResults.properties
      .filter((it) => it.startsWith("note."))
      .reduce<Record<string, { type: MetadataType; icon: string }>>(
        (acc, id) => {
          const key = id.substring(5);
          const { type, icon } = getMetadataTypeInfo(
            key,
            "text",
            view.controller.app,
          );

          acc[id] = { type, icon };
          return acc;
        },
        {},
      );
  });

  const FILE_ICONS: Record<string, string> = {
    file: "lucide-file",
    "file.name": "lucide-text",
    "file.basename": "lucide-text",
    "file.fullname": "lucide-text",
    "file.folder": "lucide-text",
    "file.path": "lucide-text",
    "file.ext": "lucide-text",
    "file.ctime": "lucide-clock",
    "file.mtime": "lucide-clock",
    "file.size": "lucide-binary",
    "file.tags": "lucide-tags",
  };

  function getIcon(id: BasesPropertyId) {
    if (id.startsWith("formula.")) {
      return "lucide-square-function";
    } else if (id.startsWith("file.")) {
      return FILE_ICONS[id] || "lucide-file";
    }
    return types[id]?.icon || "lucide-file";
  }

  const MIN_COLUMN_WIDTH = 120;
  const DEFAULT_COLUMN_WIDTH = 300;
  const HEADER_PADDING_WIDTH = 96;
  const CELL_PADDING_WIDTH = 24;
  const GROUP_HEADER_HEIGHT = 44;
  const ACTIVE_SEARCH_HEIGHT = 36;

  export function estimateTextWidth(
    text: string,
    font: string = '20px ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
  ): number {
    if (!text) return 0;
    // Reuse a single offscreen canvas for performance
    const canvas: HTMLCanvasElement =
      (estimateTextWidth as any)._canvas ||
      ((estimateTextWidth as any)._canvas = document.createElement("canvas"));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("2D context not available on this browser.");

    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
  }

  let columnSizing = $derived(
    (view.config.get("columnSize") || {}) as ColumnSizingState,
  );

  let intrinsicWidths: Record<string, number> = $derived.by(() => {
    const sizes: Record<string, number> = {};
    const order = view.config.getOrder();

    for (const id of order) {
      const label = view.config.getDisplayName(id as BasesPropertyId) || id;
      sizes[id] = Math.min(
        DEFAULT_COLUMN_WIDTH,
        Math.max(
          MIN_COLUMN_WIDTH,
          Math.round(estimateTextWidth(label) + HEADER_PADDING_WIDTH),
        ),
      );
    }

    for (const row of queryResults.data) {
      for (const id of order) {
        if (sizes[id] === DEFAULT_COLUMN_WIDTH) continue;
        const value = row.getValue(id)?.value?.toString();
        if (!value) continue;
        const size = Math.round(estimateTextWidth(value) + CELL_PADDING_WIDTH);
        sizes[id] = Math.min(
          DEFAULT_COLUMN_WIDTH,
          Math.max(sizes[id] || MIN_COLUMN_WIDTH, size, MIN_COLUMN_WIDTH),
        );
      }
    }

    return sizes;
  });

  let containerSize = useResizeObserver();
  let resolvedWidths: Record<string, number> = $derived.by(() => {
    const order = view.config.getOrder();
    const sizes = Object.fromEntries(
      order.map((id) => [
        id,
        columnSizing[id] ?? intrinsicWidths[id] ?? DEFAULT_COLUMN_WIDTH,
      ]),
    ) as Record<string, number>;

    if (!order.length) {
      return sizes;
    }

    const availableWidth = containerSize.size.width;
    const totalWidth = order.reduce(
      (sum, id) => sum + (sizes[id] ?? DEFAULT_COLUMN_WIDTH),
      0,
    );
    const extraWidth = Math.max(0, availableWidth - totalWidth);

    if (extraWidth > 0) {
      const lastColumnId = order[order.length - 1];
      sizes[lastColumnId] =
        (sizes[lastColumnId] ?? DEFAULT_COLUMN_WIDTH) + extraWidth;
    }

    return sizes;
  });

  let columns: Array<ColumnDef<BasesEntry, any>> = $derived.by(() => {
    return view.allProperties.map((id) => {
      return {
        id: id,
        accessorKey: id,
        size: resolvedWidths[id] ?? DEFAULT_COLUMN_WIDTH,
        accessorFn: (row) => {
          return row.getValue(id);
        },
        header: ({ column }) => {
          return renderComponent(SortHeader, {
            text: view.config.getDisplayName(id),
            icon: getIcon(id),
            direction: column.getIsSorted(),
            onclick: column.getToggleSortingHandler(),
          });
        },
      };
    });
  });

  let columnOrder = $derived(view.config.getOrder());
  let summaries = $derived.by(() => {
    return resolveConfiguredSummaries(
      view.config.getOrder(),
      view.controller.doc.summaries,
      view.config.get("summaries") as Record<string, string> | undefined,
    ).map(({ propertyId, summaryKey }) => ({
      propertyId,
      label: formatSummaryLabel(summaryKey),
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
  let summaryMap = $derived.by(() => {
    return summaries.reduce<Record<string, { label: string; value: string }>>(
      (acc, summary) => {
        acc[summary.propertyId] = {
          label: summary.label,
          value: summary.value,
        };
        return acc;
      },
      {},
    );
  });

  const table = createSvelteTable({
    get data() {
      return queryResults.data;
    },
    get columns() {
      return columns;
    },
    defaultColumn: {
      minSize: 30,
      size: 300,
      maxSize: 800,
    },
    manualPagination: true,
    manualSorting: true,
    columnResizeMode: "onChange",
    enableSortingRemoval: true,
    isMultiSortEvent: (e) => true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: (updater) => {
      let sorting = view.config.getSort().map((s) => ({
        id: s.property as string,
        desc: s.direction === "DESC",
      }));
      if (typeof updater === "function") {
        sorting = updater(sorting);
      } else {
        sorting = updater;
      }
      view.config.set(
        "sort",
        sorting.map((s) => ({
          property: s.id,
          direction: s.desc ? "DESC" : "ASC",
        })) as Array<SortColumn>,
      );
    },
    onColumnVisibilityChange: (updater) => {
      let columnVisibility: VisibilityState = columns.reduce<VisibilityState>(
        (acc, value) => {
          const id = value.id as BasesPropertyId;
          if (id) {
            acc[id] = view.config.getOrder().includes(id);
          }
          return acc;
        },
        {},
      );
      if (typeof updater === "function") {
        columnVisibility = updater(columnVisibility);
      } else {
        columnVisibility = updater;
      }
      const order: string[] = [];
      view.config.getOrder().forEach((id) => {
        if (columnVisibility[id]) {
          order.push(id);
        }
      });
      const newColumns = Object.keys(columnVisibility).filter(
        (k) => columnVisibility[k] && !order.includes(k),
      );
      view.config.set("order", [...order, ...newColumns]);
    },
    onColumnSizingInfoChange: (updater) => {
      if (typeof updater === "function") {
        columnSizingInfo = updater(columnSizingInfo);
      } else {
        columnSizingInfo = updater;
      }
    },
    onColumnSizingChange: (updater) => {
      let columnSizing: ColumnSizingState = {
        ...(view.config.get("columnSize") || {}),
      };
      if (typeof updater === "function") {
        columnSizing = updater(columnSizing);
      } else {
        columnSizing = updater;
      }
      view.config.set("columnSize", columnSizing);
    },
    onColumnOrderChange: (updater) => {
      let columnOrder: ColumnOrderState = [...view.config.getOrder()];
      if (typeof updater === "function") {
        columnOrder = updater(columnOrder);
      } else {
        columnOrder = updater;
      }
      view.config.set("order", columnOrder);
    },
    state: {
      get sorting() {
        return view.config
          .getSort()
          .map((s) => ({ id: s.property, desc: s.direction === "DESC" }));
      },
      get columnSizingInfo() {
        return columnSizingInfo;
      },
      get columnSizing() {
        return columnSizing;
      },
      get columnVisibility() {
        return columns.reduce<VisibilityState>((acc, value) => {
          const id = value.id as BasesPropertyId;
          if (id) {
            acc[id] = view.config.getOrder().includes(id);
          }
          return acc;
        }, {});
      },
      get columnOrder() {
        return columnOrder;
      },
    },
  });

  function handleDragEnd(event: DragEndEvent) {
    const active = event.operation.source;
    const over = event.operation.target;
    if (active && over && active.id !== over.id) {
      const oldIndex = view.config
        .getOrder()
        .indexOf(active.id as BasesPropertyId);
      const newIndex = view.config
        .getOrder()
        .indexOf(over.id as BasesPropertyId);
      view.config.set(
        "order",
        arrayMove(view.config.getOrder(), oldIndex, newIndex),
      );
    }
  }

  const rowHeights: Record<string, number> = {
    short: 30,
    medium: 60,
    tall: 120,
    extra: 240,
  };
  let rowHeight: number = $derived(
    rowHeights[view.config.get("rowHeight") as string] ?? 30,
  );
  let groupBy = $derived(view.config.get("groupBy") as GroupConfig | undefined);
  let collapsedGroups = $state<Record<string, boolean>>({});

  function getGroupKey(
    group: { key?: { toString(): string } | null },
    groupIndex: number,
  ) {
    return `group_${groupIndex}_${group.key?.toString() ?? "ungrouped"}`;
  }

  function toggleGroupCollapse(groupKey: string) {
    collapsedGroups = {
      ...collapsedGroups,
      [groupKey]: !collapsedGroups[groupKey],
    };
  }

  let groupedResults = $derived.by(() => {
    const groups = [...queryResults.groupedData];

    if (!groupBy?.property) {
      return groups;
    }

    const direction = groupBy.direction === "DESC" ? -1 : 1;

    return groups.sort((left, right) => {
      const leftHasKey = left.hasKey();
      const rightHasKey = right.hasKey();

      if (leftHasKey && !rightHasKey) {
        return -1;
      }

      if (!leftHasKey && rightHasKey) {
        return 1;
      }

      const leftValue = left.key?.toString() ?? "";
      const rightValue = right.key?.toString() ?? "";

      return (
        direction *
        leftValue.localeCompare(rightValue, undefined, {
          numeric: true,
          sensitivity: "base",
        })
      );
    });
  });
  let displayItems = $derived.by(() => {
    const items: TableDisplayItem[] = [];
    const groupLabel = groupBy?.property
      ? view.config.getDisplayName(groupBy.property) || groupBy.property
      : "";

    for (const [groupIndex, group] of groupedResults.entries()) {
      if (groupBy?.property) {
        const groupKey = getGroupKey(group, groupIndex);
        const collapsed = !!collapsedGroups[groupKey];
        items.push({
          kind: "group",
          key: groupKey,
          label: groupLabel,
          value: group.hasKey() ? (group.key?.toString() ?? "") : "Ungrouped",
          collapsed,
        });

        if (collapsed) {
          continue;
        }
      }

      for (const row of group.entries) {
        items.push({
          kind: "row",
          key: row.id,
          row,
        });
      }
    }

    return items;
  });
  let activeSearchQuery = $derived(view.controller.searchQuery.trim());
  let showStickySearch = $derived(
    !!activeSearchQuery && !view.controller.searchPanelOpen,
  );
  let tableContainerRef: HTMLElement | null = $state(null);
  let scrollTop = $state(0);
  let headers = $derived(view.config.getOrder());
  let headerMap = $derived.by(() => {
    return table
      .getFlatHeaders()
      .reduce<Record<string, Header<BasesEntry, any>>>((acc, value) => {
        acc[value.id] = value;
        return acc;
      }, {});
  });
  let columnTracks = $derived.by(() => {
    columnSizing;
    resolvedWidths;
    const order = view.config.getOrder();
    return resolveTableColumnTracks(order, (id) => {
      return (
        headerMap[id]?.column.getSize() ??
        resolvedWidths[id] ??
        DEFAULT_COLUMN_WIDTH
      );
    });
  });
  let columnTrackMap = $derived.by(() => {
    return Object.fromEntries(
      columnTracks.tracks.map((track) => [track.id, track]),
    );
  });
  let displayItemCount = $derived(displayItems.length);
  let displayItemMeasurementKey = $derived(
    displayItems.map((item) => item.key).join("\u0000"),
  );
  let measuredItemSizes: Record<string, number> = $state({});
  let virtualItemEls: Array<HTMLDivElement | null> = $state([]);
  let rowVirtualizer = createVirtualizer({
    count: untrack(() => displayItemCount),
    getScrollElement: () => tableContainerRef,
    estimateSize: (index) =>
      untrack(() => {
        const item = displayItems[index];
        return item
          ? (measuredItemSizes[item.key] ??
              (item.kind === "group" ? GROUP_HEADER_HEIGHT : rowHeight))
          : rowHeight;
      }),
    overscan: 5,
  });

  $effect(() => {
    if (rowVirtualizer.options.count !== displayItemCount) {
      rowVirtualizer.setOptions({ count: displayItemCount });
    }
  });

  let groupSections = $derived.by(() => {
    rowVirtualizer.getTotalSize();
    const sections: GroupSection[] = [];
    let estimatedStart = 0;

    for (const [index, item] of displayItems.entries()) {
      const measurement = rowVirtualizer.measurementsCache[index];
      if (item.kind === "group") {
        sections.push({
          key: item.key,
          label: item.label,
          value: item.value,
          collapsed: item.collapsed,
          start: measurement?.start ?? estimatedStart,
        });
      }

      estimatedStart +=
        measurement?.size ??
        (item.kind === "group" ? GROUP_HEADER_HEIGHT : rowHeight);
    }

    return sections;
  });
  let stickyGroup = $derived.by(() => {
    if (!groupBy?.property || !groupSections.length) {
      return null;
    }

    let activeIndex = 0;

    for (let index = 0; index < groupSections.length; index += 1) {
      if (groupSections[index].start <= scrollTop) {
        activeIndex = index;
        continue;
      }

      break;
    }

    const active = groupSections[activeIndex];
    const next = groupSections[activeIndex + 1];
    let offset = 0;

    if (next) {
      offset = Math.min(0, next.start - scrollTop - GROUP_HEADER_HEIGHT);
    }

    return {
      ...active,
      offset,
      visible: scrollTop > active.start,
    };
  });

  let columnVirtualizer = createVirtualizer({
    horizontal: true,
    get count() {
      return view.config.getOrder().length;
    },
    getScrollElement: () => tableContainerRef,
    estimateSize: (i) => {
      return columnTracks.tracks[i]?.width ?? DEFAULT_COLUMN_WIDTH;
    },
    overscan: 3,
  });

  $effect(() => {
    columnVirtualizer.setOptions({ count: view.config.getOrder().length });
  });

  $effect(() => {
    if (!tableContainerRef) {
      return;
    }

    rowVirtualizer.setOptions({
      count: displayItems.length,
      getScrollElement: () => tableContainerRef,
    });
    columnVirtualizer.setOptions({
      count: view.config.getOrder().length,
      getScrollElement: () => tableContainerRef,
    });
  });

  $effect(() => {
    const viewport = tableContainerRef;
    if (!viewport) {
      return;
    }

    containerSize.ref = viewport;
    const updateScrollTop = () => {
      scrollTop = viewport.scrollTop;
    };
    updateScrollTop();
    viewport.addEventListener("scroll", updateScrollTop, { passive: true });

    return () => viewport.removeEventListener("scroll", updateScrollTop);
  });

  $effect(() => {
    columnTracks;
    columnSizingInfo;
    containerSize.size.width;
    view.config.getOrder();
    columnVirtualizer.measure();
  });

  let measuredDisplayItemKey = "";
  let measuredRowHeight = 0;
  let measurementFrame = 0;

  $effect(() => {
    if (
      measuredDisplayItemKey === displayItemMeasurementKey &&
      measuredRowHeight === rowHeight
    ) {
      return;
    }

    measuredDisplayItemKey = displayItemMeasurementKey;
    const rowHeightChanged = measuredRowHeight !== rowHeight;
    measuredRowHeight = rowHeight;
    if (rowHeightChanged) {
      measuredItemSizes = {};
    }
    virtualItemEls.length = displayItemCount;
    rowVirtualizer.measure();
  });

  $effect(() => {
    const _ = [
      displayItems,
      columnTracks,
      columnSizingInfo.isResizingColumn,
      rowHeight,
    ];
    const renderedElements = virtualItemEls.slice();
    cancelAnimationFrame(measurementFrame);
    measurementFrame = requestAnimationFrame(() => {
      const nextSizes = { ...measuredItemSizes };
      let sizesChanged = false;

      renderedElements.forEach((element, index) => {
        if (element?.isConnected) {
          const item = displayItems[index];
          const height = element.getBoundingClientRect().height;
          if (item && Math.abs((nextSizes[item.key] ?? 0) - height) > 0.25) {
            nextSizes[item.key] = height;
            sizesChanged = true;
          }
          rowVirtualizer.resizeItem(
            index,
            height,
          );
        }
      });

      if (sizesChanged) {
        measuredItemSizes = nextSizes;
      }
    });
  });

  onDestroy(() => cancelAnimationFrame(measurementFrame));

  type RenderedVirtualRow = ReturnType<
    typeof rowVirtualizer.getVirtualItems
  >[number];

  let virtualRows = $derived.by(() => {
    displayItems.length;
    rowHeight;
    scrollTop;
    return rowVirtualizer.getVirtualItems();
  });

  let visibleVirtualRows = $derived.by(() => {
    return virtualRows.reduce<
      Array<{ virtualRow: RenderedVirtualRow; item: TableDisplayItem }>
    >((entries, virtualRow) => {
      const item = displayItems[virtualRow.index];
      if (!item) {
        return entries;
      }

      entries.push({ virtualRow, item });
      return entries;
    }, []);
  });

  let lastDataRowIndex = $derived.by(() => {
    for (let index = displayItems.length - 1; index >= 0; index -= 1) {
      if (displayItems[index]?.kind === "row") {
        return index;
      }
    }

    return -1;
  });

  let virtualTotalSize = $derived.by(() => {
    rowHeight;
    scrollTop;
    return resolveVirtualTotalSize(
      displayItems.length,
      rowVirtualizer.getTotalSize(),
    );
  });

  let previousDisplayItemCount = $state(0);

  $effect(() => {
    const count = displayItems.length;

    if (
      count < previousDisplayItemCount &&
      tableContainerRef &&
      tableContainerRef.scrollTop > 0
    ) {
      tableContainerRef.scrollTop = 0;
      scrollTop = 0;
    }

    previousDisplayItemCount = count;
  });

  let show = $state(false);
  onMount(() => {
    setTimeout(() => {
      show = true;
    });
  });

  let tableWidth = $derived.by(() => {
    return Math.max(containerSize.size.width, columnTracks.totalWidth);
  });
</script>

<DragDropProvider onDragEnd={handleDragEnd}>
  <div
    class="bases-table-view bases-style-h-full-668b21 bases-style-w-full-6da6a3 bases-style-flex-grow-95a3df"
    data-layout="table"
    data-ui-component="bases-table-view"
    data-ui-part="scroll-area-shell"
  >
    <ScrollArea.Root
      class="bases-table__scroll-area"
      orientation="both"
      type="always"
      bind:viewportRef={tableContainerRef}
      scrollbarXClasses="bases-table__scrollbar bases-table__scrollbar--horizontal"
      scrollbarYClasses="bases-table__scrollbar bases-table__scrollbar--vertical"
    >
      <div
        class="bases-table-container bases-table relative bases-style-min-w-full-a1e7a8 bases-style-pb-100px-03c580 bases-style-text-sm-fc7473"
        style={`--ui-bases-table-row-height: ${rowHeight}px; width: ${tableWidth}px; height: ${virtualTotalSize + 2 * rowHeight}px;`}
      >
        <div
          class="bases-table__head bases-thead sticky bases-style-top-0-216740 bases-style-h-9-e7a768"
          data-ui-part="header"
        >
          <div
            class="bases-tr relative bases-style-flex-60fbb7 bases-style-h-9-e7a768 bases-style-min-w-full-a1e7a8 bases-style-flex-row-a6e886"
            style={`width: ${tableWidth}px;`}
          >
            {#each columnVirtualizer.getVirtualItems() as virtualColumn (virtualColumn.key)}
              {@const track = columnTracks.tracks[virtualColumn.index]}
              {#if track}
                <div
                  data-index={virtualColumn.index}
                  data-column-id={track.id}
                  class="bases-table__header-cell absolute bases-style-top-0-216740 bases-style-left-0-c78fac"
                  style={`inset-inline-start: ${track.startCss}; width: ${track.widthCss}`}
                >
                  <TableHeader
                    header={headerMap[track.id]}
                    icon={getIcon(track.id as BasesPropertyId)}
                    text={view.config.getDisplayName(track.id as BasesPropertyId)}
                    width={track.width}
                  />
                </div>
              {/if}
            {/each}
          </div>
        </div>
        {#if showStickySearch}
          <div
            class="bases-table__sticky-search sticky bases-style-z-96-7882ad bases-style-flex-60fbb7 bases-style-min-w-full-a1e7a8 bases-style-items-center-3960ff bases-style-gap-2-77a2a2 bases-style-border-b-65fdba bases-style-px-3-0e17f2 bases-style-py-2-03b4dd bases-style-text-sm-fc7473 backdrop-blur-sm"
            style={`top: 36px; width: ${tableWidth}px; min-height: ${ACTIVE_SEARCH_HEIGHT}px;`}
          >
            <span class="bases-table__group-label">Search</span>
            <span class="bases-style-font-medium-2689f3">{activeSearchQuery}</span>
          </div>
        {/if}
        {#if stickyGroup?.visible}
          <div
            class="bases-table__group sticky bases-style-z-95-0002d5 bases-style-flex-60fbb7 bases-style-min-w-full-a1e7a8 bases-style-items-center-3960ff bases-style-border-t-b950dd bases-style-border-b-65fdba bases-style-px-3-0e17f2 bases-style-py-2-03b4dd bases-style-text-sm-fc7473"
            style={`top: ${36 + (showStickySearch ? ACTIVE_SEARCH_HEIGHT : 0)}px; width: ${tableWidth}px; transform: translateY(${stickyGroup.offset}px); min-height: ${GROUP_HEADER_HEIGHT}px;`}
          >
            <button
              type="button"
              class="bases-style-flex-60fbb7 bases-style-w-full-6da6a3 bases-style-items-center-3960ff bases-style-gap-2-77a2a2 bases-style-text-left-2eba0d"
              aria-expanded={!stickyGroup.collapsed}
              onclick={() => toggleGroupCollapse(stickyGroup.key)}
            >
              {#if stickyGroup.collapsed}
                <ChevronRight
                  class="bases-table__group-label bases-style-size-4-f7b5fa bases-style-shrink-0-012fbd"
                />
              {:else}
                <ChevronDown class="bases-table__group-label bases-style-size-4-f7b5fa bases-style-shrink-0-012fbd" />
              {/if}
              <span class="bases-table__group-label">{stickyGroup.label}</span>
              <span class="bases-style-font-semibold-e83a70">{stickyGroup.value}</span>
            </button>
          </div>
        {/if}
        <div
          class="bases-tbody absolute"
          style={`height: ${virtualTotalSize}px;`}
        >
          {#if show}
            {#each visibleVirtualRows as entry (entry.item.key)}
              {@const virtualRow = entry.virtualRow}
              {@const item = entry.item}
              {#if item?.kind === "group"}
                <div
                  data-index={virtualRow.index}
                  bind:this={
                    () => {
                      virtualItemEls[virtualRow.index] ||= null;
                      return virtualItemEls[virtualRow.index];
                    },
                    (value) => {
                      virtualItemEls[virtualRow.index] = value;
                    }
                  }
                  class="bases-table__group absolute bases-style-top-0-216740 bases-style-left-0-c78fac bases-style-flex-60fbb7 bases-style-min-w-full-a1e7a8 bases-style-items-center-3960ff bases-style-border-t-b950dd bases-style-border-b-65fdba bases-style-px-3-0e17f2 bases-style-py-2-03b4dd bases-style-text-sm-fc7473"
                  style={`width: ${tableWidth}px; top: ${virtualRow.start}px; min-height: ${GROUP_HEADER_HEIGHT}px;`}
                >
                  <button
                    type="button"
                    class="bases-style-flex-60fbb7 bases-style-w-full-6da6a3 bases-style-items-center-3960ff bases-style-gap-2-77a2a2 bases-style-text-left-2eba0d"
                    aria-expanded={!item.collapsed}
                    onclick={() => toggleGroupCollapse(item.key)}
                  >
                    {#if item.collapsed}
                      <ChevronRight
                        class="bases-table__group-label bases-style-size-4-f7b5fa bases-style-shrink-0-012fbd"
                      />
                    {:else}
                      <ChevronDown
                        class="bases-table__group-label bases-style-size-4-f7b5fa bases-style-shrink-0-012fbd"
                      />
                    {/if}
                    <span class="bases-table__group-label">{item.label}</span>
                    <span class="bases-style-font-semibold-e83a70">{item.value}</span>
                  </button>
                </div>
              {:else if item.kind === "row"}
                {@const row = item.row}
                <div
                  data-index={virtualRow.index}
                  bind:this={
                    () => {
                      virtualItemEls[virtualRow.index] ||= null;
                      return virtualItemEls[virtualRow.index];
                    },
                    (value) => {
                      virtualItemEls[virtualRow.index] = value;
                    }
                  }
                  class="bases-table__row bases-tr absolute bases-style-top-0-216740 bases-style-left-0-c78fac bases-style-flex-60fbb7 bases-style-min-w-full-a1e7a8 bases-style-flex-row-a6e886 bases-style-transition-colors-ceb69a"
                  style={`width: ${tableWidth}px; top: ${virtualRow.start}px; min-height: var(--ui-bases-table-row-height);`}
                  data-ui-part="row"
                  data-last-row={virtualRow.index === lastDataRowIndex}
                >
                  {#each headers as id, idx (`${id}_${virtualRow.key}_${idx}`)}
                    {@const track = columnTrackMap[id]}
                    <div
                      data-column-id={id}
                      class="bases-table__cell bases-td bases-style-flex-none-81e443 bases-style-overflow-hidden-2cd02d bases-style-text-nowrap-621d3b bases-style-overflow-ellipsis-5b2ef5 bases-style-whitespace-nowrap-e82ae8"
                      style={`flex: 0 0 auto; width: ${track?.widthCss ?? "0px"}; min-height: var(--ui-bases-table-row-height)`}
                    >
                      <div
                        class="bases-table__cell-inner bases-style-h-full-668b21 bases-style-w-full-6da6a3 bases-style-px-2-d5eab2 bases-style-py-1-660d2e"
                      >
                        <Cell
                          app={view.controller.app}
                          name={id}
                          file={row.file}
                          readOnly={view.controller.readOnly}
                          type={types[id]?.type}
                          value={row.getValue(id as BasesPropertyId)}
                          class="bases-style-z-1-0bcb04 bases-style-h-full-668b21 bases-style-w-full-6da6a3 bases-style-min-w-full-a1e7a8 bases-style-overflow-hidden-2cd02d bases-style-text-nowrap-621d3b bases-style-overflow-ellipsis-5b2ef5"
                        />
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            {/each}
          {/if}
        </div>
        {#if summaries.length}
          <div
            class="bases-table__footer bases-tfoot sticky bases-style-bottom-0-189f03 bases-style-z-90-3d4b39 bases-style-border-t-b950dd backdrop-blur-sm"
          >
            <div
              class="bases-tr relative bases-style-flex-60fbb7 bases-style-min-w-full-a1e7a8 bases-style-flex-row-a6e886"
              style={`width: ${tableWidth}px;`}
            >
              {#each headers as id, idx (`${id}_summary_${idx}`)}
                {@const summary = summaryMap[id]}
                {@const track = columnTrackMap[id]}
                <div
                  data-column-id={id}
                  class="bases-table__summary-cell bases-td bases-style-min-h-11-0e5b24 bases-style-flex-none-81e443 bases-style-items-center-3960ff bases-style-overflow-hidden-2cd02d bases-style-px-2-d5eab2 bases-style-py-1-660d2e bases-style-text-xs-359090"
                  style={`flex: 0 0 auto; width: ${track?.widthCss ?? "0px"}`}
                >
                  {#if summary}
                    <div class="bases-style-min-w-0-7e0b7c">
                      <div class="bases-table__summary-label truncate">
                        {summary.label}
                      </div>
                      <div class="truncate bases-style-font-medium-2689f3">{summary.value}</div>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </ScrollArea.Root>
  </div>
</DragDropProvider>
