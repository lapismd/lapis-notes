import { lintGutter, linter, type LintSource } from "@codemirror/lint";
import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { lapisLintHoverTooltip } from "./lapis-lint-hover-tooltip";
import { inlineProblemExtension } from "./lapis-lint-inline-widget";

/**
 * Align tooltip typography with the app shell. Workspace-loaded CodeMirror lint
 * chrome lives in `packages/workspace/src/lib/styles/codemirror-lint.css`.
 */
const lapisLintTooltipTheme = EditorView.theme({
  ".cm-tooltip.cm-tooltip-lint": {
    fontFamily: "inherit",
    padding: 0,
  },
});

type LintConfig = NonNullable<Parameters<typeof linter>[1]>;
type LintGutterConfig = NonNullable<Parameters<typeof lintGutter>[0]>;

export interface LapisCodeMirrorLintOptions {
  source: LintSource | null;
  lint?: LintConfig;
  gutter?: LintGutterConfig | false;
}

export type LapisCodeMirrorLintConfig = LintConfig & {
  gutter?: LintGutterConfig | false;
};

function buildLapisCodeMirrorLintExtensions(
  source: LintSource | null,
  lint?: LintConfig,
  gutter?: LintGutterConfig | false,
): Extension[] {
  const extensions: Extension[] = [
    lapisLintTooltipTheme,
    inlineProblemExtension,
    lapisLintHoverTooltip(),
    linter(source, withoutCodeMirrorTooltip(lint)),
  ];
  if (gutter !== false) {
    extensions.push(lintGutter(withoutCodeMirrorGutterTooltip(gutter)));
  }
  return extensions;
}

function withoutCodeMirrorTooltip(lint?: LintConfig): LintConfig {
  return {
    ...lint,
    tooltipFilter: () => [],
  };
}

function withoutCodeMirrorGutterTooltip(
  gutter?: LintGutterConfig,
): LintGutterConfig {
  return {
    ...gutter,
    tooltipFilter: () => [],
  };
}

/**
 * Shared CodeMirror lint defaults for Lapis editors. Workspace CSS owns the
 * visible chrome; this sets shared behavior and a light `EditorView.theme`.
 */
export function lapisCodeMirrorLint(
  source: LintSource | null,
  config?: LapisCodeMirrorLintConfig,
): Extension[];
export function lapisCodeMirrorLint(
  options: LapisCodeMirrorLintOptions,
): Extension[];
export function lapisCodeMirrorLint(
  sourceOrOptions: LintSource | null | LapisCodeMirrorLintOptions,
  config: LapisCodeMirrorLintConfig = {},
): Extension[] {
  if (
    sourceOrOptions &&
    typeof sourceOrOptions === "object" &&
    "source" in sourceOrOptions
  ) {
    const { source, lint, gutter } = sourceOrOptions;
    return buildLapisCodeMirrorLintExtensions(source, lint, gutter);
  }

  const { gutter, ...lintConfig } = config;
  return buildLapisCodeMirrorLintExtensions(
    sourceOrOptions as LintSource | null,
    lintConfig,
    gutter,
  );
}

export {
  closeLintPanel,
  diagnosticCount,
  forEachDiagnostic,
  forceLinting,
  lintGutter,
  lintKeymap,
  linter,
  nextDiagnostic,
  openLintPanel,
  previousDiagnostic,
  setDiagnostics,
  setDiagnosticsEffect,
  type Action,
  type Diagnostic,
  type LintSource,
} from "@codemirror/lint";
