<script lang="ts">
  import { Button } from "@lapis-notes/ui/button";
  import { cn } from "../../../../utils";

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
  class="group border-border border-l-warning bg-secondary relative flex min-w-[360px] max-w-[min(720px,calc(100vw-48px))] flex-col overflow-hidden rounded-md border border-l-4 shadow-md"
  data-testid="lapis-lint-tooltip"
>
  <div
    class="bg-secondary relative px-3 py-2"
    class:pr-10={includeCopy}
    data-testid="lapis-lint-message-band"
  >
    <div class="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-1">
      <span
        class="font-mono text-sm whitespace-pre-wrap"
        data-testid="lapis-lint-message-text">{message}</span
      >
      {#if showRuleLink}
        <a
          class="shrink-0 text-sm text-[var(--text-accent)] underline-offset-2 hover:underline"
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
        class={cn(
          "text-muted-foreground hover:text-foreground absolute top-2 right-2 h-auto p-0 text-xs font-normal",
          "opacity-0 transition-opacity group-hover:opacity-100",
        )}
        data-testid="lapis-lint-copy"
        aria-label="Copy diagnostic message"
        onclick={copyMessage}
      >
        <svg
          aria-hidden="true"
          class="h-3.5 w-3.5"
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
        class="text-muted-foreground mt-1 text-xs"
        data-testid="lapis-lint-source"
      >
        {sourceLabel}
      </div>
    {/if}
  </div>

  {#if actions.length > 0}
    <div
      class="border-border flex flex-wrap items-center gap-x-3 gap-y-1 border-t py-1.5 pr-3 pl-4 [background:color-mix(in_srgb,var(--secondary)_82%,var(--foreground)_8%)]"
      data-testid="lapis-lint-footer"
    >
      {#each actions as action (action.name)}
        <Button
          type="button"
          variant="link"
          size="xs"
          class="text-foreground h-auto p-0 text-xs font-normal underline-offset-2 hover:text-[var(--text-accent)] hover:underline"
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
