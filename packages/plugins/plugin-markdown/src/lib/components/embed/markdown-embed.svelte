<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import { MarkdownEmbed as MiraMarkdownEmbed } from "@lapismd/mira/preview";
  import { createLapisMiraFileAdapter } from "$lib/mira/file-adapter";

  let {
    app,
    value = "",
    sourcePath = "",
    class: className = "",
    frontmatterOpen = false,
  }: {
    app: App;
    value?: string;
    sourcePath?: string;
    class?: string;
    frontmatterOpen?: boolean;
  } = $props();

  const fileAdapter = $derived(createLapisMiraFileAdapter(app));
</script>

<MiraMarkdownEmbed
  {value}
  {sourcePath}
  {fileAdapter}
  {frontmatterOpen}
  class={`lapis-markdown-embed ${className}`.trim()}
/>
