import { DEFAULT_VAULT_EXCLUDES } from "./storage/vault-listing";
import type {
  WorkspaceSettingsController,
  WorkspaceSettingsSection,
} from "@lapismd/design-core/workspace/settings";

/** Core application settings; no plugin owns file discovery policy. */
export const FILES_CONFIGURATION_SCHEMA = {
  id: "files",
  title: "Files",
  type: "object",
  properties: {
    exclude: {
      type: "array",
      title: "Excluded paths",
      description:
        "Glob patterns hidden from vault file and folder listings. Matching folders hide their contents at any depth. Explicit metadata access and backup exclusions are separate.",
      items: { type: "string" },
      default: [...DEFAULT_VAULT_EXCLUDES],
    },
  },
} as const;

/** Register core discovery policy beside the shell's existing Workspace fields. */
export function registerWorkspaceFileSettings(
  settings: WorkspaceSettingsController,
): void {
  const workspace: WorkspaceSettingsSection = settings.sections.find(
    (section) => section.id === "workspace",
  ) ?? {
    id: "workspace",
    title: "Workspace",
    navigationGroupId: "options",
    order: 10,
  };
  settings.registerSection({
    ...workspace,
    fields: [
      ...(workspace.fields ?? []).filter(
        (field) => field.id !== "workspace.files",
      ),
      {
        id: "workspace.files",
        type: "group",
        title: "File discovery",
        description: "Choose which paths appear in file and folder lists.",
        fields: [
          {
            id: "files.exclude",
            type: "list",
            itemType: "string",
            title: "Excluded paths",
            description:
              "Glob patterns hidden from file and folder lists. Folder names apply at any depth. Clear the list to show all paths. This does not change backups or delete files.",
            default: [...DEFAULT_VAULT_EXCLUDES],
          },
        ],
      },
    ],
  });
}
