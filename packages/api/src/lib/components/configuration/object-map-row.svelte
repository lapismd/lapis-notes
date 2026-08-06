<script lang="ts">
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import { Button } from "@lapis-notes/ui/button";
  import { Input } from "@lapis-notes/ui/input";
  import * as Table from "@lapis-notes/ui/table";
  import { Select } from "../select";
  import type { SchemaType } from "../../configuration.svelte";
  import type { ObjectMapOption } from "./object-map-setting.svelte";
  import OptionsComboboxSetting from "./options-combobox-setting.svelte";
  import {
    buildSelectOptionsForValue,
    isOptionsSourceComboboxField,
  } from "./object-array-utils";

  let {
    pattern,
    entryValue,
    valueSchema,
    selectOptions,
    onValueQueryChange,
    onPatternChange,
    onValueChange,
    onRemove,
  }: {
    pattern: string;
    entryValue: unknown;
    valueSchema: SchemaType;
    selectOptions: ObjectMapOption[];
    onValueQueryChange?: (query: string) => void;
    onPatternChange: (nextPattern: string) => boolean;
    onValueChange: (nextValue: unknown) => void;
    onRemove: () => void;
  } = $props();

  let draftPattern = $state("");

  $effect(() => {
    draftPattern = pattern;
  });

  function commitPattern(): void {
    const trimmed = draftPattern.trim();
    if (!trimmed) {
      draftPattern = pattern;
      return;
    }

    if (trimmed === pattern) {
      draftPattern = trimmed;
      return;
    }

    if (!onPatternChange(trimmed)) {
      draftPattern = pattern;
      return;
    }

    draftPattern = trimmed;
  }

  function handlePatternKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.currentTarget instanceof HTMLInputElement &&
        event.currentTarget.blur();
    }
  }
</script>

<Table.Row>
  <Table.Cell class="align-middle">
    <Input
      type="text"
      class="h-8"
      data-testid="object-map-pattern-input"
      bind:value={draftPattern}
      placeholder="*.md"
      onblur={commitPattern}
      onkeydown={handlePatternKeydown}
    />
  </Table.Cell>
  <Table.Cell class="align-middle">
    {#if isOptionsSourceComboboxField(valueSchema)}
      <OptionsComboboxSetting
        value={String(entryValue ?? "")}
        options={selectOptions}
        placeholder="Enter or select"
        onValueChange={(nextValue) => onValueChange(nextValue)}
        onQueryChange={onValueQueryChange}
      />
    {:else if valueSchema.type === "string" && selectOptions.length > 0}
      <Select
        type="single"
        value={String(entryValue ?? "")}
        items={buildSelectOptionsForValue(
          selectOptions,
          entryValue,
          "allowUnknownOptions" in valueSchema &&
            valueSchema.allowUnknownOptions === true,
        )}
        placeholder="Select editor view"
        onValueChange={(nextValue) => onValueChange(nextValue)}
      />
    {:else if valueSchema.type === "boolean"}
      <Input
        type="checkbox"
        checked={Boolean(entryValue)}
        onchange={(event) => {
          const target = event.currentTarget as HTMLInputElement;
          onValueChange(target.checked);
        }}
      />
    {:else if valueSchema.type === "number" || valueSchema.type === "integer"}
      <Input
        type="number"
        class="h-8 border-none"
        value={String(entryValue ?? 0)}
        oninput={(event) => {
          const target = event.currentTarget as HTMLInputElement;
          const parsed = Number(target.value);
          onValueChange(Number.isFinite(parsed) ? parsed : 0);
        }}
      />
    {:else}
      <Input
        type="text"
        class="h-8 border-none"
        value={String(entryValue ?? "")}
        oninput={(event) => {
          const target = event.currentTarget as HTMLInputElement;
          onValueChange(target.value);
        }}
      />
    {/if}
  </Table.Cell>
  <Table.Cell class="text-right align-middle">
    <Button
      variant="ghost"
      size="icon"
      class="h-8 w-8 shrink-0"
      data-testid="object-map-remove-button"
      aria-label="Remove association"
      onclick={onRemove}
    >
      <Trash2 class="size-4" />
    </Button>
  </Table.Cell>
</Table.Row>
