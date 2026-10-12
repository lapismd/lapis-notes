<script lang="ts">
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import type { CommunityChipProps } from "./props.js";

  let {
    children,
    leading,
    variant = "outline",
    tone = "neutral",
    size = "default",
    shape = "pill",
    href,
    onclick,
    buttonProps,
    linkProps,
    disabled = false,
    pressed,
    ariaLabel,
    ariaHidden = false,
    title,
    class: className = "",
  }: CommunityChipProps = $props();

  const badgeVariant = $derived(
    variant === "muted" || variant === "subtle"
      ? "secondary"
      : variant === "solid"
        ? "default"
        : "outline",
  );
  const action = $derived(href !== undefined || onclick !== undefined);
  const classes = $derived(`community-chip ${className}`.trim());
</script>

{#snippet content()}
  {#if leading}{@render leading()}{/if}
  {@render children()}
{/snippet}

{#if href !== undefined}
  <Badge
    {...linkProps}
    {href}
    variant={badgeVariant}
    class={classes}
    data-ui-part="community-chip"
    data-chip-variant={variant}
    data-chip-tone={tone}
    data-chip-size={size}
    data-chip-shape={shape}
    data-action={action ? "" : undefined}
    aria-label={ariaLabel}
    aria-hidden={ariaHidden ? "true" : undefined}
    aria-disabled={disabled ? "true" : undefined}
    tabindex={disabled ? -1 : undefined}
    {title}
    onclick={(event) => {
      if (disabled) {
        event.preventDefault();
        return;
      }
      linkProps?.onclick?.(event);
      if (!event.defaultPrevented) onclick?.(event);
    }}
  >
    {@render content()}
  </Badge>
{:else if onclick !== undefined}
  <Button
    {...buttonProps}
    type="button"
    variant={badgeVariant}
    size={size === "inline" ? "xs" : "sm"}
    class={classes}
    data-ui-part="community-chip"
    data-chip-variant={variant}
    data-chip-tone={tone}
    data-chip-size={size}
    data-chip-shape={shape}
    data-action=""
    aria-label={ariaLabel}
    aria-hidden={ariaHidden ? "true" : undefined}
    aria-pressed={pressed}
    {disabled}
    {title}
    onclick={(event) => {
      buttonProps?.onclick?.(event);
      if (!event.defaultPrevented) onclick(event);
    }}
  >
    {@render content()}
  </Button>
{:else}
  <Badge
    variant={badgeVariant}
    class={classes}
    data-ui-part="community-chip"
    data-chip-variant={variant}
    data-chip-tone={tone}
    data-chip-size={size}
    data-chip-shape={shape}
    aria-label={ariaLabel}
    aria-hidden={ariaHidden ? "true" : undefined}
    {title}
  >
    {@render content()}
  </Badge>
{/if}

<style>
  :global(.community-chip[data-ui-component="badge"]),
  :global(.community-chip[data-ui-component="button"]) {
    height: 1.45rem;
    min-height: 1.45rem;
    gap: 0.3rem;
    border-radius: calc(var(--radius) * 2.6);
    padding-inline: 0.55rem;
    font-size: var(--community-text-secondary);
    font-weight: 550;
    line-height: 1;
  }

  :global(.community-chip[data-chip-size="compact"]) {
    height: 1.25rem;
    min-width: 1.25rem;
    min-height: 1.25rem;
    padding-inline: 0.4rem;
    font-variant-numeric: tabular-nums;
  }

  :global(.community-chip[data-chip-size="indicator"]) {
    height: 1rem;
    min-width: 1rem;
    min-height: 1rem;
    padding-inline: 0.2rem;
    font-size: var(--community-text-secondary);
    font-variant-numeric: tabular-nums;
  }

  :global(.community-chip[data-ui-component][data-chip-size="inline"]) {
    width: fit-content;
    max-width: 100%;
    height: 1lh;
    min-height: 0;
    gap: 0.22em;
    border: 0;
    border-radius: calc(var(--radius) - 0.2rem);
    padding: 0 0.25em;
    box-decoration-break: clone;
    font: inherit;
    font-weight: 600;
    line-height: inherit;
    text-align: start;
    vertical-align: baseline;
    -webkit-box-decoration-break: clone;
  }

  :global(.community-chip[data-chip-shape="square"]) {
    border-radius: 0.28rem;
  }

  :global(
      .community-chip[data-chip-variant="muted"][data-chip-shape="square"]
    ) {
    border-color: transparent;
    color: inherit;
    background: color-mix(in srgb, currentcolor 7%, transparent);
  }

  :global(.community-chip[data-chip-variant="subtle"]) {
    border: 0;
  }

  :global(
      .community-chip[data-chip-variant="subtle"][data-chip-tone="neutral"]
    ) {
    color: var(--foreground);
    background: color-mix(in srgb, var(--foreground) 8%, transparent);
  }

  :global(.community-chip[data-chip-tone="accent"]) {
    border-color: color-mix(in srgb, var(--primary) 38%, var(--border));
    color: var(--foreground);
    background: color-mix(in srgb, var(--primary) 12%, var(--background));
  }

  :global(.community-chip[data-chip-tone="success"]) {
    border-color: color-mix(in srgb, #16a34a 44%, var(--border));
    color: color-mix(in srgb, #16a34a 65%, var(--foreground));
    background: color-mix(in srgb, #16a34a 14%, var(--background));
  }

  :global(.community-chip[data-chip-tone="warning"]) {
    border-color: color-mix(in srgb, #d97706 42%, var(--border));
    color: color-mix(in srgb, #b45309 78%, var(--foreground));
    background: color-mix(in srgb, #f59e0b 13%, var(--background));
  }

  :global(.community-chip[data-chip-tone="danger"]) {
    border-color: color-mix(in srgb, var(--destructive) 42%, var(--border));
    color: var(--foreground);
    background: color-mix(in srgb, var(--destructive) 10%, var(--background));
  }

  :global(
      .community-chip[data-ui-component="badge"][data-action]:hover,
      .community-chip[data-ui-component="button"][data-action]:hover
    ) {
    background-color: color-mix(
      in srgb,
      var(--foreground) 10%,
      var(--background)
    );
    color: var(--accent-foreground);
  }

  :global(.community-chip[aria-disabled="true"]) {
    opacity: 0.5;
    pointer-events: none;
  }

  :global(.community-chip > svg),
  :global(.community-chip [data-icon]) {
    width: 0.8rem;
    height: 0.8rem;
    flex: none;
  }
</style>
