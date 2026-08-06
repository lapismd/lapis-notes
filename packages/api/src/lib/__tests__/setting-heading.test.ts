// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import "$lib/enhance";
import {
  SETTING_SECTION_BODY_CLASS,
  SETTING_SECTION_CLASS,
  SETTING_SECTION_HEADING_DESCRIPTION_CLASS,
  SETTING_SECTION_HEADING_TITLE_CLASS,
} from "../setting-section-layout";
import { Setting } from "../settings.svelte";

function createPluginTabRoot(): HTMLElement {
  const root = document.createElement("div");
  root.className = "workspace-shell__settings-plugin-tab";
  document.body.appendChild(root);
  return root;
}

describe("Setting.setHeading section layout", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("creates section heading outside the body panel", () => {
    const root = createPluginTabRoot();

    new Setting(root)
      .setName("Storage")
      .setDesc("Choose where task notes live.")
      .setHeading();

    expect(root.querySelector(".setting-item")).toBeNull();
    expect(root.querySelectorAll(`.${SETTING_SECTION_CLASS}`)).toHaveLength(1);

    const section = root.querySelector(`.${SETTING_SECTION_CLASS}`);
    const headingTitle = section?.querySelector(
      `.${SETTING_SECTION_HEADING_TITLE_CLASS}`,
    );
    const body = section?.querySelector(`.${SETTING_SECTION_BODY_CLASS}`);

    expect(headingTitle?.textContent).toBe("Storage");
    expect(
      section?.querySelector(`.${SETTING_SECTION_HEADING_DESCRIPTION_CLASS}`)
        ?.textContent,
    ).toBe("Choose where task notes live.");
    expect(body?.contains(headingTitle ?? null)).toBe(false);
  });

  it("routes subsequent settings into the active section body", () => {
    const root = createPluginTabRoot();

    new Setting(root).setName("Storage").setHeading();
    new Setting(root)
      .setName("Task folder")
      .setDesc("Managed folder path.")
      .addToggle(() => {});

    const body = root.querySelector(`.${SETTING_SECTION_BODY_CLASS}`);
    expect(body?.querySelectorAll(".setting-item")).toHaveLength(1);
    expect(
      root
        .querySelector(".setting-item")
        ?.closest(`.${SETTING_SECTION_BODY_CLASS}`),
    ).toBe(body);
  });

  it("opens a new section for each heading", () => {
    const root = createPluginTabRoot();

    new Setting(root).setName("Storage").setHeading();
    new Setting(root).setName("Task folder").addToggle(() => {});
    new Setting(root).setName("Defaults").setHeading();
    new Setting(root).setName("Default status").addToggle(() => {});

    const sections = root.querySelectorAll(`.${SETTING_SECTION_CLASS}`);
    expect(sections).toHaveLength(2);
    expect(sections[0]?.querySelectorAll(".setting-item")).toHaveLength(1);
    expect(sections[1]?.querySelectorAll(".setting-item")).toHaveLength(1);
  });

  it("creates an implicit section body for headingless plugin tabs", async () => {
    const root = createPluginTabRoot();

    new Setting(root).setName("Default zoom").setDesc("Initial zoom level.");
    await Promise.resolve();

    expect(root.querySelectorAll(`.${SETTING_SECTION_CLASS}`)).toHaveLength(1);
    expect(
      root
        .querySelector(`.${SETTING_SECTION_BODY_CLASS}`)
        ?.querySelectorAll(".setting-item"),
    ).toHaveLength(1);
    expect(
      root.querySelector(`.${SETTING_SECTION_HEADING_TITLE_CLASS}`),
    ).toBeNull();
  });

  it("resets routing after containerEl.empty()", async () => {
    const root = createPluginTabRoot();

    new Setting(root).setName("Storage").setHeading();
    new Setting(root).setName("Task folder").addToggle(() => {});

    root.empty();

    new Setting(root).setName("Default zoom").addDropdown(() => {});

    expect(root.querySelectorAll(`.${SETTING_SECTION_CLASS}`)).toHaveLength(1);
    expect(
      root
        .querySelector(`.${SETTING_SECTION_BODY_CLASS}`)
        ?.querySelectorAll(".setting-item"),
    ).toHaveLength(1);
  });

  it("omits description node when description is empty", () => {
    const root = createPluginTabRoot();

    new Setting(root).setName("Storage").setDesc("").setHeading();

    const section = root.querySelector(`.${SETTING_SECTION_CLASS}`);
    expect(
      section?.querySelector(`.${SETTING_SECTION_HEADING_DESCRIPTION_CLASS}`),
    ).toBeNull();
  });

  it("routes plugin list rows into setHeading section bodies", () => {
    const root = createPluginTabRoot();

    new Setting(root).setName("Installed Core Plugins").setHeading();
    new Setting(root)
      .setName("Example Plugin")
      .setClass("plugin-extension-setting")
      .addToggle(() => {});

    const section = root.querySelector(`.${SETTING_SECTION_CLASS}`);
    expect(
      section?.querySelector(`.${SETTING_SECTION_HEADING_TITLE_CLASS}`)
        ?.textContent,
    ).toBe("Installed Core Plugins");
    expect(
      section
        ?.querySelector(`.${SETTING_SECTION_BODY_CLASS}`)
        ?.querySelectorAll(".setting-item.plugin-extension-setting"),
    ).toHaveLength(1);
    expect(root.querySelectorAll(".setting-item")).toHaveLength(1);
  });

  it("mounts heading buttons on setHeading sections", () => {
    const root = createPluginTabRoot();

    new Setting(root)
      .setName("Installed Plugins")
      .setHeading()
      .addButton((btn) => {
        btn.setIcon("rotate-cw").setTooltip("Reload plugins");
      });

    const heading = root.querySelector(
      ".setting-section-heading--with-actions",
    );
    expect(heading).not.toBeNull();
    expect(
      heading?.querySelector(".setting-section-heading-actions button"),
    ).not.toBeNull();
    expect(root.querySelector(".setting-item")).toBeNull();
  });

  it("updates heading descriptions after setHeading", () => {
    const root = createPluginTabRoot();

    new Setting(root)
      .setName("Storage")
      .setHeading()
      .setDesc("Choose where task notes live.");

    expect(
      root.querySelector(`.${SETTING_SECTION_HEADING_DESCRIPTION_CLASS}`)
        ?.textContent,
    ).toBe("Choose where task notes live.");
  });

  it("supports heading descriptions after heading actions", () => {
    const root = createPluginTabRoot();

    new Setting(root)
      .setName("Installed Plugins")
      .setHeading()
      .addButton((btn) => {
        btn.setIcon("rotate-cw").setTooltip("Reload plugins");
      })
      .setDesc("Reload community plugins from the vault folder.");

    const heading = root.querySelector(
      ".setting-section-heading--with-actions",
    );
    const description = heading?.querySelector(
      `.${SETTING_SECTION_HEADING_DESCRIPTION_CLASS}`,
    );
    const actions = heading?.querySelector(`.setting-section-heading-actions`);

    expect(description?.textContent).toBe(
      "Reload community plugins from the vault folder.",
    );
    expect(
      [...(heading?.children ?? [])].indexOf(description ?? root),
    ).toBeLessThan([...(heading?.children ?? [])].indexOf(actions ?? root));
  });
});
