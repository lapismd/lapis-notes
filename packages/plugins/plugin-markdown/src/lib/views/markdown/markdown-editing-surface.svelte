<script lang="ts">
  import {
    applyMiraMarkdownAction,
    openImageFilePicker,
    type MiraEditorSelection,
  } from "@lapismd/mira/core";
  import {
    MiraEditorToolbar,
    type MiraEditorToolbarActionContext,
  } from "@lapismd/mira-editor";
  import type {
    App,
    Editor,
    WorkspaceLeaf,
  } from "@lapis-notes/api";
  import { EmbeddedEditorSurface } from "@lapis-notes/api/editor";
  import {
    readMarkdownMiraEditorSettings,
    resolveMarkdownMiraExtensions,
  } from "../../mira/extensions";

  let {
    app,
    leaf,
    editor,
    mode,
    onModeChange,
  }: {
    app: App;
    leaf: WorkspaceLeaf;
    editor: Editor;
    mode: "source" | "live-preview";
    onModeChange: (mode: "source" | "live-preview" | "preview") => void;
  } = $props();

  const resolved = $derived.by(() => {
    void app.configuration.getConfiguration();
    return resolveMarkdownMiraExtensions(app);
  });
  const editorSettings = $derived.by(() => {
    void app.configuration.getConfiguration();
    return readMarkdownMiraEditorSettings(app);
  });
  const indentGuides = $derived(
    Boolean(
      app.configuration
        .getConfiguration()
        .get("editor.display.showIndentationGuides", true),
    ),
  );
  const indentWidth = $derived(
    Number(
      app.configuration
        .getConfiguration()
        .get("editor.behaviour.indentVisualWidth", 2),
    ),
  );
  const indentWithTabs = $derived(
    Boolean(
      app.configuration
        .getConfiguration()
        .get("editor.behaviour.indentUsingTabs", true),
    ),
  );

  function selection(): MiraEditorSelection | null {
    return editor.listSelections()[0] ?? null;
  }

  function toolbarContext(): MiraEditorToolbarActionContext {
    return {
      value: editor.getValue(),
      mode,
      readonly: false,
      focus: () => editor.focus(),
      getMarkdown: () => editor.getValue(),
      getMode: () => mode,
      getIndentGuides: () => indentGuides,
      getIndentWidth: () => indentWidth,
      getIndentWithTabs: () => indentWithTabs,
      getSelection: selection,
      applyMarkdownAction: (action) =>
        applyMiraMarkdownAction(
          editor.view as unknown as Parameters<
            typeof applyMiraMarkdownAction
          >[0],
          action,
        ),
      insertMarkdown: (markdown) => editor.replaceSelection(markdown),
      insertImage: () =>
        openImageFilePicker(
          editor.view as unknown as Parameters<typeof openImageFilePicker>[0],
        ),
      setIndentGuides: (enabled) => {
        void app.configuration.updateConfigurationOptions({
          "editor.display.showIndentationGuides": enabled,
        });
      },
      setIndentWidth: (width) => {
        void app.configuration.updateConfigurationOptions({
          "editor.behaviour.indentVisualWidth": width,
        });
      },
      setIndentWithTabs: (enabled) => {
        void app.configuration.updateConfigurationOptions({
          "editor.behaviour.indentUsingTabs": enabled,
        });
      },
      setMarkdown: (markdown) => editor.setValue(markdown),
      setMode: (nextMode) => {
        if (
          nextMode === "source" ||
          nextMode === "live-preview" ||
          nextMode === "preview"
        ) {
          onModeChange(nextMode);
        }
      },
      setReadonly: () => undefined,
      setSelection: (nextSelection) =>
        editor.setSelection(nextSelection.anchor, nextSelection.head),
    };
  }
</script>

<div
  class="markdown-editing-surface mira"
  data-ui-component="markdown-editing-surface"
  data-mira-theme="obsidian"
  data-mode={mode}
>
  {#if editorSettings.toolbar}
    <MiraEditorToolbar
      value={editor.getValue()}
      {mode}
      features={resolved.features}
      featureConfigs={resolved.featureConfigs}
      context={toolbarContext()}
      modeOptions={["source", "live-preview", "preview"]}
      showModeSwitch={true}
      {indentGuides}
      {indentWidth}
      {indentWithTabs}
      onModeChange={(nextMode) => {
        if (
          nextMode === "source" ||
          nextMode === "live-preview" ||
          nextMode === "preview"
        ) {
          onModeChange(nextMode);
        }
      }}
    />
  {/if}

  <div class="markdown-editing-surface__editor">
    <EmbeddedEditorSurface
      {app}
      {leaf}
      {editor}
      viewType="markdown"
      fallbackLanguage="markdown"
      sourcePath={editor.file?.path ?? ""}
      {mode}
      class={[
        "markdown-view__editor",
        mode === "source"
          ? "markdown-view__editor--source markdown-source-mode"
          : "markdown-view__editor--live-preview markdown-live-preview-mode",
      ].join(" ")}
    />
  </div>
</div>

<style>
  .markdown-editing-surface {
    background: var(--mira-background, var(--background));
    border: 0;
    border-radius: 0;
    color: var(--mira-foreground, var(--foreground));
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    width: 100%;
  }

  .markdown-editing-surface__editor {
    display: flex;
    flex: 1 1 0;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
    width: 100%;
  }

  .markdown-editing-surface__editor
    :global([data-ui-component="embedded-editor-surface"]) {
    height: 100%;
    min-height: 0;
    min-width: 0;
  }

  .markdown-editing-surface__editor :global(.cm-editor-scroll-area) {
    height: 100%;
    min-height: 0;
  }

  .markdown-editing-surface :global(.mira-editor__toolbar) {
    flex: 0 0 auto;
  }
</style>
