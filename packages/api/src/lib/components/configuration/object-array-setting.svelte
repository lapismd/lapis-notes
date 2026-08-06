<script lang="ts">
  import { DragDropProvider } from "@dnd-kit/svelte";
  import type {
    DragEndEvent,
    DragOverEvent,
    DragStartEvent,
  } from "@dnd-kit/dom";
  import { cn } from "@lapis-notes/ui";
  import { Button } from "@lapis-notes/ui/button";
  import * as Table from "@lapis-notes/ui/table";
  import { tableReorderSensors } from "@lapis-notes/ui/table-dnd/sensors";
  import type { ArrayType, ObjectType } from "../../configuration.svelte";
  import type { ObjectMapOption } from "./object-map-setting.svelte";
  import ObjectArrayRow from "./object-array-row.svelte";
  import {
    parseTableDragData,
    resolveTableDragTargetIndex,
    SETTINGS_TABLE_COL_TYPE,
    SETTINGS_TABLE_ROW_TYPE,
    type SettingsTableDragSource,
  } from "./object-array-table-dnd";
  import {
    columnLabel,
    createDefaultRow,
    moveArrayItem,
    sortedObjectProperties,
  } from "./object-array-utils";

  let {
    schema,
    value = $bindable<Record<string, unknown>[]>([]),
    columnOptions = {},
    columnOnQueryChange = {},
    onValueChange,
  }: {
    schema: ArrayType & { items: ObjectType };
    value?: Record<string, unknown>[];
    columnOptions?: Record<string, ObjectMapOption[]>;
    columnOnQueryChange?: Record<string, (query: string) => void>;
    onValueChange?: (value: Record<string, unknown>[]) => void;
  } = $props();

  const objectSchema = $derived(schema.items);
  const columns = $derived(sortedObjectProperties(objectSchema));
  const minItems = $derived(schema.minItems ?? 0);
  const maxItems = $derived(schema.maxItems);
  const canAddRow = $derived(
    maxItems === undefined ? true : value.length < maxItems,
  );
  const canRemoveRow = $derived(value.length > minItems);
  const canReorderRows = $derived(value.length > 1);

  let rowKeys = $state<string[]>([]);
  let dragSource = $state<SettingsTableDragSource | null>(null);
  let dragOverIndex = $state<number | null>(null);

  $effect(() => {
    while (rowKeys.length < value.length) {
      rowKeys.push(crypto.randomUUID());
    }
    while (rowKeys.length > value.length) {
      rowKeys.pop();
    }
  });

  function emit(next: Record<string, unknown>[]): void {
    value = next;
    onValueChange?.(next);
  }

  function updateField(index: number, key: string, fieldValue: unknown): void {
    const next = value.map((row, rowIndex) =>
      rowIndex === index ? { ...row, [key]: fieldValue } : row,
    );
    emit(next);
  }

  function addRow(): void {
    if (!canAddRow) {
      return;
    }
    emit([...value, createDefaultRow(objectSchema, columnOptions)]);
  }

  function removeRow(index: number): void {
    if (!canRemoveRow) {
      return;
    }
    rowKeys.splice(index, 1);
    emit(value.filter((_, rowIndex) => rowIndex !== index));
  }

  function moveRow(from: number, to: number): void {
    emit(moveArrayItem(value, from, to));
    rowKeys = moveArrayItem(rowKeys, from, to);
  }

  function handleDragOver(event: DragOverEvent): void {
    const target = event.operation.target?.data as
      | { type: string; index: number }
      | undefined;
    if (
      target &&
      dragSource &&
      target.type === dragSource.type &&
      target.index !== dragSource.index
    ) {
      dragOverIndex = target.index;
    }
  }

  function handleDragStart(event: DragStartEvent): void {
    const data = parseTableDragData(
      event.operation.source,
      SETTINGS_TABLE_ROW_TYPE,
      SETTINGS_TABLE_COL_TYPE,
    );
    if (data?.type === SETTINGS_TABLE_ROW_TYPE) {
      dragSource = { type: data.type, index: data.index };
    }
  }

  function handleDragEnd(event: DragEndEvent): void {
    const source = parseTableDragData(
      event.operation.source,
      SETTINGS_TABLE_ROW_TYPE,
      SETTINGS_TABLE_COL_TYPE,
    );
    const targetIndex = resolveTableDragTargetIndex(
      event,
      dragOverIndex,
      SETTINGS_TABLE_ROW_TYPE,
      SETTINGS_TABLE_COL_TYPE,
    );

    if (source?.type === SETTINGS_TABLE_ROW_TYPE && targetIndex !== null) {
      moveRow(source.index, targetIndex);
    }

    dragSource = null;
    dragOverIndex = null;
  }
</script>

<DragDropProvider
  sensors={tableReorderSensors}
  onDragStart={handleDragStart}
  onDragOver={handleDragOver}
  onDragEnd={handleDragEnd}
>
  <div
    class={cn(
      "object-array-table w-full space-y-2",
      dragSource && "is-table-chrome-dragging",
    )}
    data-testid="object-array-setting"
  >
    <Table.Root class="w-full text-sm">
      <Table.Header>
        <Table.Row>
          {#if canReorderRows}
            <Table.Head class="w-10"></Table.Head>
          {/if}
          {#each columns as [key, field] (key)}
            <Table.Head>{columnLabel(key, field)}</Table.Head>
          {/each}
          <Table.Head class="w-16 text-right">Actions</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each value as row, index (rowKeys[index])}
          <ObjectArrayRow
            {row}
            {index}
            {columns}
            {columnOptions}
            {columnOnQueryChange}
            {dragSource}
            {dragOverIndex}
            showGrip={canReorderRows}
            removeDisabled={!canRemoveRow}
            onFieldChange={(key, fieldValue) => updateField(index, key, fieldValue)}
            onRemove={() => removeRow(index)}
          />
        {/each}
      </Table.Body>
    </Table.Root>
    <Button
      variant="outline"
      size="sm"
      data-testid="object-array-add-button"
      disabled={!canAddRow}
      onclick={addRow}>Add row</Button
    >
  </div>
</DragDropProvider>
