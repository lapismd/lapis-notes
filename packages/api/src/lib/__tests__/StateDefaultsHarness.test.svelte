<script lang="ts">
  import { untrack } from "svelte";
  import { App } from "../context.svelte";
  import { MemoryAppDatabase } from "../storage/app-database";
  import { InMemoryDataAdapter } from "./data-adapter-conformance";

  const { onApp }: { onApp: (app: App) => void } = $props();
  const app = new App({
    version: "test",
    adapter: new InMemoryDataAdapter(),
    appDatabase: new MemoryAppDatabase("state-default"),
    markdownRenderer: async () => undefined,
  });
  untrack(() => onApp(app));
</script>
