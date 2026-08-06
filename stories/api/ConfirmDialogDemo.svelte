<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import ConfirmDialog from "@lapis-notes/ui/confirm-dialog";

  let open = $state(false);
  let status = $state("idle");
</script>

<div class="flex flex-col gap-4 p-4">
  <Button onclick={() => (open = true)}>Ask to confirm</Button>
  <ConfirmDialog
    bind:open
    title="Delete note?"
    description="This cannot be undone."
    confirmLabel="Delete"
    cancelLabel="Cancel"
    confirmVariant="destructive"
    onConfirm={() => (status = "confirmed")}
    onCancel={() => (status = "cancelled")}
  />
  <p data-testid="api-ui-status">{status}</p>
</div>
