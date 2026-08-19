import type { App } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import {
  EXPORT_CURRENT_COMMAND_ID,
  IMPORT_CURRENT_COMMAND_ID,
  canExportCurrentVault,
  canImportIntoCurrentVault,
  runExportVaultCommand,
  runImportVaultCommand,
} from "./vault-transfer";

export function registerWebVaultTransferSettings(app: App): () => void {
  if (!canImportIntoCurrentVault(app) && !canExportCurrentVault(app)) {
    return () => {};
  }

  const { controller } = getWorkspaceHostBinding(app.workspace);
  const disposeSection = controller.registerSettingsSection({
    id: "web-browser-vault",
    title: "Browser vault",
    description:
      "Copy a local folder into this private OPFS vault, or export it to a folder. Import overwrites matching paths. Reload applies imported .obsidian settings.",
    icon: "folder",
    order: 35,
    fields: [
      {
        id: "web.browserVault.import",
        type: "action",
        title: "Import local folder",
        description:
          "Copy a picked local folder into this OPFS vault, overwriting matching paths.",
        label: "Import local folder",
        icon: "folder-input",
        run: () => runImportVaultCommand(app),
      },
      {
        id: "web.browserVault.export",
        type: "action",
        title: "Export to local folder",
        description:
          "Copy this OPFS vault, including .obsidian, into a picked local folder.",
        label: "Export to local folder",
        icon: "folder-output",
        run: () => runExportVaultCommand(app),
      },
    ],
  });

  app.commands.registerCommand({
    id: IMPORT_CURRENT_COMMAND_ID,
    name: "Import local folder into browser vault",
    icon: "folder-input",
    checkCallback: (checking) => {
      if (!canImportIntoCurrentVault(app)) {
        return false;
      }
      if (!checking) {
        void runImportVaultCommand(app);
      }
      return true;
    },
  });
  app.commands.registerCommand({
    id: EXPORT_CURRENT_COMMAND_ID,
    name: "Export browser vault to local folder",
    icon: "folder-output",
    checkCallback: (checking) => {
      if (!canExportCurrentVault(app)) {
        return false;
      }
      if (!checking) {
        void runExportVaultCommand(app);
      }
      return true;
    },
  });

  return () => {
    app.commands.unregisterCommand(IMPORT_CURRENT_COMMAND_ID);
    app.commands.unregisterCommand(EXPORT_CURRENT_COMMAND_ID);
    disposeSection();
  };
}
