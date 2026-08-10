<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import { NoteLink as MiraNoteLink } from "@lapismd/mira/preview";
  import { createLapisMiraFileAdapter } from "$lib/mira/file-adapter";

  let {
    app,
    id,
    text,
    label,
    sourcePath = "",
    class: className = "",
  }: {
    app: App;
    id: string;
    text?: string;
    label?: string;
    sourcePath?: string;
    class?: string;
  } = $props();

  const fileAdapter = $derived(createLapisMiraFileAdapter(app));
</script>

<MiraNoteLink
  {id}
  {text}
  {label}
  {sourcePath}
  {fileAdapter}
  class={className}
/>
