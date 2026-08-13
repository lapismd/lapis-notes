<script lang="ts">
  import * as Button from "@lapismd/design-core/shadcn/button";
  import type { Readable } from "svelte/store";
  import type { PwaHostState } from "./pwa-host-state";

  let {
    stateStore,
    onLater,
    onInstallNow,
  }: {
    stateStore: Readable<PwaHostState>;
    onLater: () => void;
    onInstallNow: () => void;
  } = $props();
</script>

{#if $stateStore.updatePromptVisible}
  <div class="pointer-events-none fixed right-4 bottom-14 z-[60] max-w-[min(24rem,calc(100vw-2rem))]">
    <section
      role="status"
      aria-live="polite"
      class="bg-popover text-popover-foreground border-border pointer-events-auto grid gap-3 rounded-lg border p-4 shadow-lg"
    >
      <div class="grid gap-1">
        <h2 class="text-base leading-tight font-semibold">New update available</h2>
        <p class="text-muted-foreground text-sm leading-relaxed">
          Reload to install the latest cached version of Lapis Notes.
        </p>
      </div>
      <div class="flex items-center justify-end gap-2">
        <Button.Root variant="ghost" onclick={onLater}>Later</Button.Root>
        <Button.Root onclick={onInstallNow} disabled={$stateStore.updateApplying}>
          {$stateStore.updateApplying ? "Installing..." : "Install Now"}
        </Button.Root>
      </div>
    </section>
  </div>
{/if}
