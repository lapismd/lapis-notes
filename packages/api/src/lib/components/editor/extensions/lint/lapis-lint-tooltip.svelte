<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { WorkspaceIcon } from "@lapismd/design-core/workspace/icon";
  import { DropdownMenu } from "bits-ui";
  import {
    splitLintTooltipActions,
    type LintTooltipAction,
  } from "./lint-tooltip-actions";
  import "../../editor.css";

  export type { LintTooltipAction };

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
  const { viewProblem, quickFixActions } = $derived(
    splitLintTooltipActions(actions),
  );
  const showFooter = $derived(
    Boolean(viewProblem) || quickFixActions.length > 0,
  );

  function copyMessage(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    void navigator.clipboard?.writeText(message);
  }

  function containPointerDown(event: PointerEvent | MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  function stopRowActivation(event: Event) {
    event.stopPropagation();
  }

  function selectQuickFix(action: LintTooltipAction, event: MouseEvent) {
    action.onClick(event);
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

  {#if showFooter}
    <div
      data-ui-component="editor"
      data-ui-part="lint-footer"
      data-testid="lapis-lint-footer"
    >
      {#if quickFixActions.length > 0}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger
            class="ui-editor-lint-quick-fix"
            data-ui-component="editor"
            data-ui-part="lint-quick-fix"
            data-testid="lapis-lint-quick-fix"
            aria-label="Quick Fix"
            title="Quick Fix"
            onpointerdown={stopRowActivation}
            onmousedown={stopRowActivation}
          >
            Quick Fix
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              class="ui-editor-lint-quick-fix-menu"
              data-ui-component="workspace-menu"
              data-ui-part="content"
              data-lint-quick-fix-menu=""
              align="start"
              side="bottom"
              sideOffset={4}
              strategy="fixed"
              collisionBoundary={[]}
              onpointerdown={stopRowActivation}
            >
              {#each quickFixActions as action, index (`${action.name}-${index}`)}
                <DropdownMenu.Item
                  class="ui-editor-lint-quick-fix-menu__item"
                  data-ui-component="workspace-menu"
                  data-ui-part="item"
                  onclick={(event) => selectQuickFix(action, event)}
                >
                  <WorkspaceIcon name="lightbulb" />
                  <span class="ui-editor-lint-quick-fix-menu__label">
                    {action.name}
                  </span>
                </DropdownMenu.Item>
              {/each}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      {/if}
      {#if viewProblem}
        <Button
          type="button"
          variant="link"
          size="xs"
          data-ui-component="editor"
          data-ui-part="lint-action"
          data-testid="lapis-lint-action"
          aria-label={viewProblem.name}
          onpointerdown={containPointerDown}
          onmousedown={containPointerDown}
          onclick={viewProblem.onClick}
        >
          {viewProblem.name}
        </Button>
      {/if}
    </div>
  {/if}
</div>
