<script lang="ts">
  import type { WorkspaceCustomSettingProps } from "@lapismd/design-core/workspace/settings";
  import { cliSettingsFieldHost } from "./cli-settings";
  import CliSettings from "./CliSettings.svelte";

  let { field }: WorkspaceCustomSettingProps = $props();
  let host = $derived(cliSettingsFieldHost(field));
</script>

<CliSettings {host} embedded />
