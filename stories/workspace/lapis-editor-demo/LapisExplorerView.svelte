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
