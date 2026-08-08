<script lang="ts">
  import { WorkspaceEmpty } from "@lapismd/design-core/workspace/empty";
  import type { WorkspaceAction } from "@lapismd/design-core/workspace/core";

  let { actions }: { actions: WorkspaceAction[] } = $props();
</script>

<div class="lapis-editor-demo-landing" data-testid="lapis-editor-landing">
  <WorkspaceEmpty {actions} />
</div>
