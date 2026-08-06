<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";

  let status = $state("idle");
</script>

<div class="flex flex-col gap-4 p-4">
  <Tooltip.Provider>
    <Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props })}
          <Button
            {...props}
            variant="outline"
            onclick={() => (status = "triggered")}
          >
            Hint me
          </Button>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content>
        <p>Helpful tip</p>
      </Tooltip.Content>
    </Tooltip.Root>
  </Tooltip.Provider>
  <p data-testid="api-ui-status">{status}</p>
</div>
