import {
  fetchVerifiedPluginMarkdown,
  type App,
  type PluginCatalogDetail,
  type PluginCatalogEntry,
} from "@lapis-notes/api";
import type { PluginMarkdownState } from "./plugin-registry-detail";
import { registryErrorMessage } from "./plugin-registry-controller.svelte";
import {
  fetchPluginReadmeMarkdown,
  resolveReadmeRelativeUrls,
} from "./plugin-readme";

/** Surface-owned detail requests; a late response cannot replace a newer route. */
export class PluginRegistryDetailSession {
  entryId = $state<string | null>(null);
  detail = $state<PluginCatalogDetail | null>(null);
  loading = $state(false);
  overview = $state<PluginMarkdownState>({ status: "idle" });
  changelog = $state<PluginMarkdownState>({ status: "idle" });
  private generation = 0;
  private entry: PluginCatalogEntry | null = null;
  constructor(readonly app: App) {}
  dispose() {
    this.generation += 1;
    this.loading = false;
  }
  async select(entry: PluginCatalogEntry) {
    const generation = ++this.generation;
    this.entry = entry;
    this.entryId = entry.id;
    this.detail = null;
    this.loading = true;
    this.overview = { status: "loading" };
    this.changelog = { status: "loading" };
    try {
      const detail = await this.app.pluginDistribution.getPluginDetail(
        entry.id,
      );
      if (generation !== this.generation) return;
      this.detail = detail;
      if (detail?.schemaVersion === 2) {
        this.overview = { status: "missing" };
        this.changelog = { status: "missing" };
        return;
      }
      await Promise.all([
        this.load("overview", entry, detail, generation),
        this.load("changelog", entry, detail, generation),
      ]);
    } catch (error) {
      if (generation !== this.generation) return;
      this.overview = { status: "error", message: registryErrorMessage(error) };
      this.changelog = { status: "missing" };
    } finally {
      if (generation === this.generation) this.loading = false;
    }
  }
  async retry(kind: "overview" | "changelog") {
    if (!this.entry) return;
    this[kind] = { status: "loading" };
    await this.load(kind, this.entry, this.detail, this.generation);
  }
  private async load(
    kind: "overview" | "changelog",
    entry: PluginCatalogEntry,
    detail: PluginCatalogDetail | null,
    generation: number,
  ) {
    const reference = detail?.content?.[kind];
    const set = (state: PluginMarkdownState) => {
      if (generation === this.generation) this[kind] = state;
    };
    if (reference) {
      try {
        const markdown = await fetchVerifiedPluginMarkdown(reference);
        set({
          status: "loaded",
          url: reference.url,
          sourceUrl: reference.sourceUrl,
          markdown: resolveReadmeRelativeUrls(markdown, reference.url),
        });
      } catch (error) {
        set({
          status: "error",
          message: registryErrorMessage(error),
          sourceUrl: reference.sourceUrl,
        });
      }
      return;
    }
    const readmeUrl = detail?.readmeUrl ?? entry.readmeUrl;
    if (kind === "changelog" || !readmeUrl) {
      set({ status: "missing" });
      return;
    }
    try {
      const markdown = await fetchPluginReadmeMarkdown(readmeUrl, {
        pluginId: entry.id,
        detailUrl: entry.detail,
      });
      set({ status: "loaded", url: readmeUrl, sourceUrl: readmeUrl, markdown });
    } catch (error) {
      set({
        status: "error",
        message: registryErrorMessage(error),
        sourceUrl: readmeUrl,
      });
    }
  }
}
