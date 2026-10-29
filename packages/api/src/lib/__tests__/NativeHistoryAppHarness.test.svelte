<script lang="ts">
  import { untrack } from "svelte";
  import { App, type AppStateProperties } from "../context.svelte";

  const { options, onApp }: { options: AppStateProperties; onApp(app: App): void } = $props();
  const app = untrack(() => new App(options));
  untrack(() => onApp(app));
</script>
