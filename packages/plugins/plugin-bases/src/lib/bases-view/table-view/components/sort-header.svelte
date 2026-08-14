<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import type { ComponentProps } from "svelte";
  import ArrowUpDownIcon from "@lucide/svelte/icons/arrow-up-down";
  import type { SortDirection } from "@tanstack/table-core";
  import ArrowDown from "@lucide/svelte/icons/chevron-down";
  import ArrowUp from "@lucide/svelte/icons/chevron-up";
  import { Icon } from "@lapis-notes/api/icon";

  let {
    variant = "ghost",
    icon,
    direction,
    text,
    children,
    ...restProps
  }: ComponentProps<typeof Button> & {
    direction: false | SortDirection;
    text?: string;
    icon: string;
  } = $props();
</script>

<Button
  class="bases-style-flex-60fbb7 bases-style-h-full-668b21 bases-style-w-full-6da6a3 bases-style-justify-between-8ef226 bases-style-rounded-none-0c5e91 bases-style-p-2-7660b4"
  {variant}
  {...restProps}
>
  <span class="bases-style-flex-60fbb7 bases-style-items-center-3960ff">
    <Icon name={[icon, "lucide-info"]} class="bases-style-mr-1-618162" />
    <span>
      {#if text}
        {text}
      {:else}
        {@render children?.()}
      {/if}
    </span>
  </span>
  <span>
    {#if direction === "asc"}
      <ArrowUp class="bases-style-ml-2-c68af9" />
    {:else if direction === "desc"}
      <ArrowDown class="bases-style-ml-2-c68af9" />
    {:else}
      <ArrowUpDownIcon class="bases-style-ml-2-c68af9" />
    {/if}
  </span>
</Button>
