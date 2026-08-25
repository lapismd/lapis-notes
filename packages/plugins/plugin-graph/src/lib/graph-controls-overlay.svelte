<script lang="ts">
  import * as Accordion from "@lapismd/design-core/shadcn/accordion";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Input } from "@lapismd/design-core/shadcn/input";
  import { Slider } from "@lapismd/design-core/shadcn/slider";
  import { Switch } from "@lapismd/design-core/shadcn/switch";
  import LocateFixed from "@lucide/svelte/icons/locate-fixed";
  import Minus from "@lucide/svelte/icons/minus";
  import Plus from "@lucide/svelte/icons/plus";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import RotateCcw from "@lucide/svelte/icons/rotate-ccw";
  import Settings from "@lucide/svelte/icons/settings";
  import X from "@lucide/svelte/icons/x";
  import type { GraphSettings, GraphSettingsPatch } from "./graph-types";

  let {
    isLocal,
    settings,
    statsText,
    statusText,
    statusKind,
    onFocusActiveFile,
    onZoomIn,
    onZoomOut,
    onResetView,
    onRefreshGraph,
    onResetDefaults,
    onSettingsPatch,
  }: {
    isLocal: boolean;
    settings: GraphSettings;
    statsText: string;
    statusText: string;
    statusKind: "loading" | "error" | null;
    onFocusActiveFile: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onResetView: () => void;
    onRefreshGraph: () => void;
    onResetDefaults: () => void;
    onSettingsPatch: (patch: GraphSettingsPatch) => void;
  } = $props();

  let settingsOpen = $state(false);
  let openSections = $state<string[]>([]);

  function formatValue(value: number): string {
    if (Number.isInteger(value)) {
      return String(value);
    }

    const digits = Math.abs(value) < 1 ? 2 : 1;
    return value
      .toFixed(digits)
      .replace(/\.0+$/, "")
      .replace(/(\.\d*[1-9])0+$/, "$1");
  }

  function updateSlider(
    nextValue: number,
    createPatch: (value: number) => GraphSettingsPatch,
  ): void {
    if (Number.isFinite(nextValue)) {
      onSettingsPatch(createPatch(nextValue));
    }
  }

  const toolbarIconStyle = "width: 12px; height: 12px";
</script>

<div
  class="graph-view__layout"
  data-ui-component="graph-controls"
  data-ui-part="layout"
