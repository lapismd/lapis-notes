<script lang="ts">
  import type {
    App,
    MarkdownFileSurfaceActivation,
    MarkdownSurfaceContext,
    TFile,
  } from "@lapis-notes/api";
  import { EditableMarkdownPreview } from "@lapismd/mira/preview";
  import {
    createLapisMiraFileAdapter,
    toMiraFileRef,
  } from "$lib/mira/file-adapter";
  import { resolveMarkdownMiraExtensions } from "$lib/mira/extensions";

  let {
    app,
    file,
    editable = false,
    activation = "manual",
    returnToPreviewOnBlur = true,
    surface,
    onEditingChange,
  }: {
    app: App;
    file: TFile;
    editable?: boolean;
    activation?: MarkdownFileSurfaceActivation;
    returnToPreviewOnBlur?: boolean;
    surface: MarkdownSurfaceContext;
    onEditingChange?: (editing: boolean) => void;
  } = $props();

  const fileAdapter = $derived(createLapisMiraFileAdapter(app));
  const resolved = $derived.by(() => {
    void app.configuration.getConfiguration();
    return resolveMarkdownMiraExtensions(app, undefined, {
      mode: "embed",
      sourcePath: file.path,
      surface,
    });
  });
  let editing = $state(false);
  let preview: {
    flush: () => Promise<boolean>;
    exit: () => Promise<boolean>;
  } | null = $state(null);

  $effect(() => {
    onEditingChange?.(editing);
  });

  function interactiveTarget(target: EventTarget | null): boolean {
    return (
      target instanceof Element &&
      Boolean(
        target.closest(
          "a,button,input,select,textarea,summary,[contenteditable='true'],[data-markdown-interactive]",
        ),
      )
    );
  }

  function activate(event: MouseEvent): void {
    if (!editable || activation !== "double-click" || interactiveTarget(event.target)) {
      return;
    }
    event.preventDefault();
    editing = true;
  }

  export function enter(): void {
    if (editable) editing = true;
  }

  export async function flush(): Promise<boolean> {
    return (await preview?.flush()) ?? true;
  }

  export async function exit(): Promise<boolean> {
    return (await preview?.exit()) ?? true;
  }
</script>

<div
  class="lapis-markdown-file-surface"
  data-ui-component="markdown-file-surface"
  data-mira-theme="obsidian"
  data-editing={editing ? "true" : "false"}
  role="document"
  ondblclick={activate}
>
  <EditableMarkdownPreview
    bind:this={preview}
    file={toMiraFileRef(file)}
    {fileAdapter}
    bind:editing
    extensions={resolved.miraExtensions}
    activateOnPreviewInteraction={activation === "click"}
    {returnToPreviewOnBlur}
  />
</div>

<style>
  .lapis-markdown-file-surface {
    box-sizing: border-box;
    min-height: 0;
    min-width: 0;
    width: 100%;
  }

  .lapis-markdown-file-surface[data-editing="false"]
    :global(.mira-editable-markdown-preview__preview),
  .lapis-markdown-file-surface[data-editing="false"]
    :global(.mira-markdown-preview) {
    overflow: visible;
  }

  .lapis-markdown-file-surface[data-editing="true"] {
    display: flex;
    height: 100%;
  }

  .lapis-markdown-file-surface[data-editing="true"]
    :global(.mira-editable-markdown-preview),
  .lapis-markdown-file-surface[data-editing="true"]
    :global(.mira-editable-markdown-preview__editor-shell),
  .lapis-markdown-file-surface[data-editing="true"]
    :global(.mira-editable-markdown-preview__editor) {
    flex: 1 1 auto;
    height: 100%;
    min-height: 0;
  }
</style>
