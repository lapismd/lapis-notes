<script lang="ts">
  import { untrack } from "svelte";
  import type { WorkspaceSettingsPageProps } from "@lapismd/design-core/workspace/settings";
  import { cliSettingsHost } from "./cli-settings";
  import CliSettings from "./CliSettings.svelte";
  let { controller }: WorkspaceSettingsPageProps = $props();
  const host = untrack(() => cliSettingsHost(controller));
</script>

<h1>General</h1>
<h2>Advanced</h2>
<CliSettings {host} />
