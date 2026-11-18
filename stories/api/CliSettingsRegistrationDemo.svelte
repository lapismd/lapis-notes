<script lang="ts">
  import { onDestroy } from "svelte";
  import FixtureControls from "../catalog/FixtureControls.svelte";
  import {
    AppSettings,
    AppSettingsRoot,
    WorkspaceSettingsController,
  } from "@lapismd/design-core/workspace/settings";
  import {
    registerCliSettings,
    type CliSettingsHost,
  } from "@lapis-notes/ui/cli";

  const first = new WorkspaceSettingsController();
  const second = new WorkspaceSettingsController();
  let selected = $state<"first" | "second">("first");
  function host(destination: string): CliSettingsHost {
    let state: "not-installed" | "installed" = "not-installed";
    return {
      installation: {
        status: async () => ({ state, destination, version: "0.1.0" }),
        install: async () => {
          state = "installed";
        },
        uninstall: async () => {
          state = "not-installed";
        },
      },
    };
  }
  let retireFirst = registerCliSettings(first, host("/example/first/lapis"));
  const retireSecond = registerCliSettings(
    second,
    host("/example/second/lapis"),
  );
  function replaceFirst() {
    const previous = retireFirst;
    retireFirst = registerCliSettings(
      first,
      host("/example/replacement/lapis"),
    );
    previous();
  }
  onDestroy(() => {
    retireFirst();
    retireSecond();
    first.destroy();
    second.destroy();
  });
</script>

<FixtureControls label="Registration fixture controls" placement="inline">
  <button onclick={() => (selected = "first")}>Show first owner</button>
  <button onclick={() => (selected = "second")}>Show second owner</button>
  <button onclick={replaceFirst}>Replace first host</button>
  <button onclick={() => retireFirst()}>Dispose first host</button>
</FixtureControls>
<div class="owners">
  {#key selected}
    <AppSettingsRoot controller={selected === "first" ? first : second}>
      <AppSettings.Navigation />
      <AppSettings.Content />
    </AppSettingsRoot>
  {/key}
  <output aria-label="First persisted settings">
    {JSON.stringify(first.values)}
  </output>
  <output aria-label="Second persisted settings">
    {JSON.stringify(second.values)}
  </output>
</div>

<style>
  .owners {
    display: grid;
    gap: 1rem;
  }
</style>
