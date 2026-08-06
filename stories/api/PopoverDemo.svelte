<script lang="ts">
  import { Button } from "@lapis-notes/ui/button";
  import * as Popover from "@lapis-notes/ui/popover";

  let status = $state("idle");
</script>

<div class="flex flex-col gap-4 p-4">
  <Popover.Root>
    <Popover.Trigger>
      {#snippet child({ props })}
        <Button {...props}>Open popover</Button>
      {/snippet}
    </Popover.Trigger>
    <Popover.Content class="w-48 p-2">
      <button
        type="button"
        class="hover:bg-accent w-full rounded-md px-2 py-1.5 text-left text-sm"
        onclick={() => (status = "picked Daily")}
      >
        Daily
      </button>
    </Popover.Content>
  </Popover.Root>
  <p data-testid="api-ui-status">{status}</p>
</div>
