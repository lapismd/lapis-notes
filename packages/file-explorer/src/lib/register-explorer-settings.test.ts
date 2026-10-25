import type { Plugin } from "@lapis-notes/api";
import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_VAULT_PALETTE_FILE_EXTENSIONS,
  EXPLORER_SETTING_IDS,
} from "./explorer-settings";
import {
  createExplorerSettingsSection,
  registerExplorerSettings,
} from "./register-explorer-settings";

const hostBinding = vi.hoisted(() => ({
  missing: false,
  registerSettingsSection: vi.fn(() => vi.fn()),
}));

vi.mock("@lapis-notes/api/workspace-host", () => ({
  getWorkspaceHostBinding: () => {
    if (hostBinding.missing) {
      throw new Error("Workspace host binding is not initialized");
    }
    return {
      controller: {
        registerSettingsSection: hostBinding.registerSettingsSection,
      },
    };
  },
}));

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

  it("keeps enable alive when the workspace host binding is not initialized", () => {
    hostBinding.missing = true;
    const plugin = {
      app: { workspace: {} },
      register: vi.fn(),
    } as unknown as Plugin;

    expect(registerExplorerSettings(plugin)).toBe(false);
    expect(plugin.register).not.toHaveBeenCalled();
  });

  it("registers explorer settings once the host binding is visible", () => {
    hostBinding.missing = false;
    const dispose = vi.fn();
    hostBinding.registerSettingsSection.mockReturnValue(dispose);
    const plugin = {
      app: { workspace: {} },
      register: vi.fn(),
    } as unknown as Plugin;

    expect(registerExplorerSettings(plugin)).toBe(true);
    expect(plugin.register).toHaveBeenCalledWith(dispose);
  });
});
