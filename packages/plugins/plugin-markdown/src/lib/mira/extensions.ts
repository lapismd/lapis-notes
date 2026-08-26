import type { Extension } from "@codemirror/state";
import { EditorView, ViewPlugin } from "@codemirror/view";
import {
  createMiraCodeMirrorExtensions,
  openImageFilePicker,
  type MiraCodeMirrorExtensionsOptions,
} from "@lapismd/mira/core";
import { applyMarkdownTemplate } from "@lapismd/mira/codemirror";
import {
  doodleDividersExtension,
  mountMiraExtensionStyles,
  resolveMiraExtensions,
  selectionToolbarExtension,
  type MiraExtension,
  type MiraExtensionRuntimeContext,
  type MiraTemplateSelection,
} from "@lapismd/mira/extensions";
import {
  createMiraEditorExtensions,
  MiraFeature,
  resolveMiraEditorBlockControls,
  type MiraEditorFeatureConfigs,
  type MiraFeatureFlags,
} from "@lapismd/mira-editor";
import { aiExtension, type MiraAiRun } from "@lapismd/mira-plugin-ai";
import type { App, MarkdownSurfaceContext } from "@lapis-notes/api";
import { markupEditor } from "@lapis-notes/api/editor/core";
import { languageServiceExtensions } from "@lapis-notes/api/editor/language-service";
import {
  MIRA_EDITOR_SETTING_KEYS,
  MIRA_DOCUMENT_SETTING_KEYS,
  readMarkdownSetting,
  readMiraFeatureFlags,
} from "./config";
import { createLapisMiraFileAdapter } from "./file-adapter";
import { createLapisFrontmatterPropertyManager } from "../frontmatter/lapis-frontmatter-adapter";
import {
  resolveRegisteredMarkdownMiraExtensions,
  type RegisteredMarkdownMiraExtensionOptions,
} from "./registered-extensions";

export type MiraMarkdownExtensionOptions = {
  app: App;
  mode: "source" | "live-preview";
  sourcePath?: string;
  aiRun?: MiraAiRun;
  surface?: MarkdownSurfaceContext;
};

export type MarkdownMiraEditorSettings = {
  toolbar: boolean;
  selectionToolbar: boolean;
  blockToolbar: boolean;
  doodleDividers: boolean;
};

type MiraEditorView = Parameters<typeof applyMarkdownTemplate>[0];

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

function configurationReader(app: App) {
  return <T>(key: string, fallback?: T) => configGet(app, key, fallback) as T;
}

export function readMarkdownMiraEditorSettings(
  app: App,
): MarkdownMiraEditorSettings {
  const get = configurationReader(app);
  return {
    toolbar: readMarkdownSetting<boolean>(
      get,
      MIRA_EDITOR_SETTING_KEYS.toolbar,
    ),
    selectionToolbar: readMarkdownSetting<boolean>(
      get,
      MIRA_EDITOR_SETTING_KEYS.selectionToolbar,
    ),
    blockToolbar: readMarkdownSetting<boolean>(
      get,
      MIRA_EDITOR_SETTING_KEYS.blockToolbar,
    ),
    doodleDividers: readMarkdownSetting<boolean>(
      get,
      MIRA_EDITOR_SETTING_KEYS.doodleDividers,
    ),
  };
}

export function resolveMarkdownMiraExtensions(
  app: App,
  aiRun?: MiraAiRun,
  surfaceOptions?: Omit<
    RegisteredMarkdownMiraExtensionOptions,
    "sourcePath"
  > & {
    sourcePath?: string;
  },
) {
  const get = configurationReader(app);
  const features = readMiraFeatureFlags(get) as MiraFeatureFlags;
  const editorSettings = readMarkdownMiraEditorSettings(app);
  const mermaidEnabled =
    Boolean(
      readMarkdownSetting<boolean>(
        get,
        "markdown.mira.plugins.mermaid.enabled",
      ),
    ) && features.mermaid !== false;
  const aiEnabled = Boolean(
    readMarkdownSetting<boolean>(get, "markdown.mira.plugins.ai.enabled"),
  );
  const frontmatterDefaultOpen = readMarkdownSetting<boolean>(
    get,
    MIRA_DOCUMENT_SETTING_KEYS.frontmatterDefaultOpen,
  );
  const outlineNavigation = readMarkdownSetting<boolean>(
    get,
    MIRA_DOCUMENT_SETTING_KEYS.outlineNavigation,
  );

  const featureFlags: MiraFeatureFlags = {
    ...features,
    mermaid: mermaidEnabled,
  };
  const featureConfigs: MiraEditorFeatureConfigs = {
    [MiraFeature.BlockControls]: {
      enabled: featureFlags[MiraFeature.BlockControls] !== false,
      toolbar: editorSettings.blockToolbar,
    },
  };
  const miraExtensions: MiraExtension[] = [
    ...createMiraEditorExtensions({
      features: featureFlags,
      featureConfigs,
    }),
  ];

  if (
    editorSettings.selectionToolbar &&
    featureFlags[MiraFeature.Formatting] !== false
  ) {
    miraExtensions.push(selectionToolbarExtension());
  }
  if (editorSettings.doodleDividers) {
    miraExtensions.push(doodleDividersExtension());
  }

  if (aiEnabled && aiRun) {
    miraExtensions.push(
      aiExtension({
        enabled: true,
        run: aiRun,
        slashCommand: readMarkdownSetting<boolean>(
          get,
          "markdown.mira.plugins.ai.slashCommand",
        ),
        blockAction: readMarkdownSetting<boolean>(
          get,
          "markdown.mira.plugins.ai.blockAction",
        ),
        label: readMarkdownSetting<string>(
          get,
          "markdown.mira.plugins.ai.label",
        ),
      }),
    );
  }

  if (surfaceOptions) {
    miraExtensions.push(
      ...resolveRegisteredMarkdownMiraExtensions(app, {
        ...surfaceOptions,
        sourcePath: surfaceOptions.sourcePath ?? "",
      }),
    );
  }

  return {
    features: featureFlags,
    featureConfigs,
    editorSettings,
    miraExtensions,
    mermaidEnabled,
    aiEnabled,
    frontmatterDefaultOpen,
    outlineNavigation,
  };
}

