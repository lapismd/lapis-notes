<script lang="ts">
  import type { App, MarkdownSurfaceContext, TFile } from "@lapis-notes/api";
  import {
    EditableMarkdownPreview,
    FileEmbed as MiraFileEmbed,
  } from "@lapismd/mira/preview";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import Maximize from "@lucide/svelte/icons/maximize-2";
  import {
    createLapisMiraFileAdapter,
    toMiraFileRef,
  } from "$lib/mira/file-adapter";
  import { useEditablePreviewClose } from "./editable-preview-close-context";
  import { resolveMarkdownMiraExtensions } from "$lib/mira/extensions";

  let {
    app,
    id = "",
    file = null,
    text,
    sourcePath = "",
    sectionId,
    frontmatterOpen = false,
    editable = false,
    returnToPreviewOnBlur = true,
    editing = $bindable(false),
    class: className = "",
    onopen,
    surface = { id: "file-embed" },
  }: {
    app: App;
    id?: string;
    file?: TFile | null;
    text?: string;
    sourcePath?: string;
    sectionId?: string;
    frontmatterOpen?: boolean;
    editable?: boolean;
    returnToPreviewOnBlur?: boolean;
    editing?: boolean;
    class?: string;
    onopen?: (event: MouseEvent) => void;
    surface?: MarkdownSurfaceContext;
  } = $props();

  const fileAdapter = $derived(createLapisMiraFileAdapter(app));
  const baseTarget = $derived(file?.path || id);
  const target = $derived(
    sectionId ? `${baseTarget}#${sectionId.replace(/^#/, "")}` : baseTarget,
  );
  const title = $derived(text || file?.name || baseTarget || "Embedded file");
  const resolvedFile = $derived(
    file ??
      (baseTarget
        ? app.metadataCache.getFirstLinkpathDest(baseTarget, sourcePath)
        : app.vault.getFileByPath(sourcePath)),
  );
  const editableFile = $derived(
    resolvedFile &&
      (resolvedFile.extension === "md" || resolvedFile.extension === "markdown")
      ? toMiraFileRef(resolvedFile)
      : null,
  );
  const resolved = $derived.by(() => {
    void app.configuration.getConfiguration();
    return resolveMarkdownMiraExtensions(app, undefined, {
      mode: "embed",
      sourcePath: resolvedFile?.path ?? sourcePath,
      surface,
    });
  });
  const closeEditablePreview = useEditablePreviewClose();
  let editablePreview: { exit: () => Promise<boolean> } | null = $state(null);

  $effect(() => {
    if (!editable || !editableFile) {
      editing = false;
    }
  });

  function openFile(event: MouseEvent): void {
    event.stopPropagation();
    if (onopen) {
      onopen(event);
      return;
    }
    const resolved =
      file ??
      (baseTarget
        ? app.metadataCache.getFirstLinkpathDest(baseTarget, sourcePath)
        : app.vault.getFileByPath(sourcePath));
    if (resolved) void app.openFile(resolved);
  }

  export async function exit(): Promise<boolean> {
    return (await editablePreview?.exit()) ?? true;
  }
</script>

<div
  class={`lapis-file-embed ${className}`.trim()}
  data-ui-component="file-embed"
  data-file-path={baseTarget}
  data-editable={editable ? "true" : "false"}
  data-editing={editing ? "true" : "false"}
  data-mira-theme="obsidian"
>
  <header class="lapis-file-embed__header">
    {#if !editable}
      <strong class="lapis-file-embed__title">{title}</strong>
    {/if}
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={`Open ${title}`}
      onpointerdown={(event) => event.stopPropagation()}
      onclick={openFile}
    >
      <Maximize data-icon />
    </Button>
  </header>
  <div class="lapis-file-embed__content">
    {#if editable && editableFile}
      <EditableMarkdownPreview
        bind:this={editablePreview}
        file={editableFile}
        {fileAdapter}
        bind:editing
        {frontmatterOpen}
        {returnToPreviewOnBlur}
        extensions={resolved.miraExtensions}
        onEscape={() => closeEditablePreview?.()}
      />
    {:else}
      <MiraFileEmbed
        id={target}
        {sourcePath}
        {fileAdapter}
        {frontmatterOpen}
        extensions={resolved.miraExtensions}
      />
    {/if}
  </div>
</div>

<style>
  .lapis-file-embed {
    display: flex;
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    flex-direction: column;
    gap: 0.5rem;
    color: var(--popover-foreground, var(--foreground));
    font-family: var(--font-interface, var(--font-sans));
  }

  .lapis-file-embed__header {
    display: flex;
    min-width: 0;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .lapis-file-embed__title {
    overflow: hidden;
    min-width: 0;
    font-size: 1rem;
    line-height: 1.4;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .lapis-file-embed__content {
    flex: 1 1 auto;
    min-height: 0;
    min-width: 0;
  }

  .lapis-file-embed[data-editable="true"] {
    gap: 0;
  }

  .lapis-file-embed[data-editable="true"] .lapis-file-embed__header {
    position: sticky;
    z-index: 1;
    top: 0;
    flex: 0 0 auto;
    justify-content: flex-end;
    padding-block-end: 0.5rem;
    background: var(
      --ui-hover-card-background,
      var(--popover, var(--background-primary))
    );
  }

  .lapis-file-embed[data-editable="true"]
    .lapis-file-embed__content
    :global(.mira-editable-markdown-preview__preview > .mira-markdown-preview) {
    box-sizing: border-box;
    padding: 1rem 2rem;
  }

  .lapis-file-embed[data-editing="true"] {
    height: 100%;
    min-height: 0;
  }

  .lapis-file-embed[data-editing="true"] .lapis-file-embed__content,
  .lapis-file-embed[data-editing="true"]
    .lapis-file-embed__content
    :global(.mira-editable-markdown-preview),
  .lapis-file-embed[data-editing="true"]
    .lapis-file-embed__content
    :global(.mira-editable-markdown-preview__editor-shell) {
    height: 100%;
    min-height: 0;
  }

  .lapis-file-embed[data-editable="false"]
    .lapis-file-embed__content
    :global(.mira-embed) {
    margin-block: 0;
  }

  .lapis-file-embed__content :global(.mira-embed > figcaption) {
    display: none;
  }
</style>
