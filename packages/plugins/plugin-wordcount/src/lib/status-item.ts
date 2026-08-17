import type { StatusBarManager } from "@lapis-notes/api";
import { getCharacterCount, getWordCount } from "./counts";
import { WORDCOUNT_STATUS_ID } from "./ids";

export { WORDCOUNT_STATUS_ID };

export class WordCountStatus {
  content = "";

  constructor(
    private readonly statusBar: StatusBarManager,
    private readonly commandId: string,
    private readonly sourcePlugin: string,
  ) {}

  show(text: string): void {
    this.content = text;
    this.statusBar.upsertItem({
      id: WORDCOUNT_STATUS_ID,
      sourcePlugin: this.sourcePlugin,
      segments: [
        `${getWordCount(text)} words`,
        `${getCharacterCount(text)} characters`,
      ],
      command: this.commandId,
    });
  }

  hide(): void {
    this.content = "";
    this.statusBar.unregisterItem(WORDCOUNT_STATUS_ID);
  }
}
