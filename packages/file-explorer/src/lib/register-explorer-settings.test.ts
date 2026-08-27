import { describe, expect, it } from "vitest";
import {
  DEFAULT_VAULT_PALETTE_FILE_EXTENSIONS,
  EXPLORER_SETTING_IDS,
} from "./explorer-settings";
import { createExplorerSettingsSection } from "./register-explorer-settings";

describe("Explorer settings section", () => {
  it("exposes the configurable file-palette extension allowlist", () => {
    const section = createExplorerSettingsSection();
    const field = section.fields.find(
      (candidate) =>
        candidate.id === EXPLORER_SETTING_IDS.paletteFileExtensions,
    );

    expect(field).toMatchObject({
      type: "list",
      itemType: "string",
      title: "File palette extensions",
      default: [...DEFAULT_VAULT_PALETTE_FILE_EXTENSIONS],
    });
  });
});
