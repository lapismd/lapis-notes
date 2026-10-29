<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";

  let {
    svg,
    class: className = "",
    ...rest
  }: { svg: string; class?: string } & HTMLAttributes<HTMLSpanElement> =
    $props();
</script>

<span
  {...rest}
  class={["ui-workspace-icon", className].filter(Boolean).join(" ")}
  data-ui-component="workspace-icon"
>
  {@html svg}
</span>
