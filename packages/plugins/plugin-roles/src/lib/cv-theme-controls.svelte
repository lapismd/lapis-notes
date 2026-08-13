<script lang="ts">
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as ButtonGroup from "@lapismd/design-core/shadcn/button-group";
  import * as DropdownMenu from "@lapismd/design-core/shadcn/dropdown-menu";
  import { themeOptions } from "$lib/form/complete-cv-form.typed-config";

  let {
    theme = "",
    onSetTheme = () => {},
    onShiftTheme = () => {},
  }: {
    theme?: string;
    onSetTheme?: (theme: string) => void;
    onShiftTheme?: (direction: -1 | 1) => void;
  } = $props();

  const currentLabel = $derived(
    themeOptions.find((option) => option.value === theme)?.label ?? theme ?? "Theme",
  );
</script>

<div
  class="cv-theme-controls"
  data-testid="cv-theme-controls"
  aria-label="RenderCV theme"
>
  <ButtonGroup.Root aria-label="RenderCV theme cycle">
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Previous RenderCV theme"
      onclick={() => onShiftTheme(-1)}
    >
      <ChevronLeftIcon />
    </Button>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <Button
            {...props}
            variant="ghost"
            size="sm"
            class="cv-theme-controls__current"
            aria-label="Select RenderCV theme"
          >
            <span class="cv-theme-controls__label">{currentLabel}</span>
            <ChevronDownIcon data-icon="inline-end" />
          </Button>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end" data-cv-theme-menu>
        <DropdownMenu.Group>
          {#each themeOptions as option (option.value)}
            <DropdownMenu.Item onclick={() => onSetTheme(option.value)}>
              {option.label}
            </DropdownMenu.Item>
          {/each}
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Next RenderCV theme"
      onclick={() => onShiftTheme(1)}
    >
      <ChevronRightIcon />
    </Button>
  </ButtonGroup.Root>
</div>

<style>
  .cv-theme-controls {
    flex: none;
    min-width: 0;
    margin-inline-start: auto;
  }

  .cv-theme-controls__label {
    min-width: 0;
    overflow: hidden;
    text-align: start;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
