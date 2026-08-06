<script lang="ts">
  import { Switch } from "@lapismd/design-core/shadcn/switch";

  let checked = $state(false);
  const label = $derived(checked ? "on" : "off");
</script>

<div class="flex flex-col gap-4 p-4">
  <div class="flex items-center gap-3">
    <Switch aria-label="Enabled" bind:checked />
    <Switch aria-label="Disabled switch" disabled checked={false} />
  </div>
  <p data-testid="api-ui-status">{label}</p>
</div>
