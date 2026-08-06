<script lang="ts">
  import { Separator } from "@lapismd/design-core/shadcn/separator";
  import type { ComponentProps } from "svelte";

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: ComponentProps<typeof Separator> = $props();
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
