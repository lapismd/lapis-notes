import { describe, expect, it } from "vitest";
import { WorkspaceSettingsController } from "@lapismd/design-core/workspace/settings";
import { registerWorkspaceFileSettings } from "../files-configuration";

describe("core Workspace file settings", () => {
  function controller() {
    return new WorkspaceSettingsController({
      sections: [
        {
          id: "workspace",
          title: "Workspace",
          navigationGroupId: "options",
          fields: [
            {
              id: "workspace.layout",
              type: "boolean",
              title: "Layout",
              default: true,
            },
          ],
        },
      ],
    });
  }

  it("adds a searchable string list alongside existing Workspace fields", () => {
    const settings = controller();
    registerWorkspaceFileSettings(settings);
    const section = settings.sections.find(
      (section) => section.id === "workspace",
    )!;
    expect(section.fields).toContainEqual(
      expect.objectContaining({ id: "workspace.layout" }),
    );
    expect(section.fields).toContainEqual(
      expect.objectContaining({
        id: "workspace.files",
        type: "group",
        fields: [
          expect.objectContaining({
            id: "files.exclude",
            type: "list",
            itemType: "string",
            default: [".git", ".jj"],
          }),
        ],
      }),
    );
    expect(settings.get("files.exclude")).toEqual([".git", ".jj"]);
    expect(settings.search("Excluded paths")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldId: "files.exclude",
          sectionId: "workspace",
        }),
      ]),
    );
    settings.destroy();
  });

  it("retains stored values and unrelated fields when registered again", () => {
    const settings = controller();
    registerWorkspaceFileSettings(settings);
    settings.changeSnapshot({
      version: 1,
      values: { "files.exclude": ["Private"], "workspace.layout": false },
    });
    registerWorkspaceFileSettings(settings);
    registerWorkspaceFileSettings(settings);
    expect(settings.get("files.exclude")).toEqual(["Private"]);
    expect(settings.get("workspace.layout")).toBe(false);
    expect(
      settings.sections
        .find((section) => section.id === "workspace")!
        .fields!.filter((field) => field.id === "workspace.files"),
    ).toHaveLength(1);
    expect(settings.update("files.exclude", [])).toBe(true);
    expect(settings.get("files.exclude")).toEqual([]);
    settings.destroy();
  });
});
