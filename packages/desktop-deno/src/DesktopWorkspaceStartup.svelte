<script lang="ts">
  import {
    WorkspaceStartup,
    type WorkspaceStartupFailure,
    type WorkspaceStartupTask,
  } from "@lapismd/design-core/workspace/startup";
  import lapisLogo from "./assets/lapis-logo.svg";
  import "./DesktopWorkspaceStartup.css";

  let {
    tasks = [],
    failure = null,
  }: {
    tasks?: WorkspaceStartupTask[];
    failure?: WorkspaceStartupFailure | null;
  } = $props();
</script>

{#snippet lapisVisual()}
  <img
    class="desktop-workspace-startup__logo"
    data-ui-component="desktop-workspace-startup"
    data-ui-part="logo"
    src={lapisLogo}
    alt=""
  />
{/snippet}

<WorkspaceStartup
  title="Opening Lapis Notes"
  loadingVisual={lapisVisual}
  {tasks}
  {failure}
/>
