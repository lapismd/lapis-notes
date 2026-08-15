<script lang="ts">
  import { DragDropProvider } from "@dnd-kit/svelte";
  import type { DragEndEvent } from "@dnd-kit/dom";
  import { arrayMove } from "@dnd-kit/helpers";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import * as Command from "@lapismd/design-core/shadcn/command";
  import * as Select from "@lapismd/design-core/shadcn/select";
  import SortIcon from "@lucide/svelte/icons/arrow-up-down";
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";
  import type { Table } from "@tanstack/table-core";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import type { SortColumn } from "../..";
  import SortRow from "./sort-row.svelte";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import { cn } from "@lapis-notes/api";
  import type { QueryController } from "../../bases.svelte";
  import CheckIcon from "@lucide/svelte/icons/check";
  import Trash from "@lucide/svelte/icons/trash-2";
  import { Icon } from "@lapis-notes/api/icon";
  import { getSortDirectionLabels } from "./sort-direction-labels";

  let {
    class: className,
    orderBy = $bindable(),
    table,
    controller = table as QueryController,
  }: {
    orderBy: Array<SortColumn>;
    class?: string;
    controller?: QueryController;
    table?: any;
  } = $props();

  let empty: SortColumn = $state({ property: "", direction: "ASC" });
  let groupBy = $derived(controller.selectedView.groupBy);
  let selectedGroupColumn = $derived.by(() => {
    return groupBy?.property
      ? controller.getColumn(groupBy.property)
      : undefined;
  });
  let groupDirections = $derived.by(() => {
    return getSortDirectionLabels(selectedGroupColumn?.type);
  });
  let groupDirectionLabel = $derived(
    groupDirections.find((direction) => direction.value === getGroupDirection())
      ?.label ?? "",
  );

  $effect(() => {
    if (empty.property && !orderBy.length) {
      orderBy.push($state.snapshot(empty));
      empty = { property: "", direction: "ASC" };
    }
  });

  function handleDragEnd(event: DragEndEvent) {
    const source = event.operation.source?.data;
    const target = event.operation.target?.data;

    if (
      source?.type !== "bases-sort-row" ||
      target?.type !== "bases-sort-row" ||
      source.index === undefined ||
      target.index === undefined ||
      source.index === target.index
    ) {
      return;
    }

    orderBy = arrayMove(orderBy, source.index, target.index);
  }

  function deleteSort(index: number) {
    orderBy.splice(index, 1);
  }

  function addSort() {
    orderBy.push({ property: "", direction: "ASC" });
  }

  function setGroupBy(property: string) {
    controller.selectedView.groupBy = {
      property,
      direction: controller.selectedView.groupBy?.direction ?? "ASC",
    };
  }

  function getGroupDirection() {
    return controller.selectedView.groupBy?.direction ?? "ASC";
  }

  function setGroupDirection(direction: string) {
    if (!controller.selectedView.groupBy) return;
    controller.selectedView.groupBy = {
      ...controller.selectedView.groupBy,
      direction: direction === "DESC" ? "DESC" : "ASC",
    };
  }
</script>

