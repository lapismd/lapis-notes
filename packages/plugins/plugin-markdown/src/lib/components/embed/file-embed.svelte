<script lang="ts">
  import type { App, TFile } from "@lapis-notes/api";
  import { FileEmbed as MiraFileEmbed } from "@lapismd/mira/preview";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import Maximize from "@lucide/svelte/icons/maximize-2";
  import { createLapisMiraFileAdapter } from "$lib/mira/file-adapter";

  let {
    app,
    id = "",
    file = null,
    text,
    sourcePath = "",
    sectionId,
    frontmatterOpen = false,
    class: className = "",
    onopen,
  }: {
    app: App;
    id?: string;
    file?: TFile | null;
    text?: string;
    sourcePath?: string;
    sectionId?: string;
    frontmatterOpen?: boolean;
    class?: string;
    onopen?: (event: MouseEvent) => void;
  } = $props();

  const fileAdapter = $derived(createLapisMiraFileAdapter(app));
  const baseTarget = $derived(file?.path || id);
  const target = $derived(
    sectionId ? `${baseTarget}#${sectionId.replace(/^#/, "")}` : baseTarget,
  );
  const title = $derived(text || file?.name || baseTarget || "Embedded file");

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
</script>

<div
  class={`lapis-file-embed ${className}`.trim()}
  data-ui-component="file-embed"
  data-file-path={baseTarget}
>
  <header class="lapis-file-embed__header">
    <strong class="lapis-file-embed__title">{title}</strong>
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={`Open ${title}`}
      onpointerdown={(event) => event.stopPropagation()}
      onclick={openFile}
    >
      <Maximize />
    </Button>
  </header>
  <div class="lapis-file-embed__content">
    <MiraFileEmbed
      id={target}
      {sourcePath}
      {fileAdapter}
      {frontmatterOpen}
    />
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
    min-width: 0;
  }

  .lapis-file-embed__content :global(.mira-embed) {
    margin-block: 0;
  }

  .lapis-file-embed__content :global(.mira-embed > figcaption) {
    display: none;
  }
</style>
