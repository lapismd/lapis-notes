<script lang="ts">
  import Search from "@lapis-notes/ui/search";

  let value = $state("");
</script>

<div class="flex flex-col gap-4 p-4">
  <Search aria-label="Search notes" bind:value placeholder="Search..." />
  <p data-testid="api-ui-status">value: {value}</p>
</div>
