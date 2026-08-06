<script lang="ts">
  import { Slider as SliderPrimitive } from "bits-ui";
  import { cn, type WithoutChildrenOrChild } from "$lib/utils.js";

  let {
    ref = $bindable(null),
    value = $bindable(),
    orientation = "horizontal",
    class: className,
    ...restProps
  }: WithoutChildrenOrChild<SliderPrimitive.RootProps> = $props();
</script>

<!--
Discriminated Unions + Destructing (required for bindable) do not
get along, so we shut typescript up by casting `value` to `never`.
-->
<SliderPrimitive.Root
  bind:ref
  bind:value={value as never}
  data-slot="slider"
  {orientation}
  class={cn(
    "group/slider relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
    className,
  )}
  {...restProps}
>
  {#snippet children({ thumbItems })}
    <span
      data-orientation={orientation}
      data-slot="slider-track"
      class={cn(
        "bg-muted relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5",
      )}
    >
      <SliderPrimitive.Range
        data-slot="slider-range"
        class={cn(
          "absolute bg-[var(--interactive-accent)] data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full",
        )}
      />
    </span>
    {#each thumbItems as { index, value } (index)}
      <SliderPrimitive.Thumb
        data-slot="slider-thumb"
        {index}
        class="bg-background ring-ring/50 block size-4 shrink-0 rounded-full border border-[var(--interactive-accent)] transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
      />
      <SliderPrimitive.ThumbLabel
        class="pointer-events-none invisible relative z-(--layer-tooltip) mb-5 rounded-md bg-[var(--interactive-accent)] px-3 py-1.5 text-xs text-balance text-[var(--text-on-accent)] opacity-0 shadow-xs transition-[opacity,visibility] duration-150 group-focus-within/slider:visible group-focus-within/slider:opacity-100 group-hover/slider:visible group-hover/slider:opacity-100"
        {index}
        position="top"
      >
        {value}
        <span
          aria-hidden="true"
          class="absolute top-full left-1/2 size-2.5 -translate-x-1/2 -translate-y-[calc(50%_+_1px)] rotate-45 rounded-[2px] bg-[var(--interactive-accent)]"
        ></span>
      </SliderPrimitive.ThumbLabel>
    {/each}
  {/snippet}
</SliderPrimitive.Root>
