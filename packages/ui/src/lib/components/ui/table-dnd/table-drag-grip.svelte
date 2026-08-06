<script lang="ts">
  import { createDraggable } from "@dnd-kit/svelte";
  import { Button } from "@lapis-notes/ui/button";
  import type { Snippet } from "svelte";

  let {
    dragId,
    dragType,
    dragIndex,
    axis,
    class: className = "",
    ariaLabel,
    onclick,
    children,
    markdownHandleAttrs = false,
  }: {
    dragId: string;
    dragType: string;
    dragIndex: number;
    axis: "row" | "col";
    class?: string;
    ariaLabel: string;
    onclick?: (event: MouseEvent) => void;
    children?: Snippet;
    /** When true, emit legacy markdown e2e attributes on the grip button. */
    markdownHandleAttrs?: boolean;
  } = $props();

  const draggable = createDraggable({
    get id() {
      return dragId;
    },
    get type() {
      return dragType;
    },
    get data() {
      return {
        type: dragType,
        index: dragIndex,
      };
    },
  });
</script>

<Button
  variant="ghost"
  size="xs"
  data-grab-handle=""
  class={className}
  aria-label={ariaLabel}
  onclick={(event: MouseEvent) => {
    event.stopPropagation();
    onclick?.(event);
  }}
  data-markdown-table-drag-handle={markdownHandleAttrs ? axis : undefined}
  data-markdown-table-drag-index={markdownHandleAttrs ? dragIndex : undefined}
  {@attach draggable.attachHandle}
>
  {@render children?.()}
</Button>
