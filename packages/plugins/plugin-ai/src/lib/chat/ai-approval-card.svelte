<script lang="ts">
  import { Badge } from "@lapismd/design-core/shadcn/badge";
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
  class="ai-agent-request"
  data-ui-component="ai-agent-request"
  data-kind="permission"
  data-testid="ai-approval-card"
>
  <div data-ui-part="request-heading">
    <strong>{request.title}</strong>
    {#if request.tool}
      <span data-ui-part="tool">{request.tool.name}</span>
    {/if}
  </div>
  {#if request.details?.description || request.details?.path || request.details?.diff}
    <div data-ui-part="approval-details">
      {#if request.details.description}
        <p>{request.details.description}</p>
      {/if}
      {#if request.details.path}
        <code>{request.details.path}</code>
      {/if}
      {#if request.details.diff}
        <pre data-ui-part="approval-diff">{request.details.diff}</pre>
      {/if}
    </div>
  {/if}
  <div data-ui-part="options">
    {#each request.options as option, index (option.id)}
      <button
        type="button"
        data-ui-part="feedback-option"
        disabled={disabled}
        onclick={() => onRespond(option.id)}
      >
        <Badge variant="secondary">{String.fromCharCode(65 + index)}</Badge>
        <span>{option.label}</span>
      </button>
    {/each}
  </div>
</section>
