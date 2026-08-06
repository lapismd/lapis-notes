<script lang="ts">
  import { Button } from "@lapis-notes/ui/button";
  import { Input } from "@lapis-notes/ui/input";
  import { Switch } from "@lapis-notes/ui/switch";
  import { Select } from "../select";
  import type { ObjectMapOption } from "./object-map-setting.svelte";
  import { buildSelectOptionsForValue } from "./object-array-utils";

  type ItemType = "string" | "number" | "integer" | "boolean";

  let {
    itemType,
    value = $bindable<unknown[]>([]),
    valueOptions = [],
    allowUnknownOptions = false,
    onValueChange,
  }: {
    itemType: ItemType;
    value?: unknown[];
    valueOptions?: ObjectMapOption[];
    allowUnknownOptions?: boolean;
    onValueChange?: (value: unknown[]) => void;
  } = $props();

  function emit(next: unknown[]): void {
    value = next;
    onValueChange?.(next);
  }

  function addItem(): void {
    const next = [...value];
    if (itemType === "boolean") {
      next.push(false);
    } else if (itemType === "number" || itemType === "integer") {
      next.push(0);
    } else if (valueOptions.length > 0) {
      next.push(valueOptions[0]?.value ?? "");
    } else {
      next.push("");
    }
    emit(next);
  }

  function removeItem(index: number): void {
    emit(value.filter((_, i) => i !== index));
  }

  function updateItem(index: number, nextValue: unknown): void {
    const next = [...value];
    next[index] = nextValue;
    emit(next);
  }
</script>

<div class="flex flex-col gap-2 w-full">
  {#each value as item, index (index)}
    <div class="flex items-center gap-2">
      {#if itemType === "boolean"}
        <Switch
          checked={Boolean(item)}
          onCheckedChange={(checked) => updateItem(index, checked)}
        />
      {:else if itemType === "number" || itemType === "integer"}
        <Input
          type="number"
          class="flex-1 border-none h-8"
          value={String(item ?? 0)}
          oninput={(event) => {
            const target = event.currentTarget as HTMLInputElement;
            const parsed = Number(target.value);
            updateItem(index, Number.isFinite(parsed) ? parsed : 0);
          }}
        />
      {:else if valueOptions.length > 0 && !allowUnknownOptions}
        <Select
          type="single"
          value={String(item ?? "")}
          items={buildSelectOptionsForValue(valueOptions, item, allowUnknownOptions)}
          placeholder="Select"
          onValueChange={(nextValue) => updateItem(index, nextValue)}
        />
      {:else if valueOptions.length > 0}
        <Select
          type="single"
          value={String(item ?? "")}
          items={buildSelectOptionsForValue(valueOptions, item, allowUnknownOptions)}
          placeholder="Select"
          onValueChange={(nextValue) => updateItem(index, nextValue)}
        />
        <Input
          type="text"
          class="flex-1 border-none h-8"
          value={String(item ?? "")}
          oninput={(event) => {
            const target = event.currentTarget as HTMLInputElement;
            updateItem(index, target.value);
          }}
        />
      {:else}
        <Input
          type="text"
          class="flex-1 border-none h-8"
          value={String(item ?? "")}
          oninput={(event) => {
            const target = event.currentTarget as HTMLInputElement;
            updateItem(index, target.value);
          }}
        />
      {/if}
      <Button
        variant="ghost"
        size="icon"
        class="h-8 w-8 shrink-0"
        onclick={() => removeItem(index)}
        aria-label="Remove item"
      >
        ×
      </Button>
    </div>
  {/each}
  <Button variant="ghost" size="sm" class="w-fit" onclick={addItem}>Add item</Button>
</div>
