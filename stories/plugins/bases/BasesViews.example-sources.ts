import {
  BASES_SAMPLE_ARTWORK,
  BASES_SAMPLE_NOTES,
  BASES_SAMPLE_TYPES,
  createBasesViewsDocument,
  type BasesViewScenario,
} from "./bases-views-fixture";

export function basesViewsExampleSource(scenario: BasesViewScenario): string {
  const document = JSON.stringify(createBasesViewsDocument(scenario), null, 2);
  const notes = JSON.stringify(BASES_SAMPLE_NOTES, null, 2);
  const artwork = JSON.stringify(BASES_SAMPLE_ARTWORK, null, 2);

  return `<script lang="ts">
  import { onMount } from "svelte";
  import { App, MemoryAppDatabase, MemoryVaultAdapter } from "@lapis-notes/api";
  import { BasesPlugin, BasesViewSurface, type BasesDocument } from "@lapis-notes/bases";
  import { MarkdownPlugin } from "@lapis-notes/markdown";

  class ExampleVaultAdapter extends MemoryVaultAdapter {
    async getResourceUrl(path: string) {
      const data = await this.readBinary(path);
      return URL.createObjectURL(new Blob([data], { type: "image/svg+xml" }));
    }
  }

  const adapter = new ExampleVaultAdapter({
    ".obsidian/app.json": "{}",
    ".obsidian/types.json": JSON.stringify(${JSON.stringify(BASES_SAMPLE_TYPES)}),
    ...${notes},
    ...${artwork},
  });
  const app = new App({
    version: "1.0.0",
    configPath: ".obsidian/app.json",
    adapter,
    appDatabase: new MemoryAppDatabase("bases-example"),
    markdownRenderer: async () => {},
  });
  const document: BasesDocument = ${document};
  let ready = $state(false);

  app.plugins.registerCorePlugins([
    { plugin: MarkdownPlugin, required: false, enabledByDefault: true, distribution: "bundled" },
    { plugin: BasesPlugin, required: false, enabledByDefault: true, distribution: "bundled" },
  ]);
  onMount(() => {
    let stopTrackingMetadata = () => {};
    void (async () => {
      await app.vault.load();
      await app.configuration.load();
      await app.plugins.loadPlugins({ communityPlugins: "disabled", optionalCorePlugins: "configured" });
      stopTrackingMetadata = app.metadataTypeManager.trackChanges();
      await app.metadataCache.load();
      ready = true;
    })();
    return () => stopTrackingMetadata();
  });
</script>

{#if ready}
  <BasesViewSurface {app} {document} />
{/if}`;
}
