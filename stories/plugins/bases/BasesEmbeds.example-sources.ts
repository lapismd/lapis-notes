export const basesEmbedsExampleSource = `<script lang="ts">
  import { onMount } from "svelte";
  import { App, MemoryAppDatabase, MemoryVaultAdapter } from "@lapis-notes/api";
  import { BasesPlugin } from "@lapis-notes/bases";

  const app = new App({
    version: "1.0.0",
    configPath: ".obsidian/app.json",
    adapter: new MemoryVaultAdapter({
      ".obsidian/app.json": "{}",
      "Bases/Projects.base": "views:\\n  - type: table\\n    name: Projects",
    }),
    appDatabase: new MemoryAppDatabase("bases-embeds-example"),
    markdownRenderer: async () => {},
  });
  let ready = $state(false);

  onMount(() => {
    void (async () => {
      app.plugins.registerCorePlugin(BasesPlugin, {
        required: false,
        enabledByDefault: true,
        distribution: "bundled",
      });
      await app.vault.load();
      await app.configuration.load();
      await app.plugins.loadPlugins({
        communityPlugins: "disabled",
        optionalCorePlugins: "configured",
      });
      ready = true;
    })();
  });
</script>

{#if ready}
  <!-- Render with the registered base embed or fenced-code renderer. -->
  <div data-base-file="Bases/Projects.base"></div>
{/if}`;
