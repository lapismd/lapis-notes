<script lang="ts" module>
  import type { App } from "@lapis-notes/api";
  import type { WorkspaceNavigation } from "@lapismd/design-core/workspace/app-shell";
  import type { WorkspaceRequestedDisplayMode } from "@lapismd/design-core/workspace/core";

  export interface WorkspaceShellProps {
    app: App;
    displayMode?: WorkspaceRequestedDisplayMode;
    workspaceLabel?: string;
    workspaceNavigation?: WorkspaceNavigation;
    class?: string;
  }
</script>

<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
  import { AppShell } from "@lapismd/design-core/workspace/app-shell";
  import "./workspace-shell.css";

  let {
    app,
    displayMode,
    workspaceLabel = "Lapis Notes",
    workspaceNavigation,
    class: className = "",
  }: WorkspaceShellProps = $props();

  const { controller } = untrack(() => getWorkspaceHostBinding(app.workspace));

  onMount(() => {
    // AppShell.Root does not own startup. By the time this shell is mounted,
    // the consumer has loaded the vault and restored the Lapis workspace.
    void controller.start();
  });
</script>

<div
  class={`lapis-workspace-shell ${className}`}
  data-ui-component="lapis-workspace-shell"
  data-ui-part="root"
>
  <AppShell.Root
    {controller}
    autoStart={false}
    disposeOnDestroy={false}
    theme="inherit"
  >
    <AppShell.Surface {displayMode} {workspaceLabel} {workspaceNavigation} />
  </AppShell.Root>
</div>
