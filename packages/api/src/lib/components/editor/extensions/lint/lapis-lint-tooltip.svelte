<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import "../../editor.css";

  export type LintTooltipAction = {
    name: string;
    onClick: (event: MouseEvent) => void;
  };

  type Props = {
    message: string;
    ruleId?: string;
    ruleUrl?: string;
    sourceLabel?: string;
    includeCopy?: boolean;
    actions?: LintTooltipAction[];
  };

  let {
    message,
    ruleId,
    ruleUrl,
    sourceLabel,
    includeCopy = true,
    actions = [],
  }: Props = $props();

  const showRuleLink = $derived(ruleId != null && ruleUrl != null);

  function copyMessage(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    void navigator.clipboard?.writeText(message);
  }
</script>

<div
  data-ui-component="editor"
  data-ui-part="lint-tooltip"
  data-testid="lapis-lint-tooltip"
>
  <div
    data-ui-component="editor"
    data-ui-part="lint-message-band"
    data-ui-copy={includeCopy ? "" : undefined}
    data-testid="lapis-lint-message-band"
  >
    <div data-ui-component="editor" data-ui-part="lint-message-row">
      <span
        data-ui-component="editor"
        data-ui-part="lint-message-text"
        data-testid="lapis-lint-message-text">{message}</span
      >
      {#if showRuleLink}
        <a
          data-ui-component="editor"
          data-ui-part="lint-rule"
          data-testid="lapis-lint-rule"
          href={ruleUrl}
          target="_blank"
          rel="noopener noreferrer"
          onclick={(event) => event.stopPropagation()}
        >
          {ruleId}
        </a>
      {/if}
    </div>

    {#if includeCopy}
      <Button
        type="button"
        variant="link"
        size="xs"
        data-ui-component="editor"
        data-ui-part="lint-copy"
        data-testid="lapis-lint-copy"
        aria-label="Copy diagnostic message"
        onclick={copyMessage}
      >
        <svg
          aria-hidden="true"
          data-ui-component="editor"
          data-ui-part="lint-copy-icon"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="6" y="6" width="7" height="7" rx="1.5"></rect>
          <path d="M3 10V4.5A1.5 1.5 0 0 1 4.5 3H10"></path>
        </svg>
      </Button>
    {/if}

    {#if sourceLabel}
      <div
        data-ui-component="editor"
        data-ui-part="lint-source"
        data-testid="lapis-lint-source"
      >
        {sourceLabel}
      </div>
    {/if}
  </div>

  {#if actions.length > 0}
    <div
      data-ui-component="editor"
      data-ui-part="lint-footer"
      data-testid="lapis-lint-footer"
    >
      {#each actions as action (action.name)}
        <Button
          type="button"
          variant="link"
          size="xs"
          data-ui-component="editor"
          data-ui-part="lint-action"
          data-testid="lapis-lint-action"
          aria-label={action.name}
          onclick={action.onClick}
        >
          {action.name}
        </Button>
      {/each}
    </div>
  {/if}
</div>
