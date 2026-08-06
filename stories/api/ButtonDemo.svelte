<script lang="ts">
  import { Button } from "@lapis-notes/ui/button";

  let clicks = $state(0);
</script>

<div class="flex flex-col gap-4 p-4">
  <div class="flex flex-wrap items-center gap-2">
    <Button onclick={() => (clicks += 1)}>Save changes</Button>
    <Button variant="outline" size="sm">Outline</Button>
    <Button variant="secondary" size="sm">Secondary</Button>
    <Button variant="ghost" size="sm">Ghost</Button>
    <Button variant="destructive" size="sm">Destructive</Button>
    <Button disabled>Disabled</Button>
  </div>
  <p data-testid="api-ui-status">clicks: {clicks}</p>
</div>
