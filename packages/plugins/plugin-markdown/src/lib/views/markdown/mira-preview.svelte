<script lang="ts">
  import MiraEditor from "@lapismd/mira-editor";
  import type { MiraAiRun } from "@lapismd/mira-plugin-ai";
  import type { App, MarkdownSurfaceContext } from "@lapis-notes/api";
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
</script>

<div
  class="markdown-view__reading markdown-reading-view"
  data-ui-component="markdown-mira-preview"
>
  <MiraEditor
    {value}
    mode="preview"
    features={resolved.features}
    extensions={resolved.miraExtensions}
    {fileAdapter}
    {sourcePath}
    onChange={(next) => onChange?.(next)}
  />
</div>

<style>
  .markdown-view__reading {
    height: 100%;
    min-height: 0;
    overflow: auto;
  }

  .markdown-view__reading :global(.mira-editor) {
    border: 0;
    border-radius: 0;
    min-height: 0;
  }
</style>
