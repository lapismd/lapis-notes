import { lintGutter, linter, type LintSource } from "@codemirror/lint";
import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { getWorkspaceIconSvg } from "@lapismd/design-core/workspace/icon";
import { lapisLintHoverTooltip } from "./lapis-lint-hover-tooltip";
import { inlineProblemExtension } from "./lapis-lint-inline-widget";

const lintSeverityIcons = {
  error: "circle-x",
  warning: "triangle-alert",
  info: "info",
  hint: "lightbulb",
} as const;

export function workspaceLintMarkerMask(
  severity: keyof typeof lintSeverityIcons,
): string {
  const svg = getWorkspaceIconSvg(lintSeverityIcons[severity]);
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/**
 * Align tooltip typography and gutter markers with the app shell. Marker masks
 * are generated from the same public workspace icon source as Problems.
 */
const lapisLintTheme = EditorView.theme({
  ".cm-tooltip.cm-tooltip-lint": {
    fontFamily: "inherit",
    padding: 0,
  },
  ".cm-gutters .cm-gutter-lint .cm-gutterElement": {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    minWidth: "1.4em",
    paddingInline: "0.2em",
  },
  ".cm-lint-marker": {
    content: '"" !important',
    width: "0.875rem",
    height: "0.875rem",
    backgroundColor: "currentColor",
    backgroundImage: "none",
    maskPosition: "center",
    maskRepeat: "no-repeat",
    maskSize: "contain",
    WebkitMaskPosition: "center",
    WebkitMaskRepeat: "no-repeat",
    WebkitMaskSize: "contain",
  },
  ".cm-lint-marker-error": {
    color: "var(--ui-workspace-diagnostic-error, var(--destructive, #dc2626))",
    maskImage: workspaceLintMarkerMask("error"),
    WebkitMaskImage: workspaceLintMarkerMask("error"),
  },
  ".cm-lint-marker-warning": {
    color: "var(--ui-workspace-diagnostic-warning, var(--warning, #d97706))",
    maskImage: workspaceLintMarkerMask("warning"),
    WebkitMaskImage: workspaceLintMarkerMask("warning"),
  },
  ".cm-lint-marker-info": {
    color:
      "var(--ui-workspace-diagnostic-information, var(--muted-foreground, #64748b))",
    maskImage: workspaceLintMarkerMask("info"),
    WebkitMaskImage: workspaceLintMarkerMask("info"),
  },
  ".cm-lint-marker-hint": {
    color:
      "var(--ui-workspace-diagnostic-hint, var(--muted-foreground, #64748b))",
    maskImage: workspaceLintMarkerMask("hint"),
    WebkitMaskImage: workspaceLintMarkerMask("hint"),
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
    inlineProblemExtension,
    lapisLintHoverTooltip(),
    linter(source, withoutCodeMirrorTooltip(lint)),
  ];
  if (gutter !== false) {
    extensions.push(lintGutter(withoutCodeMirrorGutterTooltip(gutter)));
  }
  extensions.push(lapisLintTheme);
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
