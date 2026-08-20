<script lang="ts">
  import type { App, MarkdownSurfaceContext } from "@lapis-notes/api";
  import { MarkdownEmbed as MiraMarkdownEmbed } from "@lapismd/mira/preview";
  import "@lapismd/mira/preview/styles.css";
  import { resolveMarkdownMiraExtensions } from "../../mira/extensions";
  import { createLapisMiraFileAdapter } from "$lib/mira/file-adapter";

  let {
    app,
    value = "",
    sourcePath = "",
    class: className = "",
    frontmatterOpen = false,
    htmlPolicy = "trusted",
    surface = { id: "embed" },
  }: {
    app: App;
    value?: string;
    sourcePath?: string;
    class?: string;
    frontmatterOpen?: boolean;
    htmlPolicy?: "trusted" | "safe";
    surface?: MarkdownSurfaceContext;
  } = $props();

  const fileAdapter = $derived(createLapisMiraFileAdapter(app));
  const resolved = $derived.by(() => {
    void app.configuration.getConfiguration();
    return resolveMarkdownMiraExtensions(app, undefined, {
      mode: "embed",
      sourcePath,
      surface,
      markdown: value,
    });
  });
</script>

<MiraMarkdownEmbed
  {value}
  {sourcePath}
  {fileAdapter}
  {frontmatterOpen}
  {htmlPolicy}
  extensions={resolved.miraExtensions}
  class={`lapis-markdown-embed ${className}`.trim()}
/>
