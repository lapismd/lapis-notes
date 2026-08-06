<script lang="ts">
  import * as Select from "@lapismd/design-core/shadcn/select";

  const items = [
    { value: "notes", label: "Notes" },
    { value: "daily", label: "Daily" },
    { value: "archive", label: "Archive" },
  ];

  let value = $state("notes");
  const label = $derived(
    items.find((item) => item.value === value)?.label ?? "none",
  );
</script>

<div class="flex flex-col gap-4 p-4">
  <label class="flex flex-col gap-2 text-sm">
    <span>Workspace</span>
    <Select.Root type="single" bind:value>
      <Select.Trigger>
        {label}
      </Select.Trigger>
      <Select.Content>
        <Select.Group>
          {#each items as item (item.value)}
            <Select.Item value={item.value} label={item.label} />
          {/each}
        </Select.Group>
      </Select.Content>
    </Select.Root>
  </label>
  <p data-testid="api-ui-status">selection: {label}</p>
</div>