<Popover.Root>
  <Popover.Trigger>
    {#snippet child({ props }: { props: Record<string, any> })}
      <Button
        {...props}
        variant="outline"
        size="sm"
        class={cn("bases-style-h-8-ed8a5d bases-style-border-dashed-a29b7a", className)}
      >
        <SortIcon /> Sort
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content
    class="bases-query-popover bases-sort-popover bases-style-bg-sidebar-d3aed6 bases-style-mr-2-d2347e bases-style-max-h-70svh-d6926c bases-style-overflow-y-auto-92bf82 bases-style-p-2-7660b4"
    data-bases-popover="sort"
    align="start"
  >
    <div class="bases-style-mb-2-a77ed4 bases-style-grid-f3c543 bases-style-gap-2-77a2a2">
      <div
        class="bases-style-text-muted-foreground-bfa603 bases-style-px-1-d8e0e3 bases-style-text-xs-359090 bases-style-font-semibold-e83a70 bases-style-tracking-0-18em-a82f6f uppercase"
      >
        Group by
      </div>
      <div class="bases-style-flex-60fbb7 bases-style-h-9-e7a768 bases-style-items-center-3960ff bases-style-rounded-md-421ac2 bases-style-border-2-65935d">
        <Popover.Root>
          <Popover.Trigger>
            {#snippet child({ props }: { props: Record<string, any> })}
              <Button
                {...props}
                variant="outline"
                size="sm"
                class="bases-style-h-8-ed8a5d grow bases-style-rounded-none-0c5e91 bases-style-rounded-l-md-9b2e91 bases-style-border-none-4a5f0e bases-style-shadow-none-ad47d1 bases-style-outline-none-df37b1"
              >
                {#if selectedGroupColumn}
                  <Icon name={[selectedGroupColumn.icon ?? "lucide-file"]} />
                  {selectedGroupColumn.displayName}
                {:else}
                  <span class="bases-style-opacity-50-0b8c50">Property</span>
                {/if}
                <SortIcon />
              </Button>
            {/snippet}
          </Popover.Trigger>
          <Popover.Content class="bases-style-w-max-2f935d bases-style-p-0-8a539c" align="start">
            <Command.Root>
              <Command.Input placeholder="Group by property" />
              <Command.List class="bases-style-p-1-eb6a3c">
                <Command.Empty>No results found.</Command.Empty>
                {#each controller.getAllColumns() as column (column.id)}
                  <Command.Item onSelect={() => setGroupBy(column.id)}>
                    <div
                      data-ui-part="bases-option-indicator"
                      data-selected={groupBy?.property === column.id}
                      class={cn(
                        "bases-style-mr-2-d2347e bases-style-flex-60fbb7 bases-style-size-4-f7b5fa bases-style-items-center-3960ff bases-style-justify-center-86843c bases-style-rounded-sm-36d446 border bases-style-border-var-interactive-accent-f46c93",
                        groupBy?.property === column.id
                          ? "bases-style-ring-ring-3e1868 bases-style-border-none-4a5f0e bases-style-bg-var-interactive-accent-c58cc0 bases-style-text-var-text-on-accent-22b2b1 hover:ring"
                          : "bases-style-opacity-50-0b8c50 [&_svg]:invisible",
                      )}
                    >
                      <CheckIcon class="bases-style-size-4-f7b5fa" />
                    </div>
                    <Icon name={[column.icon ?? "lucide-info"]} />
                    <span class="bases-style-overflow-hidden-2cd02d bases-style-text-ellipsis-6e2e11"
                      >{column.displayName}</span
                    >
                    {#if !column.id.startsWith("note.")}
                      <Command.Shortcut class="bases-style-font-mono-0e6570 bases-style-text-0-75em-c425cc"
                        >{column.id}</Command.Shortcut
                      >
                    {/if}
                  </Command.Item>
                {/each}
              </Command.List>
            </Command.Root>
          </Popover.Content>
        </Popover.Root>
        <Select.Root
          type="single"
          bind:value={getGroupDirection, setGroupDirection}
        >
          <Select.Trigger
            size="sm"
            class="bases-style-bg-background-e6f9e3 bases-style-h-8-ed8a5d bases-style-rounded-none-0c5e91 bases-style-border-none-4a5f0e bases-style-shadow-none-ad47d1 bases-style-outline-none-df37b1"
          >
            {groupDirectionLabel}
            <SortIcon />
          </Select.Trigger>
          <Select.Content>
            {#each groupDirections as direction (direction.value)}
              <Select.Item value={direction.value} label={direction.label}
                >{direction.label}</Select.Item
              >
            {/each}
          </Select.Content>
        </Select.Root>
        <Button
          variant="ghost"
          size="sm"
          class="bases-style-bg-background-e6f9e3 bases-style-h-8-ed8a5d bases-style-rounded-none-0c5e91 bases-style-rounded-r-md-d4eb07 bases-style-border-none-4a5f0e bases-style-shadow-none-ad47d1 bases-style-outline-none-df37b1"
          disabled={!selectedGroupColumn}
          onclick={() => (controller.selectedView.groupBy = undefined)}
        >
          <Trash />
        </Button>
      </div>
    </div>
    <div class="bases-style-mb-2-a77ed4 bases-style-border-t-b950dd"></div>
    <div
      class="bases-style-text-muted-foreground-bfa603 bases-style-mb-2-a77ed4 bases-style-px-1-d8e0e3 bases-style-text-xs-359090 bases-style-font-semibold-e83a70 bases-style-tracking-0-18em-a82f6f uppercase"
    >
      Sort by
    </div>
    <DragDropProvider onDragEnd={handleDragEnd}>
      <ScrollArea
        orientation="both"
        class="bases-style-h-full-668b21 bases-style-w-full-6da6a3 bases-style-data-scroll-area-viewport-max-h-55svh-15dd46"
      >
        {#if !orderBy.length}
          <SortRow {controller} bind:sort={empty} deleteSort={() => {}} />
        {/if}
        {#each orderBy as order, i}
          <SortRow
            {controller}
            index={i}
            bind:sort={orderBy[i]}
            deleteSort={() => deleteSort(i)}
          />
        {/each}
      </ScrollArea>
    </DragDropProvider>
    <div class="filter-group-actions bases-style-mt-2-50d0d2">
      <Button size="sm" variant="ghost" onclick={addSort}>
        <PlusIcon /> Add sort
      </Button>
    </div>
  </Popover.Content>
</Popover.Root>
