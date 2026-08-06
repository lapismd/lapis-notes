<script lang="ts">
  import { Button } from "@lapis-notes/ui/button";
  import * as DropdownMenu from "@lapis-notes/ui/dropdown-menu";

  let status = $state("idle");
  let pinned = $state(false);
</script>

<div class="flex flex-col gap-4 p-4">
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <Button {...props}>Open menu</Button>
      {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content class="w-48">
      <DropdownMenu.Item onclick={() => (status = "rename")}>Rename</DropdownMenu.Item>
      <DropdownMenu.CheckboxItem bind:checked={pinned}>Pinned</DropdownMenu.CheckboxItem>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
  <p data-testid="api-ui-status">{status}</p>
</div>