function createRuntimeContext(
  view: EditorView | MiraEditorView,
  options: MiraMarkdownExtensionOptions,
): MiraExtensionRuntimeContext {
  const activeView = view as unknown as EditorView;
  const replace = (
    markdown: string,
    from: number,
    to: number,
    selection?: MiraTemplateSelection,
  ) => {
    applyMarkdownTemplate(
      activeView as unknown as MiraEditorView,
      selection === undefined ? markdown : { markdown, selection },
      from,
      to,
    );
  };

  return {
    view: activeView,
    mode: options.mode,
    readonly: false,
    sourcePath: options.sourcePath,
    getValue: () => activeView.state.doc.toString(),
    setValue: (value) => {
      activeView.dispatch({
        changes: { from: 0, to: activeView.state.doc.length, insert: value },
      });
    },
    focus: () => activeView.focus(),
    insertMarkdown: (markdown, selection) => {
      const range = activeView.state.selection.main;
      replace(markdown, range.from, range.to, selection);
    },
    insertImage: () =>
      openImageFilePicker(
        activeView as unknown as Parameters<typeof openImageFilePicker>[0],
      ),
    replaceRange: (markdown, range, selection) => {
      replace(markdown, range.from, range.to, selection);
    },
  };
}

export function createMiraExtensionLifecycle(
  extensions: MiraExtension[],
  options: MiraMarkdownExtensionOptions,
): Extension {
  return ViewPlugin.define((view) => {
    const resolved = resolveMiraExtensions(extensions, {
      mode: options.mode,
      readonly: false,
      sourcePath: options.sourcePath,
    });
    const cleanups: Array<() => void> = [
      mountMiraExtensionStyles(resolved.styles, view.dom.ownerDocument.head),
    ];
    const context = createRuntimeContext(view, options);
    for (const mountExtension of resolved.onMount) {
      const cleanup = mountExtension(context);
      if (typeof cleanup === "function") {
        cleanups.push(cleanup);
      }
    }
    return {
      destroy() {
        for (const cleanup of cleanups.reverse()) cleanup();
      },
    };
  });
}

export function createMarkdownMiraCodeMirrorOptions(
  options: MiraMarkdownExtensionOptions,
  resolved = resolveMarkdownMiraExtensions(options.app, options.aiRun),
): MiraCodeMirrorExtensionsOptions {
  const indentGuides = Boolean(
    configGet(options.app, "editor.display.showIndentationGuides", true),
  );
  const indentWidth = Number(
    configGet(options.app, "editor.behaviour.indentVisualWidth", 2),
  );
  const indentWithTabs = Boolean(
    configGet(options.app, "editor.behaviour.indentUsingTabs", true),
  );

  return {
    mode: options.mode,
    includeBaseExtensions: false,
    extensions: resolved.miraExtensions,
    sourcePath: options.sourcePath,
    fileAdapter: createLapisMiraFileAdapter(options.app),
    frontmatterOpen: resolved.frontmatterDefaultOpen,
    frontmatterConfig: createLapisFrontmatterPropertyManager(options.app)
      .config,
    indentGuides,
    indentWidth,
    indentWithTabs,
    blockControls: resolveMiraEditorBlockControls({
      features: resolved.features,
      featureConfigs: resolved.featureConfigs,
    }),
    runtimeContext: (view) => createRuntimeContext(view, options),
  };
}

export function createMarkdownEditorExtensions(
  options: MiraMarkdownExtensionOptions,
): Extension {
  const resolved = resolveMarkdownMiraExtensions(options.app, options.aiRun, {
    mode: options.mode,
    sourcePath: options.sourcePath,
    surface: options.surface ?? { id: "workspace" },
  });
  const codeMirrorOptions = createMarkdownMiraCodeMirrorOptions(
    options,
    resolved,
  );

  return markupEditor(
    { language: "markdown", app: options.app },
    ...createMiraCodeMirrorExtensions(codeMirrorOptions),
    ...languageServiceExtensions({
      languageId: "markdown",
      completion: false,
      hover: false,
    }),
    createMiraExtensionLifecycle(resolved.miraExtensions, options),
    EditorView.editorAttributes.of({
      class:
        options.mode === "source"
          ? "markdown-source-view markdown-source-mode"
          : "markdown-live-preview-view markdown-live-preview-mode cm-live-preview",
    }),
  );
}
