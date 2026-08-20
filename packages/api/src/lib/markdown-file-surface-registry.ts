import type { TFile } from "./storage/fs";
import type { MarkdownSurfaceContext } from "./markdown-extension-registry";

export type MarkdownFileSurfaceActivation =
  | "manual"
  | "click"
  | "double-click";

export interface MarkdownFileSurfaceOptions {
  containerEl: HTMLElement;
  file: TFile;
  editable?: boolean;
  activation?: MarkdownFileSurfaceActivation;
  returnToPreviewOnBlur?: boolean;
  surface: MarkdownSurfaceContext;
  onEditingChange?: (editing: boolean) => void;
}

export interface MarkdownFileSurfaceHandle {
  enter(): void | Promise<void>;
  flush(): Promise<boolean>;
  exit(): Promise<boolean>;
  dispose(): void | Promise<void>;
}

export type MarkdownFileSurfaceProvider = (
  options: MarkdownFileSurfaceOptions,
) => MarkdownFileSurfaceHandle | Promise<MarkdownFileSurfaceHandle>;

type RegisteredProvider = {
  pluginId: string;
  provider: MarkdownFileSurfaceProvider;
};

export class MarkdownFileSurfaceRegistry {
  private providers: RegisteredProvider[] = [];

  register(
    pluginId: string,
    provider: MarkdownFileSurfaceProvider,
  ): () => void {
    const registered = { pluginId: pluginId.trim(), provider };
    if (!registered.pluginId) {
      throw new Error("Markdown file surface providers require a plugin id.");
    }
    this.providers = [...this.providers, registered];
    return () => {
      this.providers = this.providers.filter((entry) => entry !== registered);
    };
  }

  get available(): boolean {
    return this.providers.length > 0;
  }

  mount(
    options: MarkdownFileSurfaceOptions,
  ): MarkdownFileSurfaceHandle | Promise<MarkdownFileSurfaceHandle> {
    const provider = this.providers.at(-1)?.provider;
    if (!provider) {
      throw new Error("No Markdown file surface provider is registered.");
    }
    return provider(options);
  }
}
