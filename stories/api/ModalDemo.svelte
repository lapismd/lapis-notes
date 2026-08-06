<script lang="ts">
  import { Button } from "@lapis-notes/ui/button";
  import Modal from "@lapis-notes/ui/modal";

  let open = $state(false);
  let status = $state("closed");

  function openModal() {
    open = true;
    status = "open";
  }
</script>

<div class="flex flex-col gap-4 p-4">
  <Button onclick={openModal}>Open modal</Button>
  <Modal
    bind:open
    title="Workspace settings"
    content="Adjust notebook preferences."
    onOpenChange={(next) => {
      if (!next) status = "closed";
    }}
  />
  <p data-testid="api-ui-status">{status}</p>
</div>
