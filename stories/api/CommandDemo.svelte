<script lang="ts">
  import * as Command from "@lapis-notes/ui/command";

  let status = $state("none");
</script>

<div class="flex flex-col gap-4 p-4">
  <Command.Root class="rounded-md border">
    <Command.Input placeholder="Filter..." />
    <Command.List>
      <Command.Empty>No results.</Command.Empty>
      <Command.Item value="Notes" onclick={() => (status = "Notes")}>Notes</Command.Item>
      <Command.Item value="Daily" onclick={() => (status = "Daily")}>Daily</Command.Item>
      <Command.Item value="Archive" onclick={() => (status = "Archive")}>
        Archive
      </Command.Item>
    </Command.List>
  </Command.Root>
  <p data-testid="api-ui-status">selected: {status}</p>
</div>
