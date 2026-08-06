<script lang="ts" module>
  export type { ObjectMapOption } from "./object-map-types";
</script>

<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Table from "@lapismd/design-core/shadcn/table";
  import type { ObjectType, SchemaType } from "../../configuration.svelte";
  import type { ObjectMapOption } from "./object-map-types";
  import ObjectMapRow from "./object-map-row.svelte";
  import "./configuration.css";

  let {
    schema,
    value = $bindable<Record<string, unknown>>({}),
    valueOptions = [],
    onValueQueryChange,
    onValueChange,
  }: {
    schema: ObjectType;
    value?: Record<string, unknown>;
    valueOptions?: ObjectMapOption[];
    onValueQueryChange?: (query: string) => void;
    onValueChange?: (value: Record<string, unknown>) => void;
  } = $props();

  const valueSchema = $derived(
    typeof schema.additionalProperties === "object"
      ? schema.additionalProperties
      : ({ type: "string" } satisfies SchemaType),
  );
  const entries = $derived(Object.entries(value));
  const optionValues = $derived(
    new Set(valueOptions.map((item) => item.value)),
  );
  const allowUnknownOptions = $derived(
    "allowUnknownOptions" in valueSchema &&
      valueSchema.allowUnknownOptions === true,
  );
  const selectOptions = $derived([
    ...valueOptions,
    ...entries
      .map(([, entryValue]) => String(entryValue ?? ""))
      .filter((entryValue) => entryValue && !optionValues.has(entryValue))
      .map((entryValue) => ({
        value: entryValue,
        label: allowUnknownOptions
          ? `${entryValue} (custom)`
          : `${entryValue} (missing)`,
        disabled: !allowUnknownOptions,
      })),
  ]);

  function emit(next: Record<string, unknown>): void {
    value = next;
    onValueChange?.(next);
  }

  function nextEntryKey(): string {
    const candidates = ["*.md", "*.txt", "**/*"];
    const existing = new Set(Object.keys(value));
    const candidate = candidates.find((entry) => !existing.has(entry));
    if (candidate) {
      return candidate;
    }

    let index = 1;
    while (existing.has(`pattern-${index}`)) {
      index += 1;
    }
    return `pattern-${index}`;
  }

  function updateKey(oldKey: string, nextKey: string): boolean {
    if (oldKey === nextKey) {
      return true;
    }

    if (nextKey in value && nextKey !== oldKey) {
      return false;
    }

    const next: Record<string, unknown> = {};
    for (const [key, entryValue] of Object.entries(value)) {
      if (key === oldKey) {
        next[nextKey] = entryValue;
      } else {
        next[key] = entryValue;
      }
    }
    emit(next);
    return true;
  }

  function updateEntryValue(key: string, entryValue: unknown): void {
    emit({ ...value, [key]: entryValue });
  }

  function addEntry(): void {
    const fallbackValue = selectOptions[0]?.value ?? "";
    emit({ ...value, [nextEntryKey()]: fallbackValue });
  }

  function removeEntry(key: string): void {
    const next = { ...value };
    delete next[key];
    emit(next);
  }
</script>

<div data-ui-component="configuration" data-ui-part="stack">
  <Table.Root class="configuration-table">
    <Table.Header>
      <Table.Row>
        <Table.Head class="configuration-pattern-head">Pattern</Table.Head>
        <Table.Head>Editor</Table.Head>
        <Table.Head class="configuration-actions-head">Actions</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each entries as [key, entryValue], index (index)}
        <ObjectMapRow
          pattern={key}
          {entryValue}
          {valueSchema}
          {selectOptions}
          {onValueQueryChange}
          onPatternChange={(nextPattern) => updateKey(key, nextPattern)}
          onValueChange={(nextValue) => updateEntryValue(key, nextValue)}
          onRemove={() => removeEntry(key)}
        />
      {/each}
    </Table.Body>
  </Table.Root>
  <Button variant="outline" size="sm" onclick={addEntry}>Add association</Button
  >
</div>
