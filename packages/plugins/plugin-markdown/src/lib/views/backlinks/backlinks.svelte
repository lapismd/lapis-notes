<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import LinkSidebar from "../link-sidebar/link-sidebar.svelte";

  let { app }: { app: App } = $props();
</script>

<LinkSidebar {app} mode="backlinks" />
