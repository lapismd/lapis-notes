<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import type { ApprovalRequest } from "../core/types";

  let {
    request,
    disabled = false,
    onRespond,
  }: {
    request: ApprovalRequest;
    disabled?: boolean;
    onRespond(optionId: string): void;
  } = $props();
</script>

<section
  class="ai-approval-card"
  data-ui-component="ai-approval-card"
  data-testid="ai-approval-card"
>
  <h3>{request.title}</h3>
  {#if request.tool}
    <p data-ui-part="tool">{request.tool.name}</p>
  {/if}
  <div data-ui-part="options">
    {#each request.options as option (option.id)}
      <Button
        variant={option.kind.startsWith("deny") ? "outline" : "default"}
        size="sm"
        disabled={disabled}
        onclick={() => onRespond(option.id)}
      >
        {option.label}
      </Button>
    {/each}
  </div>
</section>
