import { describe, expect, it } from "vitest";
import { WordCountStatus, WORDCOUNT_STATUS_ID } from "./status-item";

function createStatusBar() {
  const items: Record<string, Record<string, unknown>> = {};
  return {
    items,
    upsertItem(item: { id: string }) {
      items[item.id] = item;
    },
    unregisterItem(id: string) {
      delete items[id];
    },
  };
}

describe("word count status item", () => {
  it("upserts word and character segments", () => {
    const statusBar = createStatusBar();
    const status = new WordCountStatus(
      statusBar as never,
      "wordcount:reading-time",
      "wordcount",
    );

    status.show("one two three");

    expect(statusBar.items[WORDCOUNT_STATUS_ID]).toMatchObject({
      id: WORDCOUNT_STATUS_ID,
      sourcePlugin: "wordcount",
      command: "wordcount:reading-time",
      segments: ["3 words", "13 characters"],
    });
  });

  it("hides the item for non-text leaves", () => {
    const statusBar = createStatusBar();
    const status = new WordCountStatus(
      statusBar as never,
      "wordcount:reading-time",
      "wordcount",
    );
    status.show("hello");
    status.hide();

    expect(statusBar.items[WORDCOUNT_STATUS_ID]).toBeUndefined();
    expect(status.content).toBe("");
  });
});
