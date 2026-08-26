<script lang="ts">
  import MiraEditor from "@lapismd/mira-editor";
  import type { MiraAiRun } from "@lapismd/mira-plugin-ai";
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";
  import type { App, MarkdownSurfaceContext } from "@lapis-notes/api";
  import { createLapisFrontmatterPropertyManager } from "../../frontmatter/lapis-frontmatter-adapter";
  import { resolveMarkdownMiraExtensions } from "../../mira/extensions";
  import { createLapisMiraFileAdapter } from "../../mira/file-adapter";

  let {
    app,
    value = "",
    sourcePath = "",
    aiRun,
    onChange,
    surface = { id: "workspace" },
  }: {
    app: App;
    value?: string;
    sourcePath?: string;
    aiRun?: MiraAiRun;
    onChange?: (next: string) => void;
    surface?: MarkdownSurfaceContext;
  } = $props();

  const resolved = $derived.by(() => {
    void app.configuration.getConfiguration();
    return resolveMarkdownMiraExtensions(app, aiRun, {
      mode: "reading",
      sourcePath,
      surface,
      markdown: value,
    });
  });
  const fileAdapter = $derived(createLapisMiraFileAdapter(app));
  const frontmatterConfig = $derived(
    createLapisFrontmatterPropertyManager(app).config,
  );
</script>

<div
  class="markdown-view__reading markdown-reading-view"
  data-ui-component="markdown-mira-preview"
>
  <ScrollArea class="markdown-view__reading-scroll">
    <MiraEditor
      {value}
      mode="preview"
      features={resolved.features}
      extensions={resolved.miraExtensions}
      {fileAdapter}
      {frontmatterConfig}
      {sourcePath}
      frontmatterOpen={resolved.frontmatterDefaultOpen}
      outline={resolved.outlineNavigation}
      outlineVariant="floating"
      onChange={(next) => onChange?.(next)}
    />
  </ScrollArea>
</div>

<style>
  .markdown-view__reading {
    display: flex;
    height: 100%;
    isolation: isolate;
    min-height: 0;
    overflow: hidden;
    position: relative;
    transform: translateZ(0);
  }

  .markdown-view__reading :global(.markdown-view__reading-scroll) {
    flex: 1 1 auto;
    height: 100%;
    min-height: 0;
    width: 100%;
  }

  .markdown-view__reading :global(.mira-editor) {
    border: 0;
    border-radius: 0;
    height: auto;
    min-height: 100%;
    overflow: visible;
  }

  .markdown-view__reading :global(.mira-editor__editor),
  .markdown-view__reading :global(.mira-editor__editor > .mira),
  .markdown-view__reading :global(.mira__body),
  .markdown-view__reading :global(.mira__pane--preview),
  .markdown-view__reading :global(.mira-markdown-preview) {
    height: auto;
    min-height: 0;
    overflow: visible;
  }

  .markdown-view__reading
    :global([data-ui-part="scroll-area-viewport"]) {
    scroll-padding-block-start: var(--mira-preview-padding, 2rem);
  }

  .markdown-view__reading :global(.mira-markdown-preview) {
    padding-inline-end: max(var(--mira-preview-padding, 2rem), 4rem);
  }

  .markdown-view__reading :global(.mira-markdown-outline--floating) {
    position: fixed;
  }
</style>
