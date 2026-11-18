<script lang="ts">
  import type { CliSettingsHost } from "./cli-settings";
  import CliSettings from "./CliSettings.svelte";

  let { host }: { host: CliSettingsHost } = $props();
</script>

<CliSettings {host} embedded />
