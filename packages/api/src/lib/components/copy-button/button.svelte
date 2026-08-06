<script lang="ts">
  import {
    Button,
    type ButtonProps,
  } from "@lapismd/design-core/shadcn/button";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import { cn } from "../../utils";
  import { Notice } from "$lib/workspace.svelte";
  import ClipboardCheck from "@lucide/svelte/icons/clipboard-check";
  import { Icon } from "@lapis-notes/api/icon";
  import type { Snippet } from "svelte";

  type Side = "top" | "right" | "bottom" | "left";

  type Props = ButtonProps & {
    content: string;
    icon?: string;
    tooltip?: string;
    side?: Side;
    children?: Snippet;
  };

  let copied = $state(false);
  let timer: number = -1;

  let {
    content,
    icon = "copy",
    side,
    children,
    variant,
    size,
    tooltip,
    class: className,
    ...props
  }: Props = $props();

  function copyText(_evt: MouseEvent) {
    navigator.clipboard.writeText(content).then(
      () => {
        /* clipboard successfully set */
        copied = true;
        window.clearTimeout(timer);
        timer = window.setTimeout(() => (copied = false), 1000);
      },
      () => {
        new Notice(`Failed to copy text`);
      },
    );
  }
</script>

{#if tooltip}
  <Tooltip.Provider>
    <Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props: triggerProps })}
          <Button
            {...triggerProps}
            {...props}
            class={cn(className)}
            {size}
            {variant}
            onclick={(evt) => copyText(evt)}
          >
            {@render children?.()}
            {#if copied}
              <ClipboardCheck />
            {:else}
              <Icon name={icon} />
            {/if}
          </Button>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content {side}>{tooltip}</Tooltip.Content>
    </Tooltip.Root>
  </Tooltip.Provider>
{:else}
  <Button
    class={cn(className)}
    {size}
    {variant}
    {...props}
    onclick={(evt) => copyText(evt)}
  >
    {@render children?.()}
    {#if copied}
      <ClipboardCheck />
    {:else}
      <Icon name={icon} />
    {/if}
  </Button>
{/if}