>
  <div
    data-graph-surface
    data-ui-part="surface"
    class="graph-view__surface"
  ></div>

  {#if statsText && !isLocal}
    <div class="graph-view__stats" data-ui-part="stats">
      <span class="graph-view__stats-badge">
        {statsText}
      </span>
    </div>
  {/if}

  {#if statusText}
    <div
      class="graph-view__status"
      data-ui-part="status"
      data-state={statusKind}
      role={statusKind === "error" ? "alert" : "status"}
    >
      {statusText}
    </div>
  {/if}

  <div class="graph-controls-toolbar" data-ui-part="toolbar">
    {#if !isLocal}
      <Button
        variant="ghost"
        size="icon"
        class="graph-controls-toolbar-button"
        aria-label="Zoom in"
        title="Zoom in"
        onclick={onZoomIn}
      >
        <Plus style={toolbarIconStyle} />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        class="graph-controls-toolbar-button"
        aria-label="Reset view"
        title="Reset view"
        onclick={onResetView}
      >
        <RotateCcw style={toolbarIconStyle} />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        class="graph-controls-toolbar-button"
        aria-label="Zoom out"
        title="Zoom out"
        onclick={onZoomOut}
      >
        <Minus style={toolbarIconStyle} />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        class="graph-controls-toolbar-button"
        aria-label="Focus active file"
        title="Focus active file"
        onclick={onFocusActiveFile}
      >
        <LocateFixed style={toolbarIconStyle} />
      </Button>
    {/if}

    <Button
      variant="ghost"
      size="icon"
      class={`graph-controls-toolbar-button${isLocal ? "" : " graph-controls-toolbar-button--last"}`}
      aria-label="Toggle graph settings"
      aria-expanded={settingsOpen}
      aria-haspopup="dialog"
      title="Toggle graph settings"
      onclick={() => {
        settingsOpen = !settingsOpen;
      }}
    >
      <Settings style={toolbarIconStyle} />
    </Button>
  </div>

  {#if settingsOpen}
    <div
      role="dialog"
      aria-label="Graph settings"
      class="graph-controls-panel"
      data-ui-part="settings-panel"
    >
      <Accordion.Root
        type="multiple"
        bind:value={openSections}
        class="graph-controls-sections"
      >
        <Accordion.Item value="filters">
          <div class="graph-controls-section-header">
            <Accordion.Trigger
              style="height: 40px; min-height: 40px;"
              indicatorPosition="start"
              class="graph-controls-trigger graph-controls-trigger--actions"
            >
              <span>Filters</span>
            </Accordion.Trigger>

            <div class="graph-controls-trigger__actions">
              <Button
                variant="ghost"
                size="icon"
                class="graph-controls-header-button"
                aria-label="Refresh graph"
                title="Refresh graph"
                onclick={onRefreshGraph}
              >
                <RefreshCw class="graph-controls-icon" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                class="graph-controls-header-button"
                aria-label="Reset defaults"
                title="Reset defaults"
                onclick={onResetDefaults}
              >
                <RotateCcw class="graph-controls-icon" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                class="graph-controls-header-button"
                aria-label="Close settings"
                title="Close settings"
                onclick={() => {
                  settingsOpen = false;
                }}
              >
                <X class="graph-controls-icon" />
              </Button>
            </div>
          </div>

          <Accordion.Content class="graph-controls-section-content">
            <div class="graph-controls-field-list">
              <div>
                <Input
                  aria-label="Search files"
                  placeholder="Search files"
                  class="graph-controls-input"
                  bind:value={
                    () => settings.filters.searchQuery,
                    (value) =>
                      onSettingsPatch({ filters: { searchQuery: value } })
                  }
                />
              </div>

              <div class="graph-controls-toggle-row">
                <span class="graph-controls-label">Show tags</span>
                <Switch
                  aria-label="Show tags"
                  bind:checked={
                    () => settings.filters.showTags,
                    (checked) =>
                      onSettingsPatch({ filters: { showTags: checked } })
                  }
                />
              </div>

              <div class="graph-controls-toggle-row">
                <span class="graph-controls-label">Show attachments</span>
                <Switch
                  aria-label="Show attachments"
                  bind:checked={
                    () => settings.filters.showAttachments,
                    (checked) =>
                      onSettingsPatch({ filters: { showAttachments: checked } })
                  }
                />
              </div>

              <div class="graph-controls-toggle-row">
                <span class="graph-controls-label">Existing files only</span>
                <Switch
                  aria-label="Existing files only"
                  bind:checked={
                    () => settings.filters.existingFilesOnly,
                    (checked) =>
                      onSettingsPatch({
                        filters: { existingFilesOnly: checked },
                      })
                  }
                />
              </div>

              <div class="graph-controls-toggle-row">
                <span class="graph-controls-label">Show orphans</span>
                <Switch
                  aria-label="Show orphans"
                  bind:checked={
                    () => settings.filters.showOrphans,
                    (checked) =>
                      onSettingsPatch({ filters: { showOrphans: checked } })
                  }
                />
              </div>
            </div>
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value="display">
          <Accordion.Trigger
            style="height: 40px; min-height: 40px;"
            indicatorPosition="start"
            class="graph-controls-trigger"
          >
            <div class="graph-controls-trigger__content">
              <span>Display</span>
            </div>
          </Accordion.Trigger>

          <Accordion.Content class="graph-controls-section-content">
            <div class="graph-controls-field-list">
              <div class="graph-controls-toggle-row">
                <span class="graph-controls-label">Show arrows</span>
                <Switch
                  aria-label="Show arrows"
                  bind:checked={
                    () => settings.display.showArrows,
                    (checked) =>
                      onSettingsPatch({ display: { showArrows: checked } })
                  }
                />
              </div>

              <div class="graph-controls-slider">
                <div class="graph-controls-slider__header">
                  <span>Label zoom threshold</span>
                  <span class="graph-controls-slider__value"
                    >{formatValue(settings.display.textFadeThreshold)}</span
                  >
                </div>
                <Slider
                  aria-label="Label zoom threshold"
                  type="single"
                  min={0.4}
                  max={1.6}
                  step={0.05}
                  class="graph-controls-slider__control"
                  bind:value={
                    () => settings.display.textFadeThreshold,
                    (value) =>
                      updateSlider(value, (next) => ({
                        display: { textFadeThreshold: next },
                      }))
                  }
                />
              </div>

              <div class="graph-controls-slider">
                <div class="graph-controls-slider__header">
                  <span>Node size</span>
                  <span class="graph-controls-slider__value"
                    >{formatValue(settings.display.nodeSize)}</span
                  >
                </div>
                <Slider
                  aria-label="Node size"
                  type="single"
                  min={4}
                  max={18}
                  step={1}
                  class="graph-controls-slider__control"
                  bind:value={
                    () => settings.display.nodeSize,
                    (value) =>
                      updateSlider(value, (next) => ({
                        display: { nodeSize: next },
                      }))
                  }
                />
              </div>

              <div class="graph-controls-slider">
                <div class="graph-controls-slider__header">
                  <span>Link thickness</span>
                  <span class="graph-controls-slider__value"
                    >{formatValue(settings.display.linkThickness)}</span
                  >
                </div>
                <Slider
                  aria-label="Link thickness"
                  type="single"
                  min={1}
                  max={4}
                  step={0.25}
                  class="graph-controls-slider__control"
                  bind:value={
                    () => settings.display.linkThickness,
                    (value) =>
                      updateSlider(value, (next) => ({
                        display: { linkThickness: next },
                      }))
                  }
                />
              </div>

              <div class="graph-controls-slider">
                <div class="graph-controls-slider__header">
                  <span>Scroll zoom sensitivity</span>
                  <span class="graph-controls-slider__value"
                    >{formatValue(settings.display.wheelZoomSensitivity)}</span
                  >
                </div>
                <Slider
                  aria-label="Scroll zoom sensitivity"
                  type="single"
                  min={0.4}
                  max={1.6}
                  step={0.05}
                  class="graph-controls-slider__control"
                  bind:value={
                    () => settings.display.wheelZoomSensitivity,
                    (value) =>
                      updateSlider(value, (next) => ({
                        display: { wheelZoomSensitivity: next },
                      }))
                  }
                />
              </div>
            </div>
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value="forces">
          <Accordion.Trigger
            style="height: 40px; min-height: 40px;"
            indicatorPosition="start"
            class="graph-controls-trigger"
          >
            <div class="graph-controls-trigger__content">
              <span>Forces</span>
            </div>
          </Accordion.Trigger>

          <Accordion.Content class="graph-controls-section-content">
            <div class="graph-controls-field-list">
              <div class="graph-controls-slider">
                <div class="graph-controls-slider__header">
                  <span>Center force</span>
                  <span class="graph-controls-slider__value"
                    >{formatValue(settings.forces.centerForce)}</span
                  >
                </div>
                <Slider
                  aria-label="Center force"
                  type="single"
                  min={0}
                  max={0.3}
                  step={0.01}
                  class="graph-controls-slider__control"
                  bind:value={
                    () => settings.forces.centerForce,
                    (value) =>
                      updateSlider(value, (next) => ({
                        forces: { centerForce: next },
                      }))
                  }
                />
              </div>

              <div class="graph-controls-slider">
                <div class="graph-controls-slider__header">
                  <span>Repel force</span>
                  <span class="graph-controls-slider__value"
                    >{formatValue(settings.forces.repelForce)}</span
                  >
                </div>
                <Slider
                  aria-label="Repel force"
                  type="single"
                  min={80}
                  max={480}
                  step={10}
                  class="graph-controls-slider__control"
                  bind:value={
                    () => settings.forces.repelForce,
                    (value) =>
                      updateSlider(value, (next) => ({
                        forces: { repelForce: next },
                      }))
                  }
                />
              </div>

              <div class="graph-controls-slider">
                <div class="graph-controls-slider__header">
                  <span>Link force</span>
                  <span class="graph-controls-slider__value"
                    >{formatValue(settings.forces.linkForce)}</span
                  >
                </div>
                <Slider
                  aria-label="Link force"
                  type="single"
                  min={0.05}
                  max={1}
                  step={0.05}
                  class="graph-controls-slider__control"
                  bind:value={
                    () => settings.forces.linkForce,
                    (value) =>
                      updateSlider(value, (next) => ({
                        forces: { linkForce: next },
                      }))
                  }
                />
              </div>

              <div class="graph-controls-slider">
                <div class="graph-controls-slider__header">
                  <span>Link distance</span>
                  <span class="graph-controls-slider__value"
                    >{formatValue(settings.forces.linkDistance)}</span
                  >
                </div>
                <Slider
                  aria-label="Link distance"
                  type="single"
                  min={40}
                  max={220}
                  step={5}
                  class="graph-controls-slider__control"
                  bind:value={
                    () => settings.forces.linkDistance,
                    (value) =>
                      updateSlider(value, (next) => ({
                        forces: { linkDistance: next },
                      }))
                  }
                />
              </div>
            </div>
          </Accordion.Content>
        </Accordion.Item>

        {#if isLocal}
          <Accordion.Item value="local-graph">
            <Accordion.Trigger
              style="height: 40px; min-height: 40px;"
              indicatorPosition="start"
              class="graph-controls-trigger"
            >
              <div
                class="graph-controls-trigger__content"
              >
                <span>Local graph</span>
              </div>
            </Accordion.Trigger>

            <Accordion.Content class="graph-controls-section-content">
              <div class="graph-controls-slider">
                <div class="graph-controls-slider__header">
                  <span>Depth</span>
                  <span class="graph-controls-slider__value"
                    >{formatValue(settings.localGraph.depth)}</span
                  >
                </div>
                <Slider
                  aria-label="Depth"
                  type="single"
                  min={1}
                  max={6}
                  step={1}
                  class="graph-controls-slider__control"
                  bind:value={
                    () => settings.localGraph.depth,
                    (value) =>
                      updateSlider(value, (next) => ({
                        localGraph: { depth: next },
                      }))
                  }
                />
              </div>
            </Accordion.Content>
          </Accordion.Item>
        {/if}
      </Accordion.Root>
    </div>
  {/if}
</div>
