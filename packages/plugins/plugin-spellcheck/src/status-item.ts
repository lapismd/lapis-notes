import type { Menu, StatusBarManager } from "@lapis-notes/api";
import { SPELLCHECK_PLUGIN_ID, SPELLCHECK_STATUS_ID } from "./ids";
import {
  dialectLabel,
  dialectSegment,
  SPELLCHECK_DIALECTS,
  type SpellcheckDialect,
} from "./settings";

export class SpellcheckStatus {
  private shown: {
    dialect: SpellcheckDialect;
    automaticChecking: boolean;
  } | null = null;

  constructor(
    private readonly statusBar: StatusBarManager,
    private readonly commandId: string,
    private readonly onSelectDialect: (dialect: SpellcheckDialect) => void,
    private readonly onToggleChecking: () => void,
  ) {}

  show(dialect: SpellcheckDialect, automaticChecking: boolean): void {
    if (
      this.shown?.dialect === dialect &&
      this.shown.automaticChecking === automaticChecking
    ) {
      return;
    }
    this.shown = { dialect, automaticChecking };
    this.statusBar.upsertItem({
      id: SPELLCHECK_STATUS_ID,
      sourcePlugin: SPELLCHECK_PLUGIN_ID,
      tooltip: "Spell Check",
      icon: "spell-check",
      segments: [dialectSegment(dialect)],
      command: this.commandId,
      buildMenu: (menu) => this.appendMenu(menu, dialect, automaticChecking),
    });
  }

  hide(): void {
    this.shown = null;
    this.statusBar.unregisterItem(SPELLCHECK_STATUS_ID);
  }

  appendMenu(
    menu: Menu,
    dialect: SpellcheckDialect,
    automaticChecking: boolean,
  ): void {
    for (const candidate of SPELLCHECK_DIALECTS) {
      menu.addItem((item) =>
        item
          .setTitle(dialectLabel(candidate))
          .setIcon("spell-check")
          .setChecked(candidate === dialect)
          .onClick(() => this.onSelectDialect(candidate)),
      );
    }
    menu.addSeparator();
    menu.addItem((item) =>
      item
        .setTitle(
          automaticChecking
            ? "Disable automatic checking"
            : "Enable automatic checking",
        )
        .setIcon(automaticChecking ? "pause" : "play")
        .onClick(() => this.onToggleChecking()),
    );
  }
}
