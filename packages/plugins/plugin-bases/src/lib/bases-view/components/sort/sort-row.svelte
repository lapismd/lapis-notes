<script lang="ts">
  import { createDraggable, createDroppable } from "@dnd-kit/svelte";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import * as Command from "@lapismd/design-core/shadcn/command";
  import { Icon } from "@lapis-notes/api/icon";
  import CheckIcon from "@lucide/svelte/icons/check";
  import Trash from "@lucide/svelte/icons/trash-2";
  import ArrowUpDown from "@lucide/svelte/icons/chevrons-up-down";
  import * as Select from "@lapismd/design-core/shadcn/select";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import type { SortColumn } from "../..";
  import { cn } from "@lapis-notes/api";
  import type { HTMLAttributes } from "svelte/elements";
  import GripVertical from "@lucide/svelte/icons/grip-vertical";
  import type { QueryController } from "../../bases.svelte";
  import { getSortDirectionLabels } from "./sort-direction-labels";

  type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & {
    ref?: U | null;
  };

  let {
    sort = $bindable(),
    index,
    controller,
    deleteSort,
    children,
    class: className,
    ...rest
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    sort: SortColumn;
    index?: number;
    controller: QueryController;
    deleteSort?: () => void;
  } = $props();

  let column = $derived(
    sort.property ? controller.getColumn(sort.property) : undefined,
  );
  let filterTypes = $derived.by(() => {
    return getSortDirectionLabels(column?.type);
  });

  const filterLabel = $derived(
    filterTypes.find((f) => f.value === sort.direction)?.label ?? "",
  );

  $effect(() => {
    if (!sort.direction) {
      sort.direction = filterTypes[0].value;
    }
  });

  const draggable = createDraggable({
    get id() {
      return `bases-sort-row:${index ?? "empty"}`;
    },
    type: "bases-sort-row",
    get disabled() {
      return index === undefined;
    },
    get data() {
      return {
        type: "bases-sort-row",
        index,
      };
    },
  });

  const droppable = createDroppable({
    get id() {
      return `bases-sort-row-drop:${index ?? "empty"}`;
    },
    accept: "bases-sort-row",
    get disabled() {
      return index === undefined;
    },
    get data() {
      return {
        type: "bases-sort-row",
        index,
      };
    },
  });
</script>

<div
  {@attach draggable.attach}
  {@attach droppable.attach}
  class={cn(className, {
    "bases-style-ring-ring-3e1868 bases-style-rounded-md-421ac2 bases-style-ring-1-3daca9": droppable.isDropTarget,
    "bases-style-opacity-75-f85473": draggable.isDragging,
  })}
>
  <div class="filter-row bases-style-mb-1-652817 bases-style-flex-60fbb7 bases-style-items-center-3960ff bases-style-gap-0-63a285" {...rest}>
    <Button
      {@attach draggable.attachHandle}
      size="sm"
      class="drag-handle bases-style-mr-0-5-1caf26"
      variant="ghost"
    >
      <GripVertical />
    </Button>
    <div class="bases-style-flex-60fbb7 bases-style-h-9-e7a768 grow bases-style-items-center-3960ff bases-style-rounded-md-421ac2 bases-style-border-2-65935d">
      <Popover.Root>
        <Popover.Trigger class="">
          {#snippet child({ props }: { props: Record<string, any> })}
            <Button
              {...props}
              variant="outline"
              size="sm"
              class="bases-style-h-8-ed8a5d grow bases-style-rounded-none-0c5e91 bases-style-rounded-l-md-9b2e91 bases-style-border-none-4a5f0e bases-style-shadow-none-ad47d1 bases-style-outline-none-df37b1"
            >
              {#if column}
                <Icon name={[column?.icon ?? "lucide-file"]} />
                {column.displayName}
              {:else}
                <span class="bases-style-opacity-50-0b8c50">Property</span>
              {/if}
              <ArrowUpDown />
            </Button>
          {/snippet}
        </Popover.Trigger>
        <Popover.Content class="bases-style-w-max-2f935d bases-style-p-0-8a539c" align="start">
          <Command.Root>
            <Command.Input placeholder="Find or create" />
            <Command.List class="bases-style-p-1-eb6a3c">
              <Command.Empty>No results found.</Command.Empty>
              {#each controller.getAllColumns() as column (column.id)}
                <Command.Item
                  onSelect={() => {
                    sort.property = column.id;
                  }}
                >
                  <div
                    data-ui-part="bases-option-indicator"
                    data-selected={sort.property === column.id}
                    class={cn(
                      "bases-style-mr-2-d2347e bases-style-flex-60fbb7 bases-style-size-4-f7b5fa bases-style-items-center-3960ff bases-style-justify-center-86843c bases-style-rounded-sm-36d446 border bases-style-border-var-interactive-accent-f46c93",
                      sort.property === column.id
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
      <Select.Root type="single" bind:value={sort.direction}>
        <Select.Trigger
          size="sm"
          class="bases-style-bg-background-e6f9e3 bases-style-h-8-ed8a5d bases-style-rounded-none-0c5e91 bases-style-border-none-4a5f0e bases-style-shadow-none-ad47d1 bases-style-outline-none-df37b1"
        >
          {filterLabel}
          <ArrowUpDown />
        </Select.Trigger>
        <Select.Content>
          {#each filterTypes as filterType (filterType.value)}
            <Select.Item value={filterType.value} label={filterType.label}
              >{filterType.label}</Select.Item
            >
          {/each}
        </Select.Content>
      </Select.Root>
      {#if deleteSort}
        <Button
          variant="ghost"
          size="sm"
          class="bases-style-bg-background-e6f9e3 bases-style-h-8-ed8a5d bases-style-rounded-none-0c5e91 bases-style-rounded-r-md-d4eb07 bases-style-border-none-4a5f0e bases-style-shadow-none-ad47d1 bases-style-outline-none-df37b1"
          onclick={() => deleteSort()}
        >
          <Trash />
        </Button>
      {/if}
    </div>
  </div>
</div>
