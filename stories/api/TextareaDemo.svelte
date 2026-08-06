<script lang="ts">
  import { Textarea } from "@lapis-notes/ui/textarea";

  let value = $state("");
</script>

<div class="flex flex-col gap-4 p-4">
  <Textarea aria-label="Notes" bind:value placeholder="Notes" rows={4} />
  <p data-testid="api-ui-status">value: {value}</p>
</div>
