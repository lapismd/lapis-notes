<script lang="ts">
  import {
    WorkspaceExplorer,
    type ExplorerController,
  } from "@lapismd/design-core/workspace/explorer";

  let { controller }: { controller: ExplorerController } = $props();
</script>

<div class="lapis-editor-demo-explorer" data-testid="lapis-editor-explorer">
  <WorkspaceExplorer {controller} />
</div>

<style>
  .lapis-editor-demo-explorer {
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
  }
</style>
