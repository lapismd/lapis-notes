<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { Input } from "@lapismd/design-core/shadcn/input";

  let {
    ref = $bindable(null),
    value = $bindable(""),
    class: className,
    ...restProps
  }: ComponentProps<typeof Input> = $props();
</script>

<Input
  bind:ref
  bind:value
  data-ui-component="sidebar-custom"
  data-ui-part="sidebar-input"
  data-slot="sidebar-input"
  data-sidebar="input"
  class={className}
  {...restProps}
/>
