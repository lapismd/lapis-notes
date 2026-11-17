<script lang="ts">
  import { onDestroy, untrack } from "svelte";
  import {
    createBuiltInSettingsNavigationGroups,
    createBuiltInSettingsSections,
  } from "@lapismd/design-core/workspace/core";
  import {
    WorkspaceSettingsController,
    WorkspaceSettingsSurface,
  } from "@lapismd/design-core/workspace/settings";
  import {
    registerCliSettings,
    type CliSettingsHost,
  } from "@lapis-notes/ui/cli";

  let { host }: { host: CliSettingsHost } = $props();
  const settings = new WorkspaceSettingsController({
    sections: createBuiltInSettingsSections(),
    navigationGroups: createBuiltInSettingsNavigationGroups(),
  });
  const dispose = registerCliSettings(settings, untrack(() => host));
  settings.selectSection("general");

  onDestroy(() => {
    dispose();
    settings.destroy();
  });
</script>

<div class="cli-settings-demo">
  <WorkspaceSettingsSurface controller={settings} />
</div>

<style>
  .cli-settings-demo {
    width: 100%;
    height: min(42rem, 90vh);
    min-height: 36rem;
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
</style>
