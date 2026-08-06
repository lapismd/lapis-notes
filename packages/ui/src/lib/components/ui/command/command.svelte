<script lang="ts">
  import { Command as CommandPrimitive } from "bits-ui";
  import { commandFuzzyFilter } from "$lib/command-fuzzy-filter.js";
  import { cn } from "$lib/utils.js";

  let {
    ref = $bindable(null),
    value = $bindable(""),
    filter = commandFuzzyFilter,
    class: className,
    ...restProps
  }: CommandPrimitive.RootProps = $props();
</script>

<CommandPrimitive.Root
  bind:value
  bind:ref
  {filter}
  data-slot="command"
  class={cn(
    "bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md",
    className,
  )}
  {...restProps}
/>
