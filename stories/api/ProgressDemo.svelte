<script lang="ts">
  import { Button } from "@lapis-notes/ui/button";
  import { Progress } from "@lapis-notes/ui/progress";

  let value = $state(40);
</script>

<div class="flex flex-col gap-4 p-4">
  <Progress {value} max={100} class="w-64" />
  <Button onclick={() => (value = 80)}>Bump to 80</Button>
  <p data-testid="api-ui-status">value: {value}</p>
</div>
