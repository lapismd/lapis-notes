<script lang="ts">
  import { createDraggable, createDroppable } from "@dnd-kit/svelte";
  import GripVertical from "@lucide/svelte/icons/grip-vertical";
  import { cn } from "@lapis-notes/ui";
  import * as Table from "@lapismd/design-core/shadcn/table";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import {
    dropIndicatorClasses,
    isRowDragSource,
    SETTINGS_TABLE_ROW_TYPE,
    type SettingsTableDragSource,
  } from "./object-array-table-dnd";

  let {
    rowIndex,
    dragSource,
    dragOverIndex,
  }: {
    rowIndex: number;
    dragSource: SettingsTableDragSource | null;
    dragOverIndex: number | null;
  } = $props();

  let cellRef = $state<HTMLElement | null>(null);

  const rowDraggable = createDraggable({
    get id() {
      return `settings-table-row:${rowIndex}`;
    },
    type: SETTINGS_TABLE_ROW_TYPE,
    get data() {
      return { type: SETTINGS_TABLE_ROW_TYPE, index: rowIndex };
    },
  });

  const rowDroppable = createDroppable({
    get id() {
      return `settings-table-row-drop:${rowIndex}:grip`;
    },
    accept: SETTINGS_TABLE_ROW_TYPE,
    get data() {
      return { type: SETTINGS_TABLE_ROW_TYPE, index: rowIndex };
    },
  });

  $effect(() => {
    if (!cellRef) {
      return;
    }
    const cleanupDraggable = rowDraggable.attach(cellRef);
    const cleanupDroppable = rowDroppable.attach(cellRef);
    return () => {
      cleanupDraggable();
      cleanupDroppable();
    };
  });
</script>

<Table.Cell
  bind:ref={cellRef}
  class={cn(
    "object-array-table__grip w-10 align-middle",
    dropIndicatorClasses(dragSource, dragOverIndex, rowIndex),
    isRowDragSource(dragSource, rowIndex) && "is-drag-source is-row-drag-source",
  )}
>
  <Button
    variant="ghost"
    size="icon"
    class="h-8 w-8 shrink-0 cursor-grab"
    data-grab-handle=""
    data-testid="object-array-row-grip"
    aria-label="Drag row"
    {@attach rowDraggable.attachHandle}
  >
    <GripVertical class="size-4 opacity-60" />
  </Button>
</Table.Cell>
