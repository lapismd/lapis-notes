<script lang="ts">
  import { untrack } from "svelte";
  import { App } from "../context.svelte";
  import type { VaultSession } from "../storage/vault-session";

  const { session, onApp }: { session: VaultSession; onApp(app: App): void } =
    $props();
  const app = untrack(
    () =>
      new App({
        version: "test",
        session,
        markdownRenderer: async () => undefined,
      }),
  );
  untrack(() => onApp(app));
</script>
