import type { Extension } from "@codemirror/state";
import type { App } from "./context.svelte";
import type { MarkdownPostProcessor } from "./markdown";

/** Identifies the Markdown host that is rendering or editing a document. */
export interface MarkdownSurfaceContext {
  /** Stable surface identifier such as `workspace` or `tasks-list`. */
  id: string;
  /** Optional opaque context owned by the surface consumer. */
  context?: unknown;
}

export type MarkdownContributionMode =
  | "source"
  | "live-preview"
  | "reading"
  | "embed";

export interface MarkdownCodeMirrorExtensionContext {
  app: App;
  mode: "source" | "live-preview";
  sourcePath: string;
  surface: MarkdownSurfaceContext;
}

/** A plugin-owned Markdown contribution adapted by the bundled Markdown plugin. */
export interface MarkdownExtensionContribution {
  id: string;
  codeMirror?: (
    context: MarkdownCodeMirrorExtensionContext,
  ) => Extension | readonly Extension[] | null | undefined;
  postProcessor?: MarkdownPostProcessor;
}

export interface RegisteredMarkdownExtensionContribution
  extends MarkdownExtensionContribution {
  pluginId: string;
}

function contributionKey(pluginId: string, contributionId: string): string {
  return `${pluginId}:${contributionId}`;
}

export class MarkdownExtensionRegistry {
  private readonly contributions = new Map<
    string,
    RegisteredMarkdownExtensionContribution
  >();

  register(
    pluginId: string,
    contribution: MarkdownExtensionContribution,
  ): () => void {
    const normalizedPluginId = pluginId.trim();
    const normalizedId = contribution.id.trim();
    if (!normalizedPluginId || !normalizedId) {
      throw new Error("Markdown contributions require plugin and contribution ids.");
    }

    const key = contributionKey(normalizedPluginId, normalizedId);
    if (this.contributions.has(key)) {
      throw new Error(`Markdown contribution ${key} is already registered.`);
    }

    const registered = {
      ...contribution,
      id: normalizedId,
      pluginId: normalizedPluginId,
    };
    this.contributions.set(key, registered);

    return () => {
      if (this.contributions.get(key) === registered) {
        this.contributions.delete(key);
      }
    };
  }

  getAll(): RegisteredMarkdownExtensionContribution[] {
    return [...this.contributions.values()];
  }
}
