import { describe, expect, it } from "vitest";

import {
  createDenoApplicationMenu,
  DENO_MENU_IDS,
  type DenoMenuItem,
} from "./application-menu";

function group(menu: DenoMenuItem[], label: string): DenoMenuItem[] {
  const item = menu.find(
    (candidate): candidate is Extract<DenoMenuItem, { submenu: unknown }> =>
      typeof candidate === "object" &&
      "submenu" in candidate &&
      candidate.submenu.label === label,
  );
  if (!item) throw new Error(`Missing menu group: ${label}`);
  return item.submenu.items;
}

function actionIds(items: DenoMenuItem[]): string[] {
  return items.flatMap((item) =>
    typeof item === "object" && "item" in item ? [item.item.id] : [],
  );
}

describe("Deno application menu", () => {
  it("puts About and Quit in the first macOS application submenu", () => {
    const menu = createDenoApplicationMenu("darwin");
    expect(
      typeof menu[0] === "object" && "submenu" in menu[0]
        ? menu[0].submenu.label
        : null,
    ).toBe("Lapis Notes");
    expect(actionIds(group(menu, "Lapis Notes"))).toContain(
      DENO_MENU_IDS.about,
    );
    expect(group(menu, "Lapis Notes")).toContainEqual({
      role: { role: "quit" },
    });
  });

  it("projects all Electron menu groups and host actions", () => {
    const menu = createDenoApplicationMenu("linux");
    expect(
      menu.map((item) =>
        typeof item === "object" && "submenu" in item
          ? item.submenu.label
          : null,
      ),
    ).toEqual(["File", "Edit", "View", "Window", "Help"]);
    expect(actionIds(group(menu, "File"))).toContain(DENO_MENU_IDS.openVault);
    expect(actionIds(group(menu, "View"))).toEqual(
      expect.arrayContaining([
        DENO_MENU_IDS.reload,
        DENO_MENU_IDS.toggleDevtools,
      ]),
    );
    expect(actionIds(group(menu, "Help"))).toEqual(
      expect.arrayContaining([DENO_MENU_IDS.about, DENO_MENU_IDS.learnMore]),
    );
    expect(group(menu, "Edit")).toContainEqual({ role: { role: "undo" } });
  });

  it("keeps unsupported Electron roles visible and disabled", () => {
    const view = group(createDenoApplicationMenu("darwin"), "View");
    const disabledLabels = view.flatMap((item) =>
      typeof item === "object" && "item" in item && !item.item.enabled
        ? [item.item.label]
        : [],
    );
    expect(disabledLabels).toEqual([
      "Force Reload",
      "Actual Size",
      "Zoom In",
      "Zoom Out",
      "Toggle Full Screen",
    ]);
  });
});
