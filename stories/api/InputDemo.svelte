<script lang="ts">
  import { Input } from "@lapismd/design-core/shadcn/input";

  let value = $state("");
</script>

<div class="flex flex-col gap-4 p-4">
  <Input aria-label="Title" bind:value placeholder="Title" />
  <Input aria-label="Disabled input" disabled value="locked" />
  <p data-testid="api-ui-status">value: {value}</p>
</div>
