<script lang="ts">
  import * as ContextMenu from "@lapis-notes/ui/context-menu";

  let status = $state("idle");
</script>

<div class="flex flex-col gap-4 p-4">
  <ContextMenu.Root>
    <ContextMenu.Trigger
      class="border-border flex h-24 w-64 items-center justify-center rounded-md border border-dashed text-sm"
    >
      Right-click here
    </ContextMenu.Trigger>
    <ContextMenu.Content class="w-48">
      <ContextMenu.Item onclick={() => (status = "open")}>Open</ContextMenu.Item>
    </ContextMenu.Content>
  </ContextMenu.Root>
  <p data-testid="api-ui-status">{status}</p>
</div>
