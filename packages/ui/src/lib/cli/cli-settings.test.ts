import { describe, expect, it } from "vitest";
import { render } from "svelte/server";
import { WorkspaceSettingsController } from "@lapismd/design-core/workspace/settings";
import type { WorkspaceCustomSetting } from "@lapismd/design-core/workspace/settings";
import {
  cliSettingsFieldHost,
  cliSettingsHost,
  registerCliSettings,
} from "./cli-settings";

describe("host-owned CLI settings", () => {
  it.each([
    ["copied", (field: WorkspaceCustomSetting) => ({ ...field })],
    ["proxied", (field: WorkspaceCustomSetting) => new Proxy(field, {})],
  ])(
    "renders %s fields with their registration's host and lifetime",
    (_, project) => {
      const first = new WorkspaceSettingsController();
      const second = new WorkspaceSettingsController();
      const retireFirst = registerCliSettings(first, {
        installation: {
          status: async () => ({
            state: "not-installed",
            destination: "/first",
            version: "1",
          }),
          install: async () => {},
          uninstall: async () => {},
        },
      });
      const retireSecond = registerCliSettings(second, {
        downloads: async () => [],
      });
      const custom = (controller: WorkspaceSettingsController) => {
        const group = controller.sections[0]?.fields?.[0];
        if (group?.type !== "group" || group.fields[0]?.type !== "custom") {
          throw new Error("CLI field missing");
        }
        return project(group.fields[0]);
      };
      const draw = (field: WorkspaceCustomSetting) => {
        if (!field.component) throw new Error("CLI component missing");
        return render(field.component, {
          props: {
            id: field.id,
            field,
            value: undefined,
            setValue: async () => false,
            update: () => false,
          },
        }).body;
      };
      const firstField = custom(first);
      const secondField = custom(second);
      let retireReplacement = () => {};
      try {
        expect(draw(firstField)).toContain("Install CLI");
        expect(draw(firstField)).not.toContain("Your browser cannot");
        expect(draw(secondField)).toContain("Your browser cannot");
        expect(draw(secondField)).not.toContain("Install CLI");
        expect(first.values).toEqual({});
        expect(second.values).toEqual({});
        retireFirst();
        expect(() => draw(firstField)).toThrow("not bound");
        expect(draw(secondField)).toContain("Your browser cannot");
        retireReplacement = registerCliSettings(first, {
          downloads: async () => [],
        });
        const replacementField = custom(first);
        expect(() => draw(firstField)).toThrow("not bound");
        expect(draw(replacementField)).toContain("Your browser cannot");
        retireFirst();
        expect(draw(replacementField)).toContain("Your browser cannot");
        retireReplacement();
        expect(() => draw(replacementField)).toThrow("not bound");
        expect(draw(secondField)).toContain("Your browser cannot");
      } finally {
        retireFirst();
        retireReplacement();
        retireSecond();
        first.destroy();
        second.destroy();
      }
    },
  );
  it("searches General → Advanced without storing host authority and retires only its own registration", () => {
    const controller = new WorkspaceSettingsController();
    const first = { downloads: async () => [] };
    const next = { downloads: async () => [] };
    const retireFirst = registerCliSettings(controller, first);
    const general = controller.sections.find(
      (section) => section.id === "general",
    );
    expect(general?.page).toBeUndefined();
    expect(general?.fields).toEqual([
      expect.objectContaining({
        id: "advanced",
        title: "Advanced",
        type: "group",
        fields: [
          expect.objectContaining({
            id: "cli",
            title: "Command line interface",
            type: "custom",
          }),
        ],
      }),
    ]);
    const field = general?.fields?.[0];
    if (field?.type !== "group" || field.fields[0]?.type !== "custom") {
      throw new Error("CLI custom field was not registered");
    }
    const cliField = field.fields[0];
    expect(cliSettingsFieldHost(cliField)).toBe(first);
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
    expect(() => cliSettingsFieldHost(cliField)).toThrow("not bound");
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
