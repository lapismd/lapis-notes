<script lang="ts">
  import * as Button from "@lapismd/design-core/shadcn/button";
  import "./DesktopRecoveryBanner.css";

  let {
    reasons = [],
    lastFailure = "",
    message = "",
    metadataBusy = false,
    searchBusy = false,
    disabled = false,
    onRebuildMetadata,
    onRebuildSearch,
    onRestart,
  }: {
    reasons?: readonly string[];
    lastFailure?: string;
    message?: string;
    metadataBusy?: boolean;
    searchBusy?: boolean;
    disabled?: boolean;
    onRebuildMetadata(): Promise<void>;
    onRebuildSearch(): Promise<void>;
    onRestart(): Promise<void>;
  } = $props();
</script>

<div
  class="desktop-recovery-banner"
  role="status"
  aria-label="Safe Mode"
  data-ui-component="desktop-recovery-banner"
  data-ui-part="root"
  data-desktop-drag-region="false"
>
  <div class="desktop-recovery-banner__message">
    <strong>Safe Mode is active</strong>
    <span
      >{reasons.length
        ? reasons.join(". ")
        : "Startup recovery restrictions are active for this session."}</span
    >
    {#if lastFailure}<span>Last failure: {lastFailure}</span>{/if}
    {#if message}<span>{message}</span>{/if}
  </div>
  <div class="desktop-recovery-banner__actions">
    <Button.Root
      variant="outline"
      disabled={disabled || metadataBusy}
      onclick={onRebuildMetadata}
    >
      {metadataBusy ? "Rebuilding metadata…" : "Rebuild metadata"}
    </Button.Root>
    <Button.Root
      variant="outline"
      disabled={disabled || searchBusy}
      onclick={onRebuildSearch}
    >
      {searchBusy ? "Rebuilding Search…" : "Rebuild Search"}
    </Button.Root>
    <Button.Root {disabled} onclick={onRestart}>Restart normally</Button.Root>
  </div>
</div>
