import type { App } from "@lapis-notes/api";
import type { WorkspaceSettingsController } from "@lapismd/design-core/workspace/settings";

export function pluginSettingsSectionId(
  controller: WorkspaceSettingsController,
  pluginId: string,
): string | null {
  return (
    controller.sections.find(
      (section) =>
        section.sourcePluginId === pluginId &&
        section.id !== "core-plugins" &&
        section.id !== "community-plugins",
    )?.id ?? null
  );
}

export function openPluginSettings(
  controller: WorkspaceSettingsController,
  pluginId: string,
): boolean {
  const sectionId = pluginSettingsSectionId(controller, pluginId);
  return sectionId ? controller.open({ sectionId }) : false;
}

export function pluginDiagnosticRows(
  app: App,
  pluginId: string,
): { label: string; value: string }[] {
  const plugin = app.plugins.plugins.get(pluginId);
  const indexed = app.plugins.getCommunityPluginDiagnostics(pluginId);
  const rows = [
    { label: "State", value: plugin?.state ?? indexed?.state ?? "indexed" },
    {
      label: "Source",
      value: indexed?.source ?? plugin?.source ?? "core",
    },
    {
      label: "Provenance",
      value: indexed?.provenance ?? plugin?.provenance ?? "bundled",
    },
    {
      label: "Activation",
      value: indexed?.activationMode ?? "code",
    },
    {
      label: "Runtime host",
      value:
        indexed?.selectedRuntimeHost ?? plugin?.hostMode ?? "application",
    },
    {
      label: "Runtime entry",
      value: indexed?.selectedRuntimeEntry ?? "static package",
    },
  ];
  return rows.filter((row) => row.value.length > 0);
}
