<script lang="ts">
  import { fuzzySearch } from "@lapis-notes/ui";
  import { Input } from "@lapis-notes/ui/input";

  const items = [
    { id: "notes", label: "Notes" },
    { id: "daily", label: "Daily notes" },
    { id: "archive", label: "Archive" },
  ];

  let query = $state("");
  const results = $derived(
    fuzzySearch(items, query, { keys: ["label"], threshold: 0.5 }),
  );
  const top = $derived(results[0]?.item.label ?? "none");
</script>

<div class="flex flex-col gap-4 p-4">
  <Input aria-label="Filter" bind:value={query} placeholder="Filter..." />
  <ul class="text-sm">
    {#each results as result (result.item.id)}
      <li>{result.item.label}</li>
    {/each}
  </ul>
  <p data-testid="api-ui-status">top: {top}</p>
</div>
