import { describe, expect, it } from "vitest";
import { WorkspaceSettingsController } from "@lapismd/design-core/workspace/settings";
import { cliSettingsHost, registerCliSettings } from "./cli-settings";

describe("host-owned CLI settings", () => {
  it("searches General → Advanced without storing host authority and retires only its own registration", () => {
    const controller = new WorkspaceSettingsController();
    const first = { downloads: async () => [] };
    const next = { downloads: async () => [] };
    const retireFirst = registerCliSettings(controller, first);
    expect(controller.search("PATH")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sectionId: "general",
          path: expect.arrayContaining(["General", "Advanced"]),
        }),
      ]),
    );
    expect(controller.values).toEqual({});
    const retireNext = registerCliSettings(controller, next);
    retireFirst();
    expect(cliSettingsHost(controller)).toBe(next);
    expect(controller.search("CLI").length).toBeGreaterThan(0);
    retireNext();
    expect(controller.search("CLI")).toEqual([]);
    expect(() => cliSettingsHost(controller)).toThrow("not bound");
    controller.destroy();
  });
  it("preserves an existing General settings owner", () => {
    const controller = new WorkspaceSettingsController({
      sections: [{ id: "general", title: "Existing General" }],
    });
    expect(() => registerCliSettings(controller, {})).toThrow(
      "already have an owner",
    );
    expect(controller.sections[0]?.title).toBe("Existing General");
    controller.destroy();
  });
});
