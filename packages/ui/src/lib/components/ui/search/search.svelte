<script lang="ts">
  import { Input } from "@lapis-notes/ui/input";
  import type { ComponentProps } from "svelte";
  import { cn } from "$lib/utils.js";
  import SearchIcon from "@lucide/svelte/icons/search";
  import X from "@lucide/svelte/icons/x";
  import { Button } from "@lapis-notes/ui/button";

  let {
    ref = $bindable(null),
    value = $bindable(""),
    class: inputClass,
    className,
    containerStyle,
    ...restProps
  }: ComponentProps<typeof Input> & {
    className?: string;
    containerStyle?: string;
  } = $props();

  let isClearable = $derived((value ?? "").length > 0);

  function clear() {
    value = "";
  }
</script>

<div
  class={cn(
    "border-input flex h-[var(--input-height)] w-full items-center rounded-md border px-3 ring-[var(--background-modifier-border-focus)] transition-shadow focus-within:ring-2",
    className,
  )}
  style={containerStyle}
>
  <SearchIcon class="mr-2 size-4 shrink-0 opacity-50" />
  <Input
    class={cn(
      "placeholder:text-muted-foreground flex h-full w-full rounded-md border-none bg-transparent py-0 pl-0 text-sm shadow-none outline-none focus-visible:ring-0 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
      inputClass,
    )}
    bind:ref
    bind:value
    {...restProps}
  />
  <Button
    size="xs"
    onclick={() => clear()}
    variant="default"
    class={cn(
      "size-4 rounded-full bg-[color-mix(in_srgb,var(--interactive-accent)_60%,transparent)]",
      { hidden: !isClearable },
    )}
  >
    <X />
  </Button>
</div>
