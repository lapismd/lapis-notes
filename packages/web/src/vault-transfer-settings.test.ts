import { beforeEach, describe, expect, it, vi } from "vitest";
import { OpfsVaultAdapter } from "@lapis-notes/api";
import {
  EXPORT_CURRENT_COMMAND_ID,
  IMPORT_CURRENT_COMMAND_ID,
} from "./vault-transfer";
import { registerWebVaultTransferSettings } from "./vault-transfer-settings";

const workspaceHost = vi.hoisted(() => {
  const disposeSection = vi.fn();
  return {
    disposeSection,
    registerSettingsSection: vi.fn(() => disposeSection),
  };
});

vi.mock("@lapis-notes/api/workspace-host", () => ({
  getWorkspaceHostBinding: () => ({
    controller: {
      registerSettingsSection: workspaceHost.registerSettingsSection,
    },
  }),
}));

function createOpfsAdapter() {
  const adapter = Object.create(OpfsVaultAdapter.prototype) as OpfsVaultAdapter;
  Object.assign(adapter, {
    kind: "opfs",
    getCapabilities: () => ({ userVisibleFiles: false }),
  });
  return adapter;
}

function createApp(kind: "opfs" | "file-system-access") {
  const commands = new Map<
    string,
    { checkCallback?: (checking: boolean) => boolean }
  >();
  return {
    vault: {
      adapter:
        kind === "opfs"
          ? createOpfsAdapter()
          : {
              kind,
              getCapabilities: () => ({ userVisibleFiles: true }),
            },
    },
    workspace: {},
    commands: {
      registerCommand: vi.fn(
        (command: {
          id: string;
          checkCallback?: (checking: boolean) => boolean;
        }) => {
          commands.set(command.id, command);
        },
      ),
      unregisterCommand: vi.fn((id: string) => {
        commands.delete(id);
      }),
      get(id: string) {
        return commands.get(id);
      },
    },
  };
}

describe("web vault transfer settings", () => {
  beforeEach(() => {
    workspaceHost.registerSettingsSection.mockClear();
    workspaceHost.disposeSection.mockClear();
  });

  it("registers Browser vault actions and gated commands for OPFS", () => {
    const app = createApp("opfs");
    const dispose = registerWebVaultTransferSettings(app as never);

    expect(workspaceHost.registerSettingsSection).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "web-browser-vault",
        title: "Browser vault",
        order: 35,
        fields: expect.arrayContaining([
          expect.objectContaining({
            id: "web.browserVault.import",
            type: "action",
            label: "Import local folder",
          }),
          expect.objectContaining({
            id: "web.browserVault.export",
            type: "action",
            label: "Export to local folder",
          }),
        ]),
      }),
    );
    expect(app.commands.registerCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        id: IMPORT_CURRENT_COMMAND_ID,
      }),
    );
    expect(app.commands.registerCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        id: EXPORT_CURRENT_COMMAND_ID,
      }),
    );
    expect(app.commands.get(IMPORT_CURRENT_COMMAND_ID)?.checkCallback?.(true)).toBe(
      true,
    );
    expect(app.commands.get(EXPORT_CURRENT_COMMAND_ID)?.checkCallback?.(true)).toBe(
      true,
    );

    dispose();
    expect(app.commands.unregisterCommand).toHaveBeenCalledWith(
      IMPORT_CURRENT_COMMAND_ID,
    );
    expect(app.commands.unregisterCommand).toHaveBeenCalledWith(
      EXPORT_CURRENT_COMMAND_ID,
    );
    expect(workspaceHost.disposeSection).toHaveBeenCalledOnce();
  });

  it("does not register Settings or commands for File System Access vaults", () => {
    const app = createApp("file-system-access");
    const dispose = registerWebVaultTransferSettings(app as never);

    expect(workspaceHost.registerSettingsSection).not.toHaveBeenCalled();
    expect(app.commands.registerCommand).not.toHaveBeenCalled();
    dispose();
    expect(workspaceHost.disposeSection).not.toHaveBeenCalled();
  });
});
