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
  import * as Table from "@lapismd/design-core/shadcn/table";
  import TableHeader from "./table-header.svelte";
  import { DragDropProvider } from "@dnd-kit/svelte";
  import type { DragEndEvent } from "@dnd-kit/dom";
  import { arrayMove } from "@dnd-kit/helpers";
  import { styleObjectToString } from "./dnd-style";
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
  import { getMetadataTypeInfo } from "../../metadata-type-info";
  import type { SortColumn } from "../../models";
  import SortHeader from "./sort-header.svelte";
  import { onMount } from "svelte";
  import TablePlaceholder from "./table-placeholder.svelte";

  type DataTableProps = {
    view: BasesView;
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

  export function estimateTextWidth(
    text: string,
    font: string = '16px ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
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

  let columns: Array<ColumnDef<BasesEntry, any>> = $derived.by(() => {
    return view.allProperties.map((id) => {
      return {
        id: id,
        accessorKey: id,
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

  let widths: Record<string, number> = $derived.by(() => {
    const sizes: Record<string, number> = {};
    for (const row of queryResults.data) {
      for (const column of columns) {
        const id = column.id!;
        if (sizes[id] === 300) continue;
        const size = estimateTextWidth(row.getValue(id)?.value?.toString());
        if (!size) continue;
        sizes[id] = Math.min(size, 300);
      }
    }
    console.log("sizes", sizes);
    return sizes;
  });

  let columnOrder = $derived(view.config.getOrder());

  const table = createSvelteTable({
    get data() {
      return queryResults.data;
    },
    get columns() {
      return columns;
    },
    defaultColumn: {
      minSize: 60,
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
        return (view.config.get("columnSize") || {}) as ColumnSizingState;
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

  let columnSizeVars = $derived.by(() => {
    const headers = table.getFlatHeaders();
    const colSizes: { [key: string]: number } = {};
    for (const header of headers) {
      if (!view.config.getOrder().includes(header.id as BasesPropertyId))
        continue;
      colSizes[`--header-${CSS.escape(header.id)}-size`] = header.getSize();
      colSizes[`--col-${CSS.escape(header.column.id)}-size`] =
        header.column.getSize();
    }
    return colSizes;
  });

  let totalSize: string | number = $derived.by(() => {
    if (Object.keys(view.config.get("columnSize") || {}).length > 0) {
      return table.getTotalSize();
    }
    return "auto";
  });
  const rowHeights: Record<string, number> = {
    short: 30,
    medium: 60,
    tall: 120,
    extra: 240,
  };
  let rowHeight: number = $derived(
    rowHeights[view.config.get("rowHeight") as string] ?? 30,
  );
  let tableContainerRef: HTMLDivElement | null = $state(null);
  let headers = $derived(view.config.getOrder());
  let headerMap = $derived.by(() => {
    return table
      .getFlatHeaders()
      .reduce<Record<string, Header<BasesEntry, any>>>((acc, value) => {
        acc[value.id] = value;
        return acc;
      }, {});
  });

  let colSpan = $derived(
    table.getAllColumns().filter((it) => it.getIsVisible()).length,
  );
  let virtualItemEls: Array<HTMLDivElement | null> = $state([]);
  let virtualizer = createVirtualizer({
    get count() {
      return queryResults.data.length;
    },
    getScrollElement: () => tableContainerRef,
    estimateSize: () => rowHeight,
    measureElement:
      typeof window !== "undefined" &&
      navigator.userAgent.indexOf("Firefox") === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5,
  });

  $effect(() => {
    virtualizer.setOptions({ count: queryResults.data.length });
  });

  let [paddingTop, paddingBottom] = $derived.by(() => {
    const items = virtualizer.getVirtualItems();
    return items.length > 0
      ? [
          Math.max(0, items[0].start - virtualizer.options.scrollMargin),
          Math.max(0, virtualizer.getTotalSize() - items[items.length - 1].end),
        ]
      : [0, 0];
  });

  $effect(() => {
    virtualItemEls.forEach((el) => virtualizer.measureElement(el));
  });

  let show = $state(false);
  onMount(() => {
    setTimeout(() => {
      show = true;
    });
  });
</script>

{#if show}
  <DragDropProvider onDragEnd={handleDragEnd}>
    <div
      class="bases-style-h-full-668b21 bases-style-w-full-6da6a3 bases-style-flex-grow-95a3df bases-style-overflow-auto-73fc3f bases-style-pb-16-db15dd"
      style="scrollbar-gutter: stable; transform: translate3d(0,0,0)"
      data-layout="table"
      bind:this={tableContainerRef}
    >
      <div
        class="relative bases-style-pb-100px-03c580"
        style={styleObjectToString({
          ...columnSizeVars,
          "--ui-bases-table-row-height": rowHeight,
          width: totalSize,
          height: virtualizer.getTotalSize() + 2 * rowHeight,
        })}
      >
        <Table.Root class="bases-style-overflow-visible-5b5e83 contain-layout">
          <Table.Header class="bases-style-bg-secondary-ba939e sticky bases-style-top-0-216740 bases-style-z-100-db5a36">
            <Table.Row class="bases-style-th-td-last-border-r-0-7a1990">
              {#each headers as id}
                {#if headerMap[id]}
                  <TableHeader header={headerMap[id]} />
                {/if}
              {/each}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#if paddingTop}
              <Table.Row>
                <Table.Cell colspan={colSpan} style="height: {paddingTop}px;}"
                ></Table.Cell>
              </Table.Row>
            {/if}
            {#each virtualizer.getVirtualItems() as virtualRow (virtualRow.key)}
              {@const row = queryResults.data[virtualRow.index]}
              {#if row}
                <Table.Row
                  data-index={virtualRow.index}
                  bind:ref={
                    () => {
                      virtualItemEls[virtualRow.index] ||= null;
                      return virtualItemEls[virtualRow.index];
                    },
                    (value) => {
                      virtualItemEls[virtualRow.index] = value;
                    }
                  }
                  class="bases-style-h-var-bases-table-row-height-c8d78a bases-style-th-td-last-border-r-0-7a1990"
                >
                  {#each headers as id, idx (`${id}_${virtualRow.key}_${idx}`)}
                    <Table.Cell
                      class="bases-style-overflow-hidden-2cd02d bases-style-border-r-5ceb63 bases-style-p-2px-2fa1f0 bases-style-text-nowrap-621d3b bases-style-overflow-ellipsis-5b2ef5"
                      style={`width: var(--col-${CSS.escape(id)}-size); height: var(--ui-bases-table-row-height)`}
                    >
                      <div
                        class="bases-style-focus-within-bg-secondary-14f262 bases-style-h-full-668b21 bases-style-w-full-6da6a3 bases-style-px-2-d5eab2 bases-style-py-1-660d2e bases-style-outline-2-4b7397 bases-style-outline-transparent-61b539 bases-style-focus-within-rounded-sm-668937 bases-style-focus-within-outline-var-interactive-accen-08be01"
                      >
                        <Cell
                          app={view.controller.app}
                          name={id}
                          file={row.file}
                          type={types[id]?.type}
                          value={row.getValue(id as BasesPropertyId)}
                          style={`width: var(--col-${CSS.escape(id)}-size)`}
                          class="bases-style-z-1-0bcb04 bases-style-h-full-668b21 bases-style-w-full-6da6a3 bases-style-min-w-full-a1e7a8 bases-style-overflow-hidden-2cd02d bases-style-text-nowrap-621d3b bases-style-overflow-ellipsis-5b2ef5"
                        />
                      </div>
                    </Table.Cell>
                  {/each}
                </Table.Row>
              {/if}
            {:else}
              <Table.Row class="bases-style-h-var-bases-table-row-height-c8d78a">
                <Table.Cell colspan={colSpan} class="bases-style-h-24-9678c6 bases-style-text-center-ca6bf6">
                  No results.
                </Table.Cell>
              </Table.Row>
            {/each}
            {#if paddingBottom}
              <Table.Row>
                <Table.Cell colspan={colSpan} style="height: {paddingBottom}px;"
                ></Table.Cell>
              </Table.Row>
            {:else}
              <Table.Row>
                <Table.Cell colspan={colSpan} style="height: 100px;"
                ></Table.Cell>
              </Table.Row>
            {/if}
          </Table.Body>
        </Table.Root>
      </div>
    </div>
  </DragDropProvider>
{:else}
  <TablePlaceholder {table} {view} />
{/if}
