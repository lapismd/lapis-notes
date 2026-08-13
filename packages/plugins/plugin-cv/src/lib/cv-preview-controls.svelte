<script lang="ts">
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import MinusIcon from "@lucide/svelte/icons/minus";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as ButtonGroup from "@lapismd/design-core/shadcn/button-group";
  import * as DropdownMenu from "@lapismd/design-core/shadcn/dropdown-menu";
  import type { TypstPreviewFormat } from "$lib/cv/web-artifacts";
  import {
    clampZoom,
    previewModeLabel,
    previewOptions,
    type CvPreviewMode,
    type CvPreviewOption,
  } from "$lib/cv/cv-options";

  let {
    previewMode = $bindable("rendercv"),
    previewFormat = $bindable("svg"),
    zoom = $bindable(1),
  }: {
    previewMode?: CvPreviewMode;
    previewFormat?: TypstPreviewFormat;
    zoom?: number;
  } = $props();

  const label = $derived(previewModeLabel(previewMode, previewFormat));

  function selectPreviewOption(option: CvPreviewOption) {
    if (option.previewFormat) previewFormat = option.previewFormat;
    previewMode = option.value;
  }

  function setZoom(next: number) {
    zoom = clampZoom(next);
  }
</script>

<div class="cv-preview-controls" data-testid="cv-preview-controls">
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          variant="outline"
          size="sm"
          class="cv-preview-controls__mode"
          aria-label="Select preview type"
          data-testid="cv-preview-mode"
        >
          {label}
          <ChevronDownIcon data-icon="inline-end" />
        </Button>
      {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end" data-cv-preview-menu>
      <DropdownMenu.Group>
        {#each previewOptions as option (`${option.value}:${option.previewFormat ?? "artifact"}`)}
          <DropdownMenu.Item onclick={() => selectPreviewOption(option)}>
            {option.label}
          </DropdownMenu.Item>
        {/each}
      </DropdownMenu.Group>
    </DropdownMenu.Content>
  </DropdownMenu.Root>

  <ButtonGroup.Root class="cv-preview-controls__zoom" aria-label="Preview zoom">
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Zoom out"
      onclick={() => setZoom(zoom - 0.1)}
    >
      <MinusIcon />
    </Button>
    <Button
      variant="ghost"
      size="sm"
      class="cv-preview-controls__zoom-value"
      aria-label="Reset zoom"
      onclick={() => setZoom(1)}
    >
      {Math.round(zoom * 100)}%
    </Button>
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Zoom in"
      onclick={() => setZoom(zoom + 0.1)}
    >
      <PlusIcon />
    </Button>
  </ButtonGroup.Root>
</div>

<style>
  .cv-preview-controls {
    display: flex;
    flex: none;
    min-width: 0;
    align-items: center;
    gap: 0.5rem;
  }
</style>
