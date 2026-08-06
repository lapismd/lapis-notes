<script lang="ts">
  import { Button } from "@lapis-notes/ui/button";
  import * as Drawer from "@lapis-notes/ui/drawer";

  let open = $state(false);
  let status = $state("idle");
</script>

<div class="flex flex-col gap-4 p-4">
  <Button onclick={() => (open = true)}>Open drawer</Button>
  <Drawer.Root bind:open>
    <Drawer.Content class="gap-3 p-4">
      <Drawer.Header>
        <Drawer.Title>Choose view</Drawer.Title>
        <Drawer.Description>Pick a workspace view.</Drawer.Description>
      </Drawer.Header>
      <Button
        onclick={() => {
          status = "Daily";
          open = false;
        }}
      >
        Choose Daily
      </Button>
    </Drawer.Content>
  </Drawer.Root>
  <p data-testid="api-ui-status">{status}</p>
</div>
