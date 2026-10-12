export const VIEW_PROBLEM_ACTION = "View Problem";

export type LintTooltipAction = {
  name: string;
  onClick: (event: MouseEvent) => void;
};

export function splitLintTooltipActions(actions: readonly LintTooltipAction[]): {
  viewProblem: LintTooltipAction | undefined;
  quickFixActions: LintTooltipAction[];
} {
  return {
    viewProblem: actions.find((action) => action.name === VIEW_PROBLEM_ACTION),
    quickFixActions: actions.filter(
      (action) => action.name !== VIEW_PROBLEM_ACTION,
    ),
  };
}
