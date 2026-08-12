<script lang="ts">
  import { WorkspaceEmpty } from "@lapismd/design-core/workspace/empty";
  import type { WorkspaceAction } from "@lapismd/design-core/workspace/core";

  let { actions }: { actions: WorkspaceAction[] } = $props();
</script>

<div class="lapis-editor-demo-landing" data-testid="lapis-editor-landing">
  <WorkspaceEmpty {actions} surface="page" />
</div>

<style>
  .lapis-editor-demo-landing {
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
  }
</style>
