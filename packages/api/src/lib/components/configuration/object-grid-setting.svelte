<script lang="ts">
  import { Input } from "@lapismd/design-core/shadcn/input";
  import { Switch } from "@lapismd/design-core/shadcn/switch";
  import * as Table from "@lapismd/design-core/shadcn/table";
  import type { ObjectType, SchemaType } from "../../configuration.svelte";
  import "./configuration.css";

  let {
    schema,
    value = $bindable<Record<string, unknown>>({}),
    onValueChange,
  }: {
    schema: ObjectType;
    value?: Record<string, unknown>;
    onValueChange?: (value: Record<string, unknown>) => void;
  } = $props();

  const entries = $derived(Object.entries(schema.properties));

  function emit(next: Record<string, unknown>): void {
    value = next;
    onValueChange?.(next);
  }

  function updateField(key: string, fieldValue: unknown): void {
    emit({ ...value, [key]: fieldValue });
  }

  function cellLabel(key: string, field: SchemaType): string {
    return field.title ?? key;
  }
</script>

<Table.Root class="configuration-table">
  <Table.Header>
    <Table.Row>
      <Table.Head class="configuration-property-head">Property</Table.Head>
      <Table.Head>Value</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each entries as [key, field] (key)}
      <Table.Row>
        <Table.Cell class="configuration-cell-label"
          >{cellLabel(key, field)}</Table.Cell
        >
        <Table.Cell class="configuration-cell">
          {#if field.type === "boolean"}
            <Switch
              checked={Boolean(value[key])}
              onCheckedChange={(checked) => updateField(key, checked)}
            />
          {:else if field.type === "number" || field.type === "integer"}
            <Input
              type="number"
              class="configuration-control"
              value={String(value[key] ?? 0)}
              oninput={(event) => {
                const target = event.currentTarget as HTMLInputElement;
                const parsed = Number(target.value);
                updateField(key, Number.isFinite(parsed) ? parsed : 0);
              }}
            />
          {:else}
            <Input
              type="text"
              class="configuration-control"
              value={String(value[key] ?? "")}
              oninput={(event) => {
                const target = event.currentTarget as HTMLInputElement;
                updateField(key, target.value);
              }}
            />
          {/if}
        </Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
