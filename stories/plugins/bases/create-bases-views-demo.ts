import { App, MemoryAppDatabase, MemoryVaultAdapter } from "@lapis-notes/api";
import { BasesPlugin } from "@lapis-notes/bases";
import { MarkdownPlugin } from "@lapis-notes/markdown";
import { watchMetadata } from "../../workspace/watch-metadata";
import { createBasesViewsSeed } from "./bases-views-fixture";

class BasesStoryVaultAdapter extends MemoryVaultAdapter {
  readonly #resourceUrls = new Set<string>();

  async getResourceUrl(path: string): Promise<string> {
    const data = await this.readBinary(path);
    const type = path.endsWith(".svg") ? "image/svg+xml" : undefined;
    const url = URL.createObjectURL(new Blob([data], { type }));
    this.#resourceUrls.add(url);
    return url;
  }

  revokeResourceUrl(url: string): void {
    URL.revokeObjectURL(url);
    this.#resourceUrls.delete(url);
  }

  disposeResourceUrls(): void {
    for (const url of this.#resourceUrls) URL.revokeObjectURL(url);
    this.#resourceUrls.clear();
  }
}

export async function bootBasesViewsDemo(): Promise<{
  app: App;
  dispose: () => Promise<void>;
}> {
  const adapter = new BasesStoryVaultAdapter(createBasesViewsSeed(), {
    name: "Lapis Bases Views",
    vaultId: "lapis-bases-views",
    clock: 1_700_000_000_000,
  });
  const app = new App({
    version: "0.0.1-story",
    configPath: ".obsidian/app.json",
    adapter,
    appDatabase: new MemoryAppDatabase("lapis-bases-views"),
    markdownRenderer: async () => {},
  });

  app.plugins.registerCorePlugins([
    {
      plugin: MarkdownPlugin,
      required: false,
      enabledByDefault: true,
      distribution: "bundled",
    },
    {
      plugin: BasesPlugin,
      required: false,
      enabledByDefault: true,
      distribution: "bundled",
    },
  ]);

  await app.vault.load();
  await app.configuration.load();
  await app.plugins.loadPlugins({
    communityPlugins: "disabled",
    optionalCorePlugins: "configured",
  });
  if (!app.plugins.isPluginEnabled("bases")) {
    throw new Error("The Bases plugin did not enable for its view stories");
  }
  const stopWatchingMetadata = watchMetadata(app);
  await app.metadataCache.load();

  return {
    app,
    dispose: async () => {
      stopWatchingMetadata();
      for (const plugin of [...app.plugins.corePlugins].reverse()) {
        await plugin.disable().catch(() => undefined);
      }
      await app.workspace.disposeWorkspaceHost();
      adapter.disposeResourceUrls();
    },
  };
}
