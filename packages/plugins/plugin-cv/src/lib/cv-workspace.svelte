<script lang="ts">
  import { onDestroy, tick, untrack } from "svelte";
  import BookOpenIcon from "@lucide/svelte/icons/book-open";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import { FormToolbar, StructuredForm, YamlEditor } from "@lapismd/design-core/forms";
  import { createFormController, type FormController } from "@lapismd/design-core/forms/core";
  import * as Alert from "@lapismd/design-core/shadcn/alert";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Resizable from "@lapismd/design-core/shadcn/resizable";
  import * as ScrollArea from "@lapismd/design-core/shadcn/scroll-area";
  import { Switch } from "@lapismd/design-core/shadcn/switch";
  import * as Tabs from "@lapismd/design-core/shadcn/tabs";
  import { AppShell, AppShellController } from "@lapismd/design-core/shell";
  import { compileCvSource } from "$lib/cv/compile";
  import { toCompleteCvSource, toCvSource } from "$lib/cv/adapter";
  import {
    clampZoom,
    normalizePreviewFormat,
    normalizePreviewMode,
    type CvPreviewMode,
    type CvPreviewModeInput,
  } from "$lib/cv/cv-options";
  import { renderWebArtifacts, disposeWebRenderWorkers } from "$lib/cv/wasm-render-client";
  import type { TypstPreviewFormat, WorkerArtifact } from "$lib/cv/web-artifacts";
  import { downloadWorkerArtifact } from "$lib/cv/cv-artifact-actions";
  import { parseCvYaml, stringifyCvSource } from "$lib/cv/parse";
  import {
    applyYamlEdit,
    cloneSource,
    serializeFragment,
  } from "$lib/form/complete-cv-form.model";
  import {
    completeCvConfig,
    completeDesignConfig,
    completeLocaleConfig,
    completeSettingsConfig,
    themeOptions,
  } from "$lib/form/complete-cv-form.typed-config";
  import type {
    CompleteCvSource,
    CvFragment,
    CvStoryTab,
    DesignFragment,
    LocaleFragment,
    SettingsFragment,
  } from "$lib/form/complete-cv-form.types";
  import CvPreview from "./cv-preview.svelte";
  import CvPreviewControls from "./cv-preview-controls.svelte";
  import CvThemeControls from "./cv-theme-controls.svelte";
  import "./form/cv-form.css";

  let {
    yamlText = "",
    filePath = "",
    embedded = false,
    initialPreviewMode = "rendercv",
    initialPreviewFormat,
    onYamlChange,
    onDownloadPdf,
    onSavePdfToVault,
  }: {
    yamlText?: string;
    filePath?: string;
    /** When true, skip AppShell's `<main>` so a workspace leaf keeps one landmark. */
    embedded?: boolean;
    initialPreviewMode?: CvPreviewModeInput;
    initialPreviewFormat?: TypstPreviewFormat;
    onYamlChange?: (next: string) => void | Promise<void>;
    onDownloadPdf?: (artifact: WorkerArtifact) => void | Promise<void>;
    onSavePdfToVault?: (artifact: WorkerArtifact) => string | void | Promise<string | void>;
  } = $props();

  const tabs: Array<{ value: CvStoryTab; label: string }> = [
    { value: "cv", label: "CV" },
    { value: "design", label: "Design" },
    { value: "locale", label: "Locale" },
    { value: "settings", label: "Settings" },
  ];

  const emptySource: CompleteCvSource = { cv: { sections: [] } };
  const shellController = new AppShellController();

  let source = $state<CompleteCvSource>(cloneSource(emptySource));
  let parseError = $state<string | null>(null);
  let rawYamlDraft = $state(untrack(() => yamlText));
  let saveError = $state<string | null>(null);
  let saveVersion = 0;
  let activeTab = $state<CvStoryTab>("cv");
  let yamlMode = $state(false);
  let mobileWorkspaceTab = $state<"edit" | "preview">("edit");
  let previewMode = $state<CvPreviewMode>(
    untrack(() => normalizePreviewMode(initialPreviewMode)),
  );
  let previewFormat = $state<TypstPreviewFormat>(
    untrack(() => normalizePreviewFormat(initialPreviewMode, initialPreviewFormat)),
  );
  let markdownMode = $state<"source" | "preview">("preview");
  let zoom = $state(1);
  let yamlFragments = $state<Record<CvStoryTab, string>>({
    cv: "",
    design: "",
    locale: "",
    settings: "",
  });
  let yamlErrors = $state<Record<CvStoryTab, string | null>>({
    cv: null,
    design: null,
    locale: null,
    settings: null,
  });
  let lastEmitted = $state("");
  let artifacts = $state<WorkerArtifact[]>([]);
  let previewError = $state<string | null>(null);
  let previewPending = $state(false);
  let exportError = $state<string | null>(null);
  let exportStatus = $state<string | null>(null);
  let previewViewport: HTMLElement | null = null;
  let renderVersion = 0;

  const cvController = createFormController<CvFragment>({
    defaultValues: emptySource.cv,
  });
  const designController = createFormController<DesignFragment>({
    defaultValues: {},
  });
  const localeController = createFormController<LocaleFragment>({
    defaultValues: {},
  });
  const settingsController = createFormController<SettingsFragment>({
    defaultValues: {},
  });

  const activeController = $derived(
    {
      cv: cvController,
      design: designController,
      locale: localeController,
      settings: settingsController,
    }[activeTab] as FormController<Record<string, unknown>>,
  );
  const collapsedAll = $derived(activeController.allDisclosuresCollapsed());

  const compiled = $derived.by(() => {
    if (parseError) return null;
    try {
      return compileCvSource(toCvSource(source));
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  const compiledHtml = $derived(
    compiled && "html" in compiled ? compiled.html : "",
  );
  const compiledTypst = $derived(
    compiled && "typst" in compiled ? compiled.typst : "",
  );
  const compiledMarkdown = $derived(
    compiled && "markdown" in compiled ? compiled.markdown : "",
  );
  const compiledError = $derived(
    compiled && "error" in compiled ? compiled.error : null,
  );
  const pdfArtifact = $derived(
    artifacts.find((artifact) => artifact.extension === "pdf"),
  );

  function yamlFor(next: CompleteCvSource): Record<CvStoryTab, string> {
    return {
      cv: serializeFragment(next, "cv"),
      design: serializeFragment(next, "design"),
      locale: serializeFragment(next, "locale"),
      settings: serializeFragment(next, "settings"),
    };
  }

  function applyDocument(text: string): boolean {
    rawYamlDraft = text;
    const parsed = parseCvYaml(text);
    if (!parsed.ok) {
      parseError = parsed.error;
      return false;
    }
    const next = toCompleteCvSource(parsed.source);
    parseError = null;
    source = next;
    yamlFragments = yamlFor(next);
    yamlErrors = { cv: null, design: null, locale: null, settings: null };
    cvController.reset(next.cv, { emit: false });
    designController.reset(next.design ?? {}, { emit: false });
    localeController.reset(next.locale ?? {}, { emit: false });
    settingsController.reset(next.settings ?? {}, { emit: false });
    return true;
  }

  function emitDocument(next: CompleteCvSource): void {
    const serialized = stringifyCvSource(toCvSource(next));
    lastEmitted = serialized;
    const version = ++saveVersion;
    try {
      const pending = onYamlChange?.(serialized);
      if (!pending || typeof pending.then !== "function") {
        saveError = null;
        return;
      }
      void pending
        .then(() => {
          if (version === saveVersion) saveError = null;
        })
        .catch((error: unknown) => {
          if (version !== saveVersion) return;
          saveError = error instanceof Error ? error.message : String(error);
        });
    } catch (error) {
      saveError = error instanceof Error ? error.message : String(error);
    }
  }

  function editInvalidDocument(text: string): void {
    if (!applyDocument(text)) return;
    emitDocument(source);
  }

  function commit(next: CompleteCvSource): void {
    source = next;
    yamlFragments = yamlFor(next);
    yamlErrors = { cv: null, design: null, locale: null, settings: null };
    emitDocument(next);
  }

  function commitFragment<TTab extends Exclude<CvStoryTab, "cv">>(
    tab: TTab,
    value: NonNullable<CompleteCvSource[TTab]>,
  ): void {
    commit({ ...source, [tab]: value });
  }

  function editYaml(tab: CvStoryTab, text: string): void {
    yamlFragments = { ...yamlFragments, [tab]: text };
    const result = applyYamlEdit(source, tab, text);
    yamlErrors = { ...yamlErrors, [tab]: result.error };
    if (!result.applied) return;
    source = result.source;
    emitDocument(result.source);
  }

  function setTheme(theme: string): void {
    const design = { ...(source.design ?? {}), theme };
    designController.reset(design, { emit: false });
    commitFragment("design", design);
  }

  function shiftTheme(direction: -1 | 1): void {
    const values = themeOptions.map((option) => option.value);
    if (!values.length) return;
    const current = source.design?.theme ?? "moderncv";
    const index = Math.max(values.indexOf(current), 0);
    const next = values[(index + direction + values.length) % values.length];
    setTheme(next);
  }

  function previewScroll(node: HTMLElement) {
    const viewport =
      node.closest<HTMLElement>("[data-ui-part='scroll-area-viewport']") ?? node;
    previewViewport = viewport;
    function onWheel(event: WheelEvent) {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      setZoom(zoom * Math.exp(-event.deltaY * 0.002));
    }
    viewport.addEventListener("wheel", onWheel, { passive: false });
    return {
      destroy() {
        viewport.removeEventListener("wheel", onWheel);
        if (previewViewport === viewport) previewViewport = null;
      },
    };
  }

  function setZoom(next: number): void {
    const normalized = clampZoom(next);
    if (normalized === zoom) return;
    const viewport = previewViewport;
    const horizontalAnchor = viewport
      ? (viewport.scrollLeft + viewport.clientWidth / 2) /
        Math.max(viewport.scrollWidth, viewport.clientWidth, 1)
      : 0.5;
    const verticalAnchor = viewport
      ? (viewport.scrollTop + viewport.clientHeight / 2) /
        Math.max(viewport.scrollHeight, viewport.clientHeight, 1)
      : 0.5;
    zoom = normalized;
    if (!viewport) return;
    void tick().then(() => {
      if (previewViewport !== viewport) return;
      viewport.scrollLeft = Math.max(
        0,
        horizontalAnchor * viewport.scrollWidth - viewport.clientWidth / 2,
      );
      viewport.scrollTop = Math.max(
        0,
        verticalAnchor * viewport.scrollHeight - viewport.clientHeight / 2,
      );
    });
  }

  async function downloadPdf(): Promise<void> {
    if (!pdfArtifact) return;
    exportError = null;
    exportStatus = null;
    try {
      await (onDownloadPdf ?? downloadWorkerArtifact)(pdfArtifact);
      exportStatus = `Downloading ${pdfArtifact.filename}`;
    } catch (error) {
      exportError = error instanceof Error ? error.message : String(error);
    }
  }

  async function savePdfToVault(): Promise<void> {
    if (!pdfArtifact || !onSavePdfToVault) return;
    exportError = null;
    exportStatus = null;
    try {
      const path = await onSavePdfToVault(pdfArtifact);
      exportStatus = path
        ? `Saved PDF to ${path}`
        : `Saved ${pdfArtifact.filename} to the vault`;
    } catch (error) {
      exportError = error instanceof Error ? error.message : String(error);
    }
  }

  $effect.pre(() => {
    const incoming = yamlText;
    untrack(() => {
      if (incoming === lastEmitted) return;
      lastEmitted = incoming;
      applyDocument(incoming);
    });
  });

  $effect(() => {
    const format = previewFormat;
    const yamlError = parseError;
    const compileError = compiledError;
    if (yamlError) {
      artifacts = [];
      previewError = compileError;
      previewPending = false;
      return;
    }
    let current: CompleteCvSource;
    try {
      current = $state.snapshot(source) as CompleteCvSource;
    } catch (error) {
      artifacts = [];
      previewError =
        (error instanceof Error && error.message) || "Could not snapshot CV source.";
      previewPending = false;
      return;
    }
    const version = ++renderVersion;
    previewPending = true;
    untrack(() => {
      void renderWebArtifacts(toCvSource(current), version, 3, format)
        .then((result) => {
          if (version !== renderVersion) return;
          artifacts = result.artifacts;
          const hasPages = result.artifacts.some(
            (artifact) => artifact.preview && artifact.extension === format,
          );
          previewError =
            result.error ||
            (hasPages ? compileError : "Typst did not return preview pages.");
          previewPending = false;
        })
        .catch((error: unknown) => {
          if (version !== renderVersion) return;
          artifacts = [];
          previewError =
            (error instanceof Error && error.message) ||
            String(error) ||
            "Typst preview failed.";
          previewPending = false;
        });
    });
  });

  onDestroy(() => {
    disposeWebRenderWorkers();
  });
</script>

<div
  class="complete-cv-shell cv-workspace"
  data-ui-component="cv-workspace"
  data-testid="cv-workspace"
  data-file-path={filePath}
>
  {#snippet workspace()}
    <div class="complete-cv-page">
            <div class="complete-cv-sticky-controls">
              <FormToolbar
                {collapsedAll}
                collapseLabel={`Collapse all ${tabs.find((tab) => tab.value === activeTab)?.label ?? activeTab} groups`}
                expandLabel={`Expand all ${tabs.find((tab) => tab.value === activeTab)?.label ?? activeTab} groups`}
                onToggleCollapse={() =>
                  collapsedAll ? activeController.expandAll() : activeController.collapseAll()}
              >
                {#snippet leading()}
                  <span class="complete-cv-toolbar-title">{source.cv.name ?? "CV"}</span>
                {/snippet}
                {#snippet actions()}
                  <div class="complete-cv-yaml-toggle" data-testid="cv-yaml-toggle">
                    <Switch id="cv-yaml-mode" bind:checked={yamlMode} aria-label="YAML" />
                    <label for="cv-yaml-mode">YAML</label>
                  </div>
                  <CvPreviewControls
                    bind:previewMode
                    bind:previewFormat
                    {zoom}
                    pdfAvailable={Boolean(pdfArtifact)}
                    canSaveToVault={Boolean(onSavePdfToVault)}
                    onZoomChange={setZoom}
                    onDownloadPdf={downloadPdf}
                    onSavePdfToVault={savePdfToVault}
                  />
                {/snippet}
              </FormToolbar>

              <Tabs.Root bind:value={activeTab} class="complete-cv-tabs">
                <div class="complete-cv-tabs__header">
                  <ScrollArea.Root
                    class="complete-cv-tabs__scroll"
                    orientation="horizontal"
                    aria-label="CV form area navigation"
                    data-testid="cv-form-area-scroll"
                  >
                    <div class="complete-cv-tabs__scroll-content">
                      <Tabs.List variant="line" aria-label="CV form areas">
                        {#each tabs as tab (tab.value)}
                          <Tabs.Trigger value={tab.value}>{tab.label}</Tabs.Trigger>
                        {/each}
                      </Tabs.List>
                      {#if previewMode === "rendercv-md"}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          class="complete-cv-markdown-mode"
                          aria-label={markdownMode === "preview"
                            ? "Current view: preview\nClick to view source"
                            : "Current view: source\nClick to preview"}
                          title={markdownMode === "preview"
                            ? "Current view: preview\nClick to view source"
                            : "Current view: source\nClick to preview"}
                          data-testid="cv-markdown-mode-toggle"
                          onclick={() =>
                            (markdownMode = markdownMode === "preview" ? "source" : "preview")}
                        >
                          {#if markdownMode === "preview"}
                            <PencilIcon />
                          {:else}
                            <BookOpenIcon />
                          {/if}
                        </Button>
                      {/if}
                      {#if activeTab === "cv"}
                        <CvThemeControls
                          theme={source.design?.theme ?? "moderncv"}
                          onSetTheme={setTheme}
                          onShiftTheme={shiftTheme}
                        />
                      {/if}
                    </div>
                  </ScrollArea.Root>
                </div>

                <div class="complete-cv-workspace-tabs">
                  <div class="complete-cv-mobile-tabs" data-testid="cv-mobile-workspace-tabs">
                    <div role="tablist" aria-label="CV workspace column">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={mobileWorkspaceTab === "edit"}
                        data-state={mobileWorkspaceTab === "edit" ? "active" : "inactive"}
                        onclick={() => (mobileWorkspaceTab = "edit")}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={mobileWorkspaceTab === "preview"}
                        data-state={mobileWorkspaceTab === "preview" ? "active" : "inactive"}
                        onclick={() => (mobileWorkspaceTab = "preview")}
                      >
                        Preview
                      </button>
                    </div>
                  </div>
                  <Resizable.PaneGroup direction="horizontal" class="complete-cv-editor-split">
                    <Resizable.Pane
                      defaultSize={48}
                      minSize={30}
                      class="complete-cv-form-resizable-pane"
                      data-mobile-pane="editor"
                      data-mobile-pane-active={mobileWorkspaceTab === "preview" ? undefined : ""}
                    >
                      <div class="complete-cv-editor-stack">
                        {#if yamlMode}
                          <aside
                            class="complete-cv-yaml-pane"
                            aria-label="YAML source"
                            data-testid={`yaml-${activeTab}`}
                          >
                            <YamlEditor
                              value={yamlFragments[activeTab]}
                              invalid={Boolean(yamlErrors[activeTab])}
                              frameless
                              minHeight="100%"
                              ariaLabel="YAML"
                              editorId={`cv-${activeTab}-yaml`}
                              onChange={(text) => editYaml(activeTab, text)}
                            />
                            {#if yamlErrors[activeTab]}
                              <Alert.Root
                                variant="destructive"
                                role="alert"
                                data-testid="yaml-error"
                              >
                                <Alert.Title>YAML not applied</Alert.Title>
                                <Alert.Description>{yamlErrors[activeTab]}</Alert.Description>
                              </Alert.Root>
                            {/if}
                          </aside>
                        {:else}
                          <ScrollArea.Root
                            class="complete-cv-form-pane"
                            orientation="vertical"
                            type="always"
                            data-testid={`structured-${activeTab}`}
                          >
                            <div class="complete-cv-form-pane__content">
                              {#if activeTab === "cv"}
                                <StructuredForm
                                  value={source.cv}
                                  config={completeCvConfig}
                                  controller={cvController}
                                  onChange={(cv) => commit({ ...source, cv })}
                                />
                              {:else if activeTab === "design"}
                                <StructuredForm
                                  value={source.design ?? {}}
                                  config={completeDesignConfig}
                                  controller={designController}
                                  onChange={(value) => commitFragment("design", value)}
                                />
                              {:else if activeTab === "locale"}
                                <StructuredForm
                                  value={source.locale ?? {}}
                                  config={completeLocaleConfig}
                                  controller={localeController}
                                  onChange={(value) => commitFragment("locale", value)}
                                />
                              {:else}
                                <StructuredForm
                                  value={source.settings ?? {}}
                                  config={completeSettingsConfig}
                                  controller={settingsController}
                                  onChange={(value) => commitFragment("settings", value)}
                                />
                              {/if}
                            </div>
                          </ScrollArea.Root>
                        {/if}
                      </div>
                    </Resizable.Pane>

                    <Resizable.Handle
                      withHandle
                      variant="prominent"
                      class="complete-cv-resize-handle"
                      aria-label="Resize form and preview panels"
                      data-testid="complete-cv-cv-resize-handle"
                    />

                    <Resizable.Pane
                      defaultSize={52}
                      minSize={30}
                      class="complete-cv-preview-resizable-pane"
                      data-mobile-pane="preview"
                      data-mobile-pane-active={mobileWorkspaceTab === "preview" ? "" : undefined}
                    >
                      <ScrollArea.Root
                        class="complete-cv-preview-pane"
                        orientation="both"
                        type="always"
                        data-testid="cv-preview-pane"
                      >
                        <div
                          use:previewScroll
                          class="complete-cv-preview-scroll"
                          data-testid="preview-scroll"
                          data-preview-mode={previewMode}
                        >
                          <CvPreview
                            html={compiledHtml}
                            typst={compiledTypst}
                            markdown={compiledMarkdown}
                            {artifacts}
                            error={previewMode === "rendercv" ? previewError : compiledError}
                            mode={previewMode}
                            {markdownMode}
                            {previewFormat}
                            {zoom}
                            pending={previewMode === "rendercv" && previewPending}
                          />
                        </div>
                      </ScrollArea.Root>
                    </Resizable.Pane>
                  </Resizable.PaneGroup>
                </div>
              </Tabs.Root>
            </div>
    </div>
  {/snippet}

  {#if parseError}
    <div class="cv-workspace__fallback">
      <Alert.Root variant="destructive" role="alert" data-testid="cv-parse-error">
        <Alert.Title>CV YAML is invalid</Alert.Title>
        <Alert.Description>{parseError}</Alert.Description>
      </Alert.Root>
      <div class="cv-workspace__raw-editor" data-testid="cv-raw-yaml">
        <YamlEditor
          value={rawYamlDraft}
          invalid
          frameless
          minHeight="100%"
          ariaLabel="CV YAML source"
          editorId="cv-document-yaml"
          onChange={editInvalidDocument}
        />
      </div>
    </div>
  {:else if embedded}
    <div class="complete-cv-body" data-ui-part="body">
      {@render workspace()}
    </div>
  {:else}
    <AppShell.Root controller={shellController} mobileBreakpoint={640}>
      <AppShell.Main>
        <AppShell.Body layout="regions" label="CV workspace" class="complete-cv-body">
          {@render workspace()}
        </AppShell.Body>
      </AppShell.Main>
    </AppShell.Root>
  {/if}

  {#if saveError}
    <div class="cv-workspace__save-error">
      <Alert.Root
        variant="destructive"
        role="alert"
        data-testid="cv-save-error"
      >
        <Alert.Title>CV changes were not saved</Alert.Title>
        <Alert.Description>{saveError}</Alert.Description>
      </Alert.Root>
    </div>
  {/if}

  {#if exportError}
    <div class="cv-workspace__save-error">
      <Alert.Root variant="destructive" role="alert" data-testid="cv-export-error">
        <Alert.Title>PDF export failed</Alert.Title>
        <Alert.Description>{exportError}</Alert.Description>
      </Alert.Root>
    </div>
  {/if}

  {#if exportStatus}
    <p class="cv-workspace__export-status" role="status" data-testid="cv-export-status">
      {exportStatus}
    </p>
  {/if}
</div>

<style>
  .cv-workspace {
    --ui-shell-height: 100%;
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    width: 100%;
    height: 100%;
    max-height: 100%;
    min-height: 0;
    overflow: hidden;
  }

  .cv-workspace__fallback {
    display: flex;
    height: 100%;
    min-height: 0;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    overflow: hidden;
  }

  .cv-workspace__raw-editor {
    display: flex;
    min-height: 0;
    flex: 1 1 auto;
    overflow: hidden;
  }

  .cv-workspace__raw-editor > :global([data-ui-component="yaml-editor"]) {
    min-height: 0;
    flex: 1 1 auto;
  }

  .cv-workspace__save-error {
    position: absolute;
    z-index: var(--ui-workspace-overlay-z-index, 50);
    right: 0.75rem;
    bottom: 0.75rem;
    max-width: min(30rem, calc(100% - 1.5rem));
  }

  .cv-workspace__export-status {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
