<script lang="ts">
  import {
    Input,
    type InputProps,
  } from "@lapismd/design-core/shadcn/input";

  let {
    ref = $bindable(null),
    value = $bindable(""),
    class: className,
    ...restProps
  }: InputProps = $props();
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
