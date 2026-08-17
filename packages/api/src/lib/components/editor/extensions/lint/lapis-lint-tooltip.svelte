<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { WorkspaceIcon } from "@lapismd/design-core/workspace/icon";
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
  const showAttribution = $derived(sourceLabel != null || ruleId != null);

  function copyMessage(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    void navigator.clipboard?.writeText(message);
  }

  function containPointerDown(event: PointerEvent | MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
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
      {#if showAttribution}
        <span
          data-ui-component="editor"
          data-ui-part="lint-source"
          data-testid="lapis-lint-source"
        >
          {sourceLabel ??
            ""}{#if ruleId != null}{#if sourceLabel}({/if}{#if showRuleLink}<a
                data-ui-component="editor"
                data-ui-part="lint-rule"
                data-testid="lapis-lint-rule"
                href={ruleUrl}
                target="_blank"
                rel="noopener noreferrer"
                onpointerdown={containPointerDown}
                onmousedown={containPointerDown}
                onclick={(event) => event.stopPropagation()}>{ruleId}</a
              >{:else}<span
                data-ui-component="editor"
                data-ui-part="lint-rule-code"
                data-testid="lapis-lint-rule">{ruleId}</span
              >{/if}{#if sourceLabel}){/if}{/if}
        </span>
      {/if}

      {#if includeCopy}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          data-ui-component="editor"
          data-ui-part="lint-copy"
          data-testid="lapis-lint-copy"
          aria-label="Copy diagnostic message"
          onpointerdown={containPointerDown}
          onmousedown={containPointerDown}
          onclick={copyMessage}
        >
          <WorkspaceIcon name="copy" />
        </Button>
      {/if}
    </div>
  </div>

  {#if actions.length > 0}
    <div
      data-ui-component="editor"
      data-ui-part="lint-footer"
      data-testid="lapis-lint-footer"
    >
      {#each actions as action, index (index)}
        <Button
          type="button"
          variant="link"
          size="xs"
          data-ui-component="editor"
          data-ui-part="lint-action"
          data-testid="lapis-lint-action"
          aria-label={action.name}
          onpointerdown={containPointerDown}
          onmousedown={containPointerDown}
          onclick={action.onClick}
        >
          {action.name}
        </Button>
      {/each}
    </div>
  {/if}
</div>
