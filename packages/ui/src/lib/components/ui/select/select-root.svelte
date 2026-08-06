<script lang="ts">
  import { Select as SelectPrimitive } from "bits-ui";
  import { setContext } from "svelte";
  import {
    createOverlayPortalContext,
    selectPortalContextKey,
  } from "$lib/internal/overlay-portal-context.js";

  let {
    open = $bindable(false),
    value = $bindable(),
    ...restProps
  }: SelectPrimitive.RootProps = $props();

  setContext(selectPortalContextKey, createOverlayPortalContext());
</script>

<SelectPrimitive.Root bind:open bind:value={value as never} {...restProps} />
