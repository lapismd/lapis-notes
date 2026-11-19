<script lang="ts">
  import { onDestroy, untrack } from "svelte";
  import {
    DeclarativeSettingsSection,
    WorkspaceSettingsController,
  } from "@lapismd/design-core/workspace/settings";
  import { registerCliSettings, type CliSettingsHost } from "./cli-settings";

  let { host }: { host: CliSettingsHost; embedded?: boolean } = $props();
  const controller = new WorkspaceSettingsController();
  const dispose = registerCliSettings(controller, untrack(() => host));
  const section = controller.sections.find((candidate) => candidate.id === "general");
  if (!section) throw new Error("CLI General settings were not registered");
  onDestroy(() => {
    dispose();
    controller.destroy();
  });
</script>

<DeclarativeSettingsSection {controller} {section} />
