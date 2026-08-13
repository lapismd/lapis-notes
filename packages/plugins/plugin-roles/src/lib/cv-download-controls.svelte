<script lang="ts">
  import DownloadIcon from "@lucide/svelte/icons/download";
  import SaveIcon from "@lucide/svelte/icons/save";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as DropdownMenu from "@lapismd/design-core/shadcn/dropdown-menu";

  let {
    available = false,
    canSaveToVault = false,
    onDownload = () => {},
    onSaveToVault = () => {},
  }: {
    available?: boolean;
    canSaveToVault?: boolean;
    onDownload?: () => void | Promise<void>;
    onSaveToVault?: () => void | Promise<void>;
  } = $props();
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger disabled={!available}>
    {#snippet child({ props })}
      <Button
        {...props}
        variant="outline"
        size="icon-sm"
        aria-label="Export PDF"
        title="Export PDF"
        disabled={!available}
      >
        <DownloadIcon />
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end" class="cv-download-controls__menu">
    <DropdownMenu.Item onclick={onDownload}>
      <DownloadIcon data-icon="inline-start" />
      Download PDF
    </DropdownMenu.Item>
    <DropdownMenu.Item disabled={!canSaveToVault} onclick={onSaveToVault}>
      <SaveIcon data-icon="inline-start" />
      Save PDF to vault
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
