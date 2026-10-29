<script lang="ts">
  import { untrack } from "svelte";
  import { App } from "../context.svelte";
  import { MemoryAppDatabase } from "../storage/app-database";
  import type { MemoryVaultAdapter } from "../storage/memory-vault-adapter";

  const {
    adapter,
    onApp,
  }: { adapter: MemoryVaultAdapter; onApp(app: App): void } = $props();
  const app = untrack(
    () =>
      new App({
        version: "test",
        adapter,
        appDatabase: new MemoryAppDatabase("workspace-state"),
        markdownRenderer: async () => undefined,
      }),
  );
  untrack(() => onApp(app));
</script>
