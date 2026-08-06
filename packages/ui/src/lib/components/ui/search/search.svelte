<script lang="ts">
  import { Input } from "@lapismd/design-core/shadcn/input";
  import type { ComponentProps } from "svelte";
  import { cn } from "$lib/utils.js";
  import SearchIcon from "@lucide/svelte/icons/search";
  import X from "@lucide/svelte/icons/x";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import "./search.css";

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
  data-ui-component="search"
  data-ui-part="root"
  class={cn(className)}
  style={containerStyle}
>
  <SearchIcon data-ui-component="search" data-ui-part="icon" />
  <div data-ui-component="search" data-ui-part="field">
    <Input
      class={cn(inputClass)}
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
