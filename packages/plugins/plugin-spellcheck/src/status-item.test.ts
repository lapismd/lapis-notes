import { describe, expect, it, vi } from "vitest";
import { SPELLCHECK_STATUS_ID } from "./ids";
import { SpellcheckStatus } from "./status-item";

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

describe("spellcheck status item", () => {
  it("shows dialect text without flag emoji", () => {
    const statusBar = createStatusBar();
    const status = new SpellcheckStatus(
      statusBar as never,
      "spellcheck:status",
      vi.fn(),
      vi.fn(),
    );
    status.show("british", true);
    expect(statusBar.items[SPELLCHECK_STATUS_ID]).toMatchObject({
      id: SPELLCHECK_STATUS_ID,
      icon: "spell-check",
      segments: ["GB"],
      tooltip: "Spell Check",
    });
    expect(JSON.stringify(statusBar.items[SPELLCHECK_STATUS_ID])).not.toMatch(
      /[\uD83C][\uDDE6-\uDDFF]/u,
    );

    const upsertItem = vi.spyOn(statusBar, "upsertItem");
    status.show("british", true);
    expect(upsertItem).not.toHaveBeenCalled();
    status.show("american", true);
    expect(upsertItem).toHaveBeenCalledOnce();
  });

  it("builds dialect and checking menu items", () => {
    const onSelect = vi.fn();
    const onToggle = vi.fn();
    const status = new SpellcheckStatus(
      createStatusBar() as never,
      "spellcheck:status",
      onSelect,
      onToggle,
    );
    const titles: string[] = [];
    status.appendMenu(
      {
        addItem(callback: (item: any) => void) {
          const item = {
            setTitle(title: string) {
              titles.push(title);
              return item;
            },
            setIcon() {
              return item;
            },
            setChecked() {
              return item;
            },
            onClick(handler: () => void) {
              if (titles.at(-1) === "Canadian") handler();
              if (titles.at(-1) === "Disable automatic checking") handler();
              return item;
            },
          };
          callback(item);
        },
        addSeparator() {
          titles.push("---");
        },
      } as never,
      "american",
      true,
    );
    expect(titles).toEqual([
      "American",
      "British",
      "Canadian",
      "Australian",
      "Indian",
      "---",
      "Disable automatic checking",
    ]);
    expect(onSelect).toHaveBeenCalledWith("canadian");
    expect(onToggle).toHaveBeenCalledOnce();
  });
});
