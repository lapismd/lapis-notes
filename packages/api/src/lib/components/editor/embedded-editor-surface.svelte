<script lang="ts">
  import { onMount, untrack } from "svelte";
  import type { App, Editor, WorkspaceLeaf } from "$lib";
  import { Editor as EditorController } from "$lib/editor.svelte";
  import NoteEditor from "./editor.svelte";
  import { applyEmbeddedEditorExtensions } from "./embedded-editor-surface";

  let {
    app,
    leaf,
    editor: providedEditor,
    value = "",
    viewType = "markdown",
    mode = "source",
    sourcePath = "",
    fallbackLanguage = viewType,
    scrollOwner = "self",
    class: className = "",
    onChange,
  }: {
    app: App;
    leaf?: WorkspaceLeaf;
    editor?: Editor;
    value?: string;
    viewType?: string;
    mode?: string;
    sourcePath?: string;
    fallbackLanguage?: string;
    scrollOwner?: "self" | "ancestor";
    class?: string;
    onChange?: (value: string) => void | Promise<void>;
  } = $props();

  const initial = untrack(() => ({ app, providedEditor, value }));
  const ownsEditor = initial.providedEditor === undefined;
  const editor =
    initial.providedEditor ??
    new EditorController(initial.value, [], initial.app);
  editor.bindApplication(initial.app);

  function refreshExtensions(): void {
    applyEmbeddedEditorExtensions(app, editor, {
      viewType,
      mode,
      sourcePath,
      fallbackLanguage,
    });
  }

  $effect(() => {
    viewType;
    mode;
    sourcePath;
    fallbackLanguage;
    refreshExtensions();
  });

  $effect(() => {
    if (ownsEditor && value !== editor.getValue()) {
      editor.replaceContent(value);
    }
  });

  onMount(() => {
    const changed = editor.on("change", (next) => {
      void onChange?.(next);
    });
    const configurationChanged = app.configuration.on("updated", () => {
      refreshExtensions();
    });
    const pluginEnabled = app.plugins?.on("plugin-enabled", () => {
      refreshExtensions();
    });
    const pluginDisabled = app.plugins?.on("plugin-disabled", () => {
      refreshExtensions();
    });

    return () => {
      const flushed = editor.flushChanges();
      editor.offref(changed);
      app.configuration.offref(configurationChanged);
      if (pluginEnabled) app.plugins.offref(pluginEnabled);
      if (pluginDisabled) app.plugins.offref(pluginDisabled);
      void flushed.finally(() => {
        if (ownsEditor) editor.destroy();
      });
    };
  });
</script>

<div
  class={["embedded-editor-surface", className].filter(Boolean).join(" ")}
  data-ui-component="embedded-editor-surface"
  data-ui-part="root"
  data-editor-view-type={viewType}
  data-editor-mode={mode}
  data-editor-scroll-owner={scrollOwner}
>
  <NoteEditor {app} {leaf} {editor} {scrollOwner} />
</div>

<style>
  .embedded-editor-surface {
    display: flex;
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
    width: 100%;
  }

  .embedded-editor-surface :global(.cm-editor-scroll-area) {
    flex: 1 1 auto;
    min-height: 0;
  }
</style>
