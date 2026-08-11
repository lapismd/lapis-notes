<script lang="ts">
  import {
    Separator,
    type SeparatorProps,
  } from "@lapismd/design-core/shadcn/separator";

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: SeparatorProps = $props();
</script>

<Separator
  bind:ref
  data-ui-component="sidebar-custom"
  data-ui-part="sidebar-separator"
  data-slot="sidebar-separator"
  data-sidebar="separator"
  class={className}
  {...restProps}
/>
