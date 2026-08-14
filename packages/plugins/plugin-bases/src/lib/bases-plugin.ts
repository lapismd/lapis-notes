import {
  type App,
  MarkdownRenderChild,
  Plugin,
  type PluginManifest,
} from "@lapis-notes/api";
import { markupEditor } from "@lapis-notes/api/editor/core";
import { yaml } from "@codemirror/lang-yaml";
import { mount, unmount } from "svelte";
import BasesComponent from "./bases-view/view.svelte";
import {
  BasesView,
  BasesViewType,
  createBasesViewRegistrations,
  parseBasesDocument,
} from "./bases-view";

type BasesRenderHandle = {
  destroy: () => void;
};

const BASES_MANIFEST: PluginManifest = {
  id: "bases",
  name: "Bases",
  version: "0.0.1",
  minAppVersion: "1.7.7",
  description: "Bases",
  author: "Lapis Notes Bases",
  authorUrl: "https://app.lapis.md",
  isDesktopOnly: false,
};

export class BasesPlugin extends Plugin {
  constructor(app: App, manifest: PluginManifest = BASES_MANIFEST) {
    super(app, manifest);
  }

  async onload() {
    this.registerView(BasesViewType, (leaf) => new BasesView(leaf));
    this.registerEditorView({
      id: BasesViewType,
      label: "Bases",
      filenamePatterns: ["*.bases", "*.base"],
      priority: "default",
    });
    this.registerExtensions(["bases", "base"], BasesViewType);
    this.registerEditorExtension(
      () => [markupEditor({ language: "yaml" }), yaml()],
      BasesViewType,
    );
    this.registerReadOnlyEmbedRenderer("base");
    this.registerReadOnlyEmbedRenderer("bases");
    this.registerReadOnlyCodeBlockRenderer("base");
    this.registerReadOnlyCodeBlockRenderer("bases");
  }

  private registerReadOnlyEmbedRenderer(extension: string): void {
    this.register(
      this.app.embedRegistry.register(extension, ({ containerEl, state }) => {
        const file = state.file;
        if (!file) {
          return;
        }

        let activeHandle: BasesRenderHandle | null = null;
        let disposed = false;

        void this.app.vault
          .read(file)
          .then((content) => {
            if (disposed) {
              return;
            }

            activeHandle = this.mountReadOnlyBases(containerEl, content);
          })
          .catch((error) => {
            if (disposed) {
              return;
            }

            this.renderError(
              containerEl,
              error instanceof Error
                ? `Unable to render this embedded base: ${error.message}`
                : `Unable to render this embedded base: ${String(error)}`,
            );
          });

        return {
          destroy: () => {
            disposed = true;
            activeHandle?.destroy();
            activeHandle = null;
            containerEl.replaceChildren();
          },
        };
      }),
    );
  }

  private registerReadOnlyCodeBlockRenderer(language: string): void {
    this.registerMarkdownCodeBlockProcessor(language, (source, el, ctx) => {
      const handle = this.mountReadOnlyBases(el, source);
      const child = new MarkdownRenderChild(el);
      child.register(() => {
        handle.destroy();
      });
      ctx.addChild(child);
    });
  }

  private mountReadOnlyBases(
    containerEl: HTMLElement,
    content: string,
  ): BasesRenderHandle {
    containerEl.replaceChildren();

    let document;
    try {
      document = parseBasesDocument(content);
    } catch (error) {
      this.renderError(
        containerEl,
        error instanceof Error
          ? `Unable to render this base: ${error.message}`
          : `Unable to render this base: ${String(error)}`,
      );
      return {
        destroy: () => {
          containerEl.replaceChildren();
        },
      };
    }

    const component = mount(BasesComponent, {
      target: containerEl,
      props: {
        app: this.app,
        document,
        registrations: createBasesViewRegistrations(this.app),
        onChange: () => {},
        readOnly: true,
        showHeader: false,
      },
    });

    return {
      destroy: () => {
        void unmount(component);
        containerEl.replaceChildren();
      },
    };
  }

  private renderError(containerEl: HTMLElement, message: string): void {
    containerEl.replaceChildren();
    const wrapper = document.createElement("div");
    wrapper.className = "bases-view-error";
    const messageEl = document.createElement("p");
    messageEl.className = "bases-view-error__message";
    messageEl.textContent = message;
    wrapper.appendChild(messageEl);
    containerEl.appendChild(wrapper);
  }
}

export default BasesPlugin;
