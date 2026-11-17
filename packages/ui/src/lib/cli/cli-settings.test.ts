import { describe, expect, it } from "vitest";
import { render } from "svelte/server";
import {
  WorkspaceSettingsController,
  type WorkspaceCustomSetting,
} from "@lapismd/design-core/workspace/settings";
import {
  cliSettingsFieldHost,
  cliSettingsHost,
  registerCliSettings,
} from "./cli-settings";

describe("host-owned CLI settings", () => {
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
            id: "cli.refresh",
            title: "Refresh status",
            type: "custom",
            presentation: "row",
          }),
        ],
      }),
      expect.objectContaining({
        id: "cli.browser-installation",
        title: "Browser installation",
        type: "group",
        fields: [
          expect.objectContaining({
            id: "cli.platform",
            title: "Platform",
            type: "custom",
            presentation: "row",
          }),
          expect.objectContaining({ id: "cli.checksum" }),
          expect.objectContaining({
            id: "cli.commands",
            presentation: "full-width",
          }),
        ],
      }),
    ]);
    const group = general?.fields?.[0];
    if (group?.type !== "group" || group.fields[0]?.type !== "custom") {
      throw new Error("CLI refresh field was not registered");
    }
    expect(cliSettingsFieldHost(group.fields[0])).toBe(first);
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
  it.each([
    ["copied", (field: WorkspaceCustomSetting) => ({ ...field })],
    ["proxied", (field: WorkspaceCustomSetting) => new Proxy(field, {})],
  ])(
    "keeps %s declarative fields bound to their registration and lifetime",
    (_, project) => {
      const first = new WorkspaceSettingsController();
      const second = new WorkspaceSettingsController();
      const retireFirst = registerCliSettings(first, {
        installation: {
          status: async () => ({
            state: "not-installed",
            destination: "/first/lapis",
            version: "1",
          }),
          install: async () => {},
          uninstall: async () => {},
        },
      });
      const retireSecond = registerCliSettings(second, {
        downloads: async () => [],
      });
      const findField = (
        controller: WorkspaceSettingsController,
        id: string,
      ): WorkspaceCustomSetting => {
        for (const field of controller.sections[0]?.fields ?? []) {
          if (field.type !== "group") continue;
          const match = field.fields.find((candidate) => candidate.id === id);
          if (match?.type === "custom") return project(match);
        }
        throw new Error(`CLI field ${id} was not registered`);
      };
      const renderer = (
        controller: WorkspaceSettingsController,
        field: WorkspaceCustomSetting,
        header = false,
      ) => {
        const adapter = field.adapter
          ? controller.resolveCustomAdapter(field.id, field.adapter)
          : undefined;
        const component = header
          ? adapter?.headerComponent
          : (adapter?.component ?? field.component);
        if (!component) throw new Error("CLI component missing");
        return () =>
          render(component, {
            props: {
              id: field.id,
              field,
              value: undefined,
              setValue: async () => false,
              update: () => false,
            },
          }).body;
      };
      const firstField = findField(first, "cli.installation");
      const secondField = findField(second, "cli.platform");
      const drawFirst = renderer(first, firstField, true);
      const drawSecond = renderer(second, secondField);
      let retireReplacement = () => {};
      try {
        expect(drawFirst()).toContain("Install CLI");
        expect(drawSecond()).toContain(
          "Choose your operating system and architecture",
        );
        expect(first.values).toEqual({});
        expect(second.values).toEqual({});

        retireFirst();
        expect(drawFirst).toThrow("not bound");
        expect(drawSecond()).toContain(
          "Choose your operating system and architecture",
        );

        retireReplacement = registerCliSettings(first, {
          downloads: async () => [],
        });
        const replacementField = findField(first, "cli.platform");
        const drawReplacement = renderer(first, replacementField);
        expect(drawFirst).toThrow("not bound");
        expect(drawReplacement()).toContain(
          "Choose your operating system and architecture",
        );

        retireFirst();
        expect(drawReplacement()).toContain(
          "Choose your operating system and architecture",
        );
        retireReplacement();
        expect(drawReplacement).toThrow("not bound");
        expect(drawSecond()).toContain(
          "Choose your operating system and architecture",
        );
      } finally {
        retireFirst();
        retireReplacement();
        retireSecond();
        first.destroy();
        second.destroy();
      }
    },
  );
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
