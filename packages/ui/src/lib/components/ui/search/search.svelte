<script lang="ts">
  import { Input } from "@lapismd/design-core/shadcn/input";
  import type { ComponentProps } from "svelte";
  import { cn } from "$lib/utils.js";
  import SearchIcon from "@lucide/svelte/icons/search";
  import X from "@lucide/svelte/icons/x";
  import { Button } from "@lapismd/design-core/shadcn/button";

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
  <div class="flex h-full min-w-0 flex-1 items-center">
    <Input
      class={cn(
        "h-full border-none bg-transparent py-0 pl-0 shadow-none focus-visible:ring-0",
        inputClass,
      )}
      bind:ref
      bind:value
      {...restProps}
    />
  </div>
  {#if isClearable}
    <Button
      size="icon-xs"
      onclick={() => clear()}
      variant="ghost"
      aria-label="Clear search"
    >
      <X />
    </Button>
  {/if}
</div>
