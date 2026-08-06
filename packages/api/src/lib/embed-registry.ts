import type { App } from "./context.svelte";

export type EmbedViewHandle = {
  destroy?: () => void | Promise<void>;
};

export type EmbedView = (props: {
  app: App;
  containerEl: HTMLElement;
  state: Record<string, any>;
}) => void | EmbedViewHandle;

export class EmbedRegistry {
  readonly embedByExtension: Record<string, EmbedView> = {};

  constructor() {}

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
