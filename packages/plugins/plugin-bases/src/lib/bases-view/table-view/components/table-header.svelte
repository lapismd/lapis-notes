<script lang="ts">
  import type { Header } from "@tanstack/table-core";
  import { createSortable } from "@dnd-kit/svelte/sortable";
  import GripVertical from "@lucide/svelte/icons/grip-vertical";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { styleObjectToString } from "./dnd-style";
  import { cn } from "@lapis-notes/api";
  import { Icon } from "@lapis-notes/api/icon";
  import ArrowUpDownIcon from "@lucide/svelte/icons/arrow-up-down";
  import ArrowDown from "@lucide/svelte/icons/chevron-down";
  import ArrowUp from "@lucide/svelte/icons/chevron-up";

  let {
    header,
    icon = "lucide-info",
    text,
    width = header.getSize(),
  }: {
    header: Header<any, unknown>;
    icon?: string;
    text?: string;
    width?: number;
  } = $props();
  let label = $derived(
    text ?? header.column.columnDef.meta?.displayName?.toString() ?? header.id,
  );
  let direction = $derived(header.column.getIsSorted());
  let isActive = $state(false);

  const sortable = createSortable({
    get id() {
      return header.column.id;
    },
    get index() {
      return header.index;
    },
    type: "bases-table-column",
    accept: "bases-table-column",
    get data() {
      return {
        type: "bases-table-column",
        id: header.column.id,
        index: header.index,
      };
    },
  });

  let style = $derived(
    styleObjectToString({
      opacity: sortable.isDragging ? 0.8 : 1,
      position: "relative",
      transition: "transform 0.2s ease-in-out",
      "--ui-bases-table-cell-radius-active": 0,
      "--ui-bases-table-cell-shadow-active":
        "calc(var(--ui-bases-table-column-border-width) * -1) 0 0 var(--table-border-color)",
      whiteSpace: "nowrap",
      flex: `0 0 ${width}px`,
      width: `${width}px`,
      "z-index": sortable.isDragging ? 1 : 0,
    }),
  );
</script>

<div
  {@attach sortable.attach}
  {style}
  data-column-id={header.id}
  class={cn(
    "bases-td group/header bases-style-z-1000-9e4878 bases-style-justify-between-8ef226 bases-style-overflow-hidden-2cd02d bases-style-px-0-5a270a bases-style-text-nowrap-621d3b bases-style-overflow-ellipsis-5b2ef5 bases-style-transition-colors-ceb69a",
    isActive ? "bases-style-bg-accent-interactive-30-0c9f68" : "bases-style-hover-bg-border-2e3f11",
  )}
  onfocusin={() => {
    isActive = true;
  }}
  onfocusout={(event) => {
    const currentTarget = event.currentTarget;
    const relatedTarget = event.relatedTarget;

    if (
      currentTarget instanceof HTMLElement &&
      relatedTarget instanceof Node &&
      currentTarget.contains(relatedTarget)
    ) {
      return;
    }

    isActive = false;
  }}
>
  <div class="relative bases-style-flex-60fbb7 bases-style-h-full-668b21 bases-style-w-full-6da6a3 bases-style-items-center-3960ff bases-style-justify-between-8ef226 bases-style-gap-1-44ee8b">
    <div class="bases-style-w-full-6da6a3 bases-style-pr-10-b70031">
      {#if !header.isPlaceholder}
        <Button
          class="bases-style-flex-60fbb7 bases-style-h-full-668b21 bases-style-w-full-6da6a3 bases-style-justify-between-8ef226 bases-style-rounded-none-0c5e91 bases-style-p-2-7660b4 bases-style-pr-0-5431db bases-style-hover-bg-transparent-de520d bases-style-focus-visible-border-transparent-917fe2 bases-style-focus-visible-bg-transparent-23dcc5 bases-style-focus-visible-shadow-none-1697ce bases-style-focus-visible-ring-0-464a99 bases-style-focus-visible-ring-transparent-4358b1 bases-style-focus-visible-ring-offset-0-63ff32"
          variant="ghost"
          onclick={header.column.getToggleSortingHandler()}
        >
          <span class="bases-style-flex-60fbb7 bases-style-items-center-3960ff" data-tooltip={label}>
            <Icon name={[icon, "lucide-info"]} class="bases-style-mr-1-618162" />
            <span class="shrink bases-style-overflow-x-hidden-e271e6 bases-style-text-ellipsis-6e2e11">{label}</span>
          </span>
        </Button>
      {/if}
    </div>
    <div class="absolute bases-style-top-0-216740 bases-style-right-0-d8cdca bases-style-flex-60fbb7 bases-style-h-full-668b21 bases-style-items-center-3960ff bases-style-bg-transparent-7f19cd">
      <Button
        variant="ghost"
        data-grab-handle=""
        aria-label={`Sort ${label}`}
        class="bases-style-px-0-5a270a bases-style-hover-bg-transparent-de520d bases-style-focus-visible-border-transparent-917fe2 bases-style-focus-visible-bg-transparent-23dcc5 bases-style-focus-visible-shadow-none-1697ce bases-style-focus-visible-ring-0-464a99 bases-style-focus-visible-ring-transparent-4358b1 bases-style-focus-visible-ring-offset-0-63ff32"
        size="xs"
        onclick={header.column.getToggleSortingHandler()}
      >
        {#if direction === "asc"}
          <ArrowUp class="" />
        {:else if direction === "desc"}
          <ArrowDown class="" />
        {:else}
          <ArrowUpDownIcon class="" />
        {/if}
      </Button>
      <Button
        {@attach sortable.attachHandle}
        variant="ghost"
        data-grab-handle=""
        aria-label={`Reorder ${label} column`}
        class="bases-style-px-0-5a270a bases-style-hover-bg-transparent-de520d bases-style-focus-visible-border-transparent-917fe2 bases-style-focus-visible-bg-transparent-23dcc5 bases-style-focus-visible-shadow-none-1697ce bases-style-focus-visible-ring-0-464a99 bases-style-focus-visible-ring-transparent-4358b1 bases-style-focus-visible-ring-offset-0-63ff32"
        size="xs"
      >
        <GripVertical />
      </Button>
      <div
        role="button"
        aria-label={`Resize ${label} column`}
        tabindex="-1"
        ondblclick={() => header.column.resetSize()}
        onmousedown={header.getResizeHandler()}
        ontouchstart={header.getResizeHandler()}
        class={cn(
          "bases-style-bg-accent-interactive-8255bb absolute bases-style-top-0-216740 bases-style-right-0-d8cdca bases-style-h-full-668b21 bases-style-w-1-0b0057 bases-style-cursor-col-resize-1ee417 touch-none bases-style-opacity-0-706549 bases-style-select-none-7f6912 bases-style-hover-opacity-100-5da1d5",
          header.column.getIsResizing() && "bases-style-opacity-100-3972e9",
        )}
      ></div>
    </div>
  </div>
</div>
