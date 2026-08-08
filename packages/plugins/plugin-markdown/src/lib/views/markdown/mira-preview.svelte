<script lang="ts">
  import MiraEditor from "@lapismd/mira-editor";
  import type { MiraAiRun } from "@lapismd/mira-plugin-ai";
  import type { App } from "@lapis-notes/api";
  import { resolveMarkdownMiraExtensions } from "../../mira/extensions";

  let {
    app,
    value = "",
    sourcePath = "",
    aiRun,
    onChange,
  }: {
    app: App;
    value?: string;
    sourcePath?: string;
    aiRun?: MiraAiRun;
    onChange?: (next: string) => void;
  } = $props();

  const resolved = $derived.by(() => {
    void app.configuration.getConfiguration();
    return resolveMarkdownMiraExtensions(app, aiRun);
  });
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
</style>
