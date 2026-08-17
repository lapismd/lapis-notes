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
      tooltip: "Reading time",
      segments: ["3 words", "13 characters"],
    });
  });

  it("adds reading time to the status click menu", () => {
    const statusBar = createStatusBar();
    const status = new WordCountStatus(
      statusBar as never,
      "wordcount:reading-time",
      "wordcount",
    );
    status.show("one two three four five");
    const item = statusBar.items[WORDCOUNT_STATUS_ID] as {
      buildMenu?: (menu: {
        addItem(
          callback: (entry: {
            setTitle(title: string): unknown;
            setIcon(icon: string): unknown;
          }) => void,
        ): void;
      }) => void;
    };
    const titles: string[] = [];
    item.buildMenu?.({
      addItem(callback) {
        callback({
          setTitle(title) {
            titles.push(title);
            return this;
          },
          setIcon() {
            return this;
          },
        });
      },
    });

    expect(titles).toEqual(["1 min read"]);
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
