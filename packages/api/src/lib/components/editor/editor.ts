import { indentUnit } from "@codemirror/language";
import { Compartment, EditorState, type Extension } from "@codemirror/state";
import {
  EditorView,
  GutterMarker,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { indentMore, indentLess } from "@codemirror/commands";
import { createBaseCodeMirrorExtensions } from "@lapismd/mira/codemirror";
import { foldGutter } from "$lib/components/editor/extensions/fold-gutter";

export class BlockLineMarker extends GutterMarker {
  constructor(
    readonly from: number,
    readonly to: number,
  ) {
    super();
  }

  eq(other: BlockLineMarker): boolean {
    return this.from === other.from && this.to === other.to;
  }

  toDOM() {
    const div = createDiv();
    div.className = "cm-line-block";
    div.createDiv({ cls: "" }).setText(this.from.toString());
    if (this.from !== this.to) {
      const mid = Math.floor((this.from + this.to) / 2);
      div.createDiv({ cls: "" }).setText(mid.toString());
      div.createDiv({ cls: "" }).setText(this.to.toString());
    }
    return div;
  }
}

export class EditorConfig {
  readonly configs: Record<
    string,
    { config: Compartment; controller: (value: any) => Extension | null }
  > = {};

  register<T>(key: string, controller: (value: T) => Extension | null) {
    const compartment = new Compartment();
    this.configs[key] = { config: compartment, controller };
  }

  has(key: string) {
    return !!this.configs[key];
  }

  get extension(): Extension {
    const config = app.configuration.getConfiguration();
    return Object.entries(this.configs).map(([key, props]) =>
      props.config.of(props.controller(config.get(key)) || []),
    );
  }

  update<T>(view: EditorView, key: string, value?: T) {
    if (!this.has(key)) return;
    const props = this.configs[key];
    const configValue = value ?? app.configuration.getConfiguration().get(key);
    const newValue = props.controller(configValue) || [];
    view.dispatch({ effects: props.config.reconfigure(newValue) });
  }
}

export type MarkupEditorOptions = {
  /** Stable language id written to the CM host as `data-language`. */
  language?: string;
};

/**
 * Source-editor CodeMirror shell backed by Mira base extensions + Lapis live
 * configuration compartments. Language packs are passed in by the caller;
 * Markdown live-preview / rich Mira surfaces are not included.
 */
export function markupEditor(
  options: MarkupEditorOptions = {},
  ...extensions: Extension[]
): Extension {
  const language = options.language?.trim() || "text";
  return [
    ...extensions,
    ...createBaseCodeMirrorExtensions({
      // Lapis editorConfig compartments own these live toggles.
      lineNumbers: false,
      lineWrapping: false,
      spellcheck: false,
    }),
    editorConfig.extension,
    EditorView.editorAttributes.of({
      class: "cm-editor-source markdown-editor-surface",
      "data-language": language,
    }),
    EditorView.contentAttributes.of({ "aria-label": "Source editor" }),
  ];
}

export const editorConfig = new EditorConfig();

function normalizeIndentWidth(width: number | undefined | null): number {
  if (typeof width !== "number" || !Number.isFinite(width)) {
    return 2;
  }

  return Math.max(1, Math.floor(width));
}

editorConfig.register(
  "editor.display.showLineNumbers",
  (show: boolean | undefined | null) => {
    show = show ?? true;
    return show
      ? [
          lineNumbers({}),
          // lineNumberWidgetMarker.of((view, widget, block) => {
          //   if (block.from > 1) {
          //     return new BlockLineMarker(
          //       view.state.doc.lineAt(block.from).number,
          //       view.state.doc.lineAt(block.to).number,
          //     );
          //   }
          //   return null;
          // }),
        ]
      : [];
  },
);

editorConfig.register(
  "editor.display.foldIndent",
  (fold: boolean | undefined | null) => {
    // Language packs supply fold ranges; Mira base registers codeFolding() +
    // foldKeymap. This mounts the Mira-styled fold gutter chevrons.
    fold = fold ?? true;
    return fold ? foldGutter() : [];
  },
);

editorConfig.register(
  "editor.display.wrapLines",
  (wrap: boolean | undefined | null) => {
    wrap = wrap ?? true;
    return wrap ? [EditorView.lineWrapping] : [];
  },
);

editorConfig.register(
  "editor.display.showIndentationGuides",
  (show: boolean) =>
    show
      ? EditorView.editorAttributes.of({ class: "cm-show-indentation-guides" })
      : [],
);

editorConfig.register(
  "editor.behaviour.indentVisualWidth",
  (width: number | undefined | null) => {
    const normalizedWidth = normalizeIndentWidth(width);
    return EditorState.tabSize.of(normalizedWidth);
  },
);

editorConfig.register(
  "editor.behaviour.indentUsingTabs",
  (useTabs: boolean | undefined | null) => {
    const config = app.configuration.getConfiguration();
    const width = normalizeIndentWidth(
      config.get("editor.behaviour.indentVisualWidth"),
    );

    return [
      indentUnit.of((useTabs ?? true) ? "\t" : " ".repeat(width)),
      keymap.of([
        {
          key: "Tab",
          run: indentMore,
          shift: indentLess,
        },
      ]),
    ];
  },
);
