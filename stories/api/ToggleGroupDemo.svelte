<script lang="ts">
  import * as ToggleGroup from "@lapis-notes/ui/toggle-group";

  let value = $state<string[]>([]);
  const label = $derived(value.length ? value.join(",") : "none");
</script>

<div class="flex flex-col gap-4 p-4">
  <ToggleGroup.Root type="multiple" bind:value>
    <ToggleGroup.Item value="case" aria-label="case">case</ToggleGroup.Item>
    <ToggleGroup.Item value="word" aria-label="word">word</ToggleGroup.Item>
    <ToggleGroup.Item value="regex" aria-label="regex">regex</ToggleGroup.Item>
  </ToggleGroup.Root>
  <p data-testid="api-ui-status">{label}</p>
</div>
