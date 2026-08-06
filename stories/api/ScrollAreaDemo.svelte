<script lang="ts">
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";

  const items = Array.from({ length: 40 }, (_, i) => `Item ${i + 1}`);
</script>

<div class="flex flex-col gap-4 p-4">
  <ScrollArea class="h-40 w-64 rounded-md border">
    <div class="flex flex-col gap-1 p-2">
      {#each items as item (item)}
        <div class="text-sm">{item}</div>
      {/each}
    </div>
  </ScrollArea>
  <p data-testid="api-ui-status">items: {items.length}</p>
</div>
