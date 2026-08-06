<script lang="ts">
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import { cn } from "@lapis-notes/ui";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Input } from "@lapismd/design-core/shadcn/input";
  import { Switch } from "@lapismd/design-core/shadcn/switch";
  import * as Table from "@lapismd/design-core/shadcn/table";
  import { Select } from "../select";
  import type { SchemaType } from "../../configuration.svelte";
  import type { ObjectMapOption } from "./object-map-setting.svelte";
  import OptionsComboboxSetting from "./options-combobox-setting.svelte";
  import {
    buildSelectOptionsForValue,
    isOptionsSourceComboboxField,
  } from "./object-array-utils";
  import ObjectArrayRowGrip from "./object-array-row-grip.svelte";
  import {
    isRowDragSource,
    type SettingsTableDragSource,
  } from "./object-array-table-dnd";

  let {
    row,
    index,
    columns,
    columnOptions = {},
    columnOnQueryChange = {},
    dragSource = null,
    dragOverIndex = null,
    showGrip = false,
    removeDisabled = false,
    onFieldChange,
    onRemove,
  }: {
    row: Record<string, unknown>;
    index: number;
    columns: Array<[string, SchemaType]>;
    columnOptions?: Record<string, ObjectMapOption[]>;
    columnOnQueryChange?: Record<string, (query: string) => void>;
    dragSource?: SettingsTableDragSource | null;
    dragOverIndex?: number | null;
    showGrip?: boolean;
    removeDisabled?: boolean;
    onFieldChange: (key: string, value: unknown) => void;
    onRemove: () => void;
  } = $props();

  let draftValues = $state<Record<string, string>>({});

  $effect(() => {
    const next: Record<string, string> = {};
    for (const [key] of columns) {
      next[key] = String(row[key] ?? "");
    }
    draftValues = next;
  });

  function commitStringField(key: string): void {
    const trimmed = draftValues[key]?.trim() ?? "";
    if (trimmed !== String(row[key] ?? "")) {
      onFieldChange(key, trimmed);
    }
    draftValues = { ...draftValues, [key]: trimmed };
  }

  function handleStringKeydown(event: KeyboardEvent, key: string): void {
    if (event.key === "Enter") {
      event.currentTarget instanceof HTMLInputElement &&
        event.currentTarget.blur();
    }
  }

  function inputTypeForString(field: SchemaType): HTMLInputElement["type"] {
    if (field.type !== "string" || !("format" in field) || !field.format) {
      return "text";
    }
    if (field.format === "email") {
      return "email";
    }
    if (field.format === "uri") {
      return "url";
    }
    return "text";
  }
</script>

<Table.Row
  class={cn(
    "object-array-table__row group",
    isRowDragSource(dragSource, index) && "is-row-drag-source",
  )}
>
  {#if showGrip}
    <ObjectArrayRowGrip
      rowIndex={index}
      {dragSource}
      dragOverIndex={dragOverIndex ?? null}
    />
  {/if}
  {#each columns as [key, field] (key)}
    <Table.Cell class="align-middle">
      {#if field.type === "boolean"}
        <Switch
          checked={Boolean(row[key])}
          onCheckedChange={(checked) => onFieldChange(key, checked)}
        />
      {:else if field.type === "number" || field.type === "integer"}
        <Input
          type="number"
          class="h-8 border-none"
          value={String(row[key] ?? 0)}
          oninput={(event) => {
            const target = event.currentTarget as HTMLInputElement;
            const parsed = Number(target.value);
            onFieldChange(key, Number.isFinite(parsed) ? parsed : 0);
          }}
        />
      {:else if isOptionsSourceComboboxField(field)}
        <OptionsComboboxSetting
          value={String(row[key] ?? "")}
          options={columnOptions[key] ?? []}
          placeholder="Enter or select"
          onValueChange={(nextValue) => onFieldChange(key, nextValue)}
          onQueryChange={columnOnQueryChange[key]}
        />
      {:else if field.type === "string" && (columnOptions[key]?.length ?? 0) > 0}
        <Select
          type="single"
          value={String(row[key] ?? "")}
          items={buildSelectOptionsForValue(
            columnOptions[key] ?? [],
            row[key],
            "allowUnknownOptions" in field && field.allowUnknownOptions === true,
          )}
          placeholder="Select"
          onValueChange={(nextValue) => onFieldChange(key, nextValue)}
        />
      {:else if field.type === "string"}
        <Input
          type={inputTypeForString(field)}
          class="h-8 border-none"
          data-testid={`object-array-cell-${key}`}
          bind:value={draftValues[key]}
          onblur={() => commitStringField(key)}
          onkeydown={(event) => handleStringKeydown(event, key)}
        />
      {/if}
    </Table.Cell>
  {/each}
  <Table.Cell class="text-right align-middle">
    <Button
      variant="ghost"
      size="icon"
      class="h-8 w-8 shrink-0"
      data-testid="object-array-remove-button"
      aria-label="Remove row"
      disabled={removeDisabled}
      onclick={onRemove}
    >
      <Trash2 class="size-4" />
    </Button>
  </Table.Cell>
</Table.Row>
