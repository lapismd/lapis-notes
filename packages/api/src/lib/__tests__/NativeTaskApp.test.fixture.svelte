<script lang="ts">
  import { App, type AppStateProperties } from "../context.svelte";
  import { untrack } from "svelte";
  let { properties, onApp }: {
    properties: AppStateProperties;
    onApp: (app: App) => void;
  } = $props();
  untrack(() => onApp(new App(properties)));
</script>
