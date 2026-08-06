<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Progress } from "@lapismd/design-core/shadcn/progress";

  let value = $state(40);
</script>

<div class="flex flex-col gap-4 p-4">
  <Progress {value} max={100} class="w-64" aria-label="Completion" />
  <Button onclick={() => (value = 80)}>Bump to 80</Button>
  <p data-testid="api-ui-status">value: {value}</p>
</div>
