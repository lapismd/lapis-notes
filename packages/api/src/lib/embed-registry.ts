import type { App } from "./context.svelte";
import type { TFile } from "./storage/fs";

export type EmbedViewHandle = {
  destroy?: () => void | Promise<void>;
};

export type EmbedView = (props: {
  app: App;
  containerEl: HTMLElement;
  state: Record<string, any>;
}) => void | EmbedViewHandle;

export type MarkdownEmbedContext = {
  app: App;
  containerEl: HTMLElement;
  file: TFile;
};

export type MarkdownEmbedder = (
  props: MarkdownEmbedContext,
) => false | EmbedViewHandle;

export class EmbedRegistry {
  readonly embedByExtension: Record<string, EmbedView> = {};
  #markdownEmbedders: MarkdownEmbedder[] = [];

  constructor() {}

  registerMarkdownEmbedder(embedder: MarkdownEmbedder): () => void {
    this.#markdownEmbedders = [...this.#markdownEmbedders, embedder];
    return () => {
      this.#markdownEmbedders = this.#markdownEmbedders.filter(
        (candidate) => candidate !== embedder,
      );
    };
  }

  renderMarkdownEmbed(
    props: MarkdownEmbedContext,
  ): false | EmbedViewHandle {
    for (const embedder of this.#markdownEmbedders) {
      const handle = embedder(props);
      if (handle !== false) return handle;
    }
    return false;
  }

  register(extension: string, view: EmbedView): () => void {
    const normalizedExtension = extension.toLowerCase();
    this.embedByExtension[normalizedExtension] = view;

    return () => {
      if (this.embedByExtension[normalizedExtension] === view) {
        delete this.embedByExtension[normalizedExtension];
      }
    };
  }

  get(extension: string): EmbedView | null {
    return this.embedByExtension[extension.toLowerCase()] ?? null;
  }
}
