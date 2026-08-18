import { WorkspaceMenu } from "@lapismd/design-core/workspace/core";

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

export function createLintQuickFixMenu(
  actions: readonly LintTooltipAction[],
): WorkspaceMenu {
  const menu = new WorkspaceMenu();
  for (const action of actions) {
    menu.addItem((item) =>
      item
        .setTitle(action.name)
        .setIcon("lightbulb")
        .setSection("fix")
        .onClick((event) => {
          action.onClick(
            event instanceof MouseEvent ? event : new MouseEvent("click"),
          );
        }),
    );
  }
  return menu;
}
