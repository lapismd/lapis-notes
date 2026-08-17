import type { Menu, StatusBarManager } from "@lapis-notes/api";
import { getCharacterCount, getWordCount, readingMinutes } from "./counts";
import {
  WORDCOUNT_DEFAULT_READING_SPEED,
  WORDCOUNT_STATUS_ID,
} from "./ids";

export { WORDCOUNT_STATUS_ID };

export class WordCountStatus {
  content = "";

  constructor(
    private readonly statusBar: StatusBarManager,
    private readonly commandId: string,
    private readonly sourcePlugin: string,
  ) {}

  readingTimeTitle(wordsPerMinute = WORDCOUNT_DEFAULT_READING_SPEED): string {
    return `${readingMinutes(this.content, wordsPerMinute)} min read`;
  }

  appendReadingTime(
    menu: Menu,
    wordsPerMinute = WORDCOUNT_DEFAULT_READING_SPEED,
  ): void {
    menu.addItem((item) =>
      item.setTitle(this.readingTimeTitle(wordsPerMinute)).setIcon("book-open"),
    );
  }

  show(text: string): void {
    this.content = text;
    this.statusBar.upsertItem({
      id: WORDCOUNT_STATUS_ID,
      sourcePlugin: this.sourcePlugin,
      tooltip: "Reading time",
      segments: [
        `${getWordCount(text)} words`,
        `${getCharacterCount(text)} characters`,
      ],
      command: this.commandId,
      buildMenu: (menu) => this.appendReadingTime(menu),
    });
  }

  hide(): void {
    this.content = "";
    this.statusBar.unregisterItem(WORDCOUNT_STATUS_ID);
  }
}
