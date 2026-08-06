<script lang="ts">
  import { buttonVariants } from "@lapis-notes/ui/button";
  import * as Tooltip from "@lapis-notes/ui/tooltip";

  let status = $state("idle");
</script>

<div class="flex flex-col gap-4 p-4">
  <Tooltip.Provider>
    <Tooltip.Root>
      <Tooltip.Trigger
        class={buttonVariants({ variant: "outline" })}
        onclick={() => (status = "triggered")}
      >
        Hint me
      </Tooltip.Trigger>
      <Tooltip.Content>
        <p>Helpful tip</p>
      </Tooltip.Content>
    </Tooltip.Root>
  </Tooltip.Provider>
  <p data-testid="api-ui-status">{status}</p>
</div>
