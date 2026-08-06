<script lang="ts">
  import { Button } from "@lapis-notes/ui/button";
  import { DateTimePickerDialog } from "@lapis-notes/ui/date-time-picker-dialog";

  let open = $state(false);
  let value = $state("2026-08-06T12:00");
  let status = $state("idle");
</script>

<div class="flex flex-col gap-4 p-4">
  <Button onclick={() => (open = true)}>Pick date</Button>
  <DateTimePickerDialog
    bind:open
    bind:value
    title="Pick date & time"
    onConfirm={(next) => {
      status = next ? `applied: ${next}` : "cleared";
    }}
  />
  <p data-testid="api-ui-status">{status}</p>
</div>
