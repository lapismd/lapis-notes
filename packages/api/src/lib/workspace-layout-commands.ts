import type { App } from "./context.svelte";
import { promptConfirm } from "./prompt-confirm";
import { FuzzySuggestModal, SuggestModal } from "./suggest";

class SaveWorkspaceLayoutModal extends SuggestModal<string> {
  constructor(
    app: App,
    private readonly existingNames: string[],
    private readonly onSave: (name: string) => Promise<void>,
  ) {
    super(app);
    this.setPlaceholder("Layout name");
    this.emptyStateText = "Type a name to save this layout";
    this.setInstructions([
      { command: "↵", purpose: "Save" },
      { command: "esc", purpose: "Cancel" },
    ]);
  }

  getSuggestions(query: string): string[] {
    const name = query.trim();
    const matches = this.existingNames.filter((existing) =>
      existing.toLocaleLowerCase().includes(name.toLocaleLowerCase()),
    );
    if (name && !matches.includes(name)) return [name, ...matches];
    return matches.length > 0 ? matches : this.existingNames;
  }

  renderSuggestion(value: string, el: HTMLElement): void {
    el.textContent = this.existingNames.includes(value)
      ? `Replace “${value}”`
      : `Save as “${value}”`;
  }

  onChooseSuggestion(item: string): void {
    const name = item.trim();
    if (!name) return;
    void (async () => {
      if (this.existingNames.includes(name)) {
        const replace = await promptConfirm(
          this.app.workspace.getCommandHostDocument(),
          {
            title: "Replace workspace layout",
            description: `Replace the saved layout “${name}” with the current workspace?`,
            confirmLabel: "Replace",
          },
        );
        if (!replace) return;
      }
      await this.onSave(name);
    })();
  }
}

class LoadWorkspaceLayoutModal extends FuzzySuggestModal<string> {
  constructor(
    app: App,
    private readonly names: string[],
    private readonly onLoad: (name: string) => Promise<void>,
  ) {
    super(app);
    this.setPlaceholder("Load workspace layout");
    this.emptyStateText = "No saved workspace layouts";
  }

  getItems(): string[] {
    return this.names;
  }

  getItemText(item: string): string {
    return item;
  }

  onChooseItem(item: string): void {
    void this.onLoad(item);
  }
}

export function promptSaveWorkspaceLayout(
  app: App,
  existingNames: string[],
  onSave: (name: string) => Promise<void>,
): void {
  new SaveWorkspaceLayoutModal(app, existingNames, onSave).open();
}

export function promptLoadWorkspaceLayout(
  app: App,
  names: string[],
  onLoad: (name: string) => Promise<void>,
): void {
  new LoadWorkspaceLayoutModal(app, names, onLoad).open();
}
