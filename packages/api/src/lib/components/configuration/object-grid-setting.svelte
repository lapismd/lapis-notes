<script lang="ts">
  import { Input } from "@lapis-notes/ui/input";
  import { Switch } from "@lapis-notes/ui/switch";
  import * as Table from "@lapis-notes/ui/table";
  import type { ObjectType, SchemaType } from "../../configuration.svelte";

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

<Table.Root class="w-full text-sm">
  <Table.Header>
    <Table.Row>
      <Table.Head class="w-[40%]">Property</Table.Head>
      <Table.Head>Value</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each entries as [key, field] (key)}
      <Table.Row>
        <Table.Cell class="font-medium align-middle">{cellLabel(key, field)}</Table.Cell>
        <Table.Cell class="align-middle">
          {#if field.type === "boolean"}
            <Switch
              checked={Boolean(value[key])}
              onCheckedChange={(checked) => updateField(key, checked)}
            />
          {:else if field.type === "number" || field.type === "integer"}
            <Input
              type="number"
              class="border-none h-8"
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
              class="border-none h-8"
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
