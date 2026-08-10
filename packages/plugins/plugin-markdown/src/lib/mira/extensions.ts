import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import {
  createMarkdownCodeMirrorExtensions,
  createRichEditorExtensions,
} from "@lapismd/mira/codemirror";
import {
  createMiraEditorExtensions,
  type MiraFeatureFlags,
} from "@lapismd/mira-editor";
import { aiExtension, type MiraAiRun } from "@lapismd/mira-plugin-ai";
import type { App } from "@lapis-notes/api";
import type { MiraExtension } from "@lapismd/mira/extensions";
import { markupEditor as markupEditorRaw } from "@lapis-notes/api/editor";
import { readMiraFeatureFlags } from "./config";
import { createLapisMiraFileAdapter } from "./file-adapter";

const markupEditor = markupEditorRaw as (
  options: { language?: string },
  ...extensions: Extension[]
) => Extension;

export type MiraMarkdownExtensionOptions = {
  app: App;
  mode: "source" | "live-preview";
  sourcePath?: string;
  aiRun?: MiraAiRun;
};

export function createDemoAiRun(): MiraAiRun {
  return async (request) => {
    const prompt = request.prompt?.trim() || "Continue";
    const seed =
      request.selectionMarkdown ||
      request.blockMarkdown ||
      request.markdown.slice(0, 240);
    return `<!-- mira-ai-demo -->\n\n${prompt}\n\n${seed}`;
  };
}

function configGet(app: App, key: string, fallback: unknown): unknown {
  return app.configuration.getConfiguration().get(key, fallback as never);
}

export function resolveMarkdownMiraExtensions(app: App, aiRun?: MiraAiRun) {
  const get = <T>(key: string, fallback?: T) =>
    configGet(app, key, fallback) as T;
  const features = readMiraFeatureFlags(get) as MiraFeatureFlags;
  const mermaidEnabled =
    Boolean(get("markdown.mira.plugins.mermaid.enabled", true)) &&
    features.mermaid !== false;
  const aiEnabled = Boolean(get("markdown.mira.plugins.ai.enabled", false));

  const featureFlags: MiraFeatureFlags = {
    ...features,
    mermaid: mermaidEnabled,
  };

  const miraExtensions: MiraExtension[] = [
    ...createMiraEditorExtensions({ features: featureFlags }),
  ];

  if (aiEnabled && aiRun) {
    miraExtensions.push(
      aiExtension({
        enabled: true,
        run: aiRun,
        slashCommand: Boolean(
          get("markdown.mira.plugins.ai.slashCommand", true),
        ),
        blockAction: Boolean(get("markdown.mira.plugins.ai.blockAction", true)),
        label: String(get("markdown.mira.plugins.ai.label", "Ask AI")),
      }),
    );
  }

  return { features: featureFlags, miraExtensions, mermaidEnabled, aiEnabled };
}

export function createMarkdownEditorExtensions(
  options: MiraMarkdownExtensionOptions,
): Extension {
  const { miraExtensions } = resolveMarkdownMiraExtensions(
    options.app,
    options.aiRun,
  );
  const livePreview = options.mode === "live-preview";
  const indentGuides = Boolean(
    configGet(options.app, "editor.display.showIndentationGuides", true),
  );

  return markupEditor(
    { language: "markdown" },
    ...createMarkdownCodeMirrorExtensions({ sourceMode: !livePreview }),
    ...createRichEditorExtensions({
      livePreview,
      sourcePath: options.sourcePath,
      extensions: miraExtensions,
      fileAdapter: createLapisMiraFileAdapter(options.app),
      indentGuides,
    }),
    EditorView.editorAttributes.of({
      class:
        options.mode === "source"
          ? "markdown-source-view markdown-source-mode"
          : "markdown-live-preview-view markdown-live-preview-mode cm-live-preview",
    }),
  );
}
