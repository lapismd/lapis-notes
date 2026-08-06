import type { Action, Diagnostic } from "@codemirror/lint";
import type { LapisLintDiagnosticMeta } from "./lapis-lint-diagnostic-helpers";
import { toggleInlineProblem } from "./lapis-lint-inline-widget";

export type { LapisLintDiagnosticMeta } from "./lapis-lint-diagnostic-helpers";
export { markdownlintRuleUrl } from "./lapis-lint-diagnostic-helpers";

export interface MapToLapisLintDiagnosticOptions {
  actions?: Action[];
  includeViewProblem?: boolean;
  includeCopy?: boolean;
}

export interface LapisLintTooltipPayload {
  meta: LapisLintDiagnosticMeta;
  includeCopy: boolean;
  actions: Action[];
}

const tooltipPayloads = new WeakMap<Diagnostic, LapisLintTooltipPayload>();

export function getLapisLintTooltipPayload(
  diagnostic: Diagnostic,
): LapisLintTooltipPayload | null {
  return tooltipPayloads.get(diagnostic) ?? null;
}

/**
 * Enrich a CodeMirror diagnostic with Lapis lint tooltip chrome: rule links,
 * copy control, and optional built-in actions such as View Problem.
 */
export function mapToLapisLintDiagnostic(
  base: Omit<Diagnostic, "renderMessage" | "actions">,
  meta: LapisLintDiagnosticMeta = {},
  options: MapToLapisLintDiagnosticOptions = {},
): Diagnostic {
  const {
    actions = [],
    includeViewProblem = true,
    includeCopy = true,
  } = options;

  const builtInActions: Action[] = [];
  if (includeViewProblem) {
    builtInActions.push({
      name: "View Problem",
      apply: (view, from) => {
        toggleInlineProblem(view, from, {
          message: base.message,
          sourceLabel: meta.sourceLabel,
          ruleId:
            meta.ruleId ?? (meta.code != null ? String(meta.code) : undefined),
        });
      },
    });
  }

  const tooltipActions = [...builtInActions, ...actions];

  const diagnostic: Diagnostic = {
    ...base,
    // The Lapis hover tooltip owns action rendering. Keeping CodeMirror actions
    // empty prevents the default lint tooltip/panel from duplicating them.
    actions: [],
  };

  tooltipPayloads.set(diagnostic, {
    meta,
    includeCopy,
    actions: tooltipActions,
  });

  return diagnostic;
}
