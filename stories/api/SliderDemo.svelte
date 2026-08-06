<script lang="ts">
  import { Slider } from "@lapismd/design-core/shadcn/slider";

  let value = $state([40]);
  const display = $derived(value[0] ?? 0);
</script>

<div class="flex flex-col gap-4 p-4">
  <div class="flex flex-col gap-2">
    <span id="intensity-label" class="text-sm">Intensity</span>
    <Slider
      aria-labelledby="intensity-label"
      bind:value
      min={0}
      max={100}
      step={1}
      class="w-64"
    />
  </div>
  <p data-testid="api-ui-status">value: {display}</p>
</div>
