<script lang="ts" module>
  import type { App } from "@lapis-notes/api";
  import type { WorkspaceNavigation } from "@lapismd/design-core/workspace/app-shell";
  import type {
    WorkspaceRequestedDisplayMode,
    WorkspacePopoutHost,
  } from "@lapismd/design-core/workspace/core";

  export interface WorkspaceShellProps {
    app: App;
    /** Optional host-owned popup creation policy. null disables detached windows. */
    popoutHost?: WorkspacePopoutHost | null;
    displayMode?: WorkspaceRequestedDisplayMode;
    workspaceLabel?: string;
    workspaceNavigation?: WorkspaceNavigation;
    class?: string;
  }
</script>

<script lang="ts">
  import { onMount, untrack } from "svelte";
  import {
    bindNativeEditingProblems,
    provideApplicationState,
  } from "@lapis-notes/api";
  import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
  import { AppShell } from "@lapismd/design-core/workspace/app-shell";
  import { bindFileConflictReviews } from "./file-conflicts/register-conflict-reviews";
  import "./workspace-shell.css";

  let {
    app,
    displayMode,
    popoutHost,
    workspaceLabel = "Lapis Notes",
    workspaceNavigation,
    class: className = "",
  }: WorkspaceShellProps = $props();

  provideApplicationState(untrack(() => app));
  const { controller } = untrack(() => getWorkspaceHostBinding(app.workspace));
  let activateNewTabs = $derived(
    app.configuration
      .getConfiguration()
      .get("editor.alwaysFocusNewTabs", false),
  );

  onMount(() => {
    // AppShell.Root does not own startup. By the time this shell is mounted,
    // the consumer has loaded the vault and restored the Lapis workspace.
    void controller.start();
    const stopNative = bindNativeEditingProblems(app);
    const stopConflicts = bindFileConflictReviews(app);
    return () => {
      stopConflicts();
      stopNative();
    };
  });
</script>

<div
  class={`lapis-workspace-shell ${className}`}
  data-ui-component="lapis-workspace-shell"
  data-ui-part="root"
>
  <AppShell.Root
    {controller}
    {popoutHost}
    autoStart={false}
    {activateNewTabs}
    disposeOnDestroy={false}
    theme="inherit"
  >
    <AppShell.Surface {displayMode} {workspaceLabel} {workspaceNavigation} />
  </AppShell.Root>
</div>
