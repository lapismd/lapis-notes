import { describe, expect, it } from "vitest";
import {
  createAppSkillManagement,
  registerSkillManagementCommands,
} from "./skill-management-app";
import { MemoryVaultAdapter } from "./storage/memory-vault-adapter";
import type { App } from "./context.svelte";
import { FileEditingSessionRegistry } from "./file-editing-sessions";
import { Vault } from "./storage/vault.svelte";

describe("App skill commands without AI", () => {
  it("offers only enabled plugin packages and reports protected updates", async () => {
    const adapter = new MemoryVaultAdapter({}, { clock: () => 1 });
    const vault = new Vault(adapter);
    await vault.load();
    const commands = new Map<string, { callback: () => Promise<void> }>();
    const notices: string[] = [];
    const app = {
      vault,
      fileEditingSessions: new FileEditingSessionRegistry(),
      pluginDistribution: { listInstalled: async () => [] },
      plugins: {
        isStaticPlugin: () => true,
        plugins: new Map([
          [
            "markdown",
            {
              enabled: true,
              manifest: { id: "markdown" },
              packagedAgentSkills: [
                {
                  name: "lapis-markdown",
                  source: "markdown",
                  version: "1",
                  files: { "SKILL.md": "one" },
                },
              ],
            },
          ],
          [
            "disabled",
            {
              enabled: false,
              packagedAgentSkills: [
                {
                  name: "disabled",
                  source: "disabled",
                  version: "1",
                  files: { "SKILL.md": "one" },
                },
              ],
            },
          ],
        ]),
      },
      commands: {
        registerCommand: (command: {
          id: string;
          callback: () => Promise<void>;
        }) => commands.set(command.id, command),
      },
      notifications: {
        notify: ({ message }: { message: string }) => notices.push(message),
      },
    } as unknown as App;
    Object.assign(app, { skillManagement: createAppSkillManagement(app) });
    registerSkillManagementCommands(app);
    await commands.get("app:install-plugin-skills")!.callback();
    expect(notices.at(-1)).toContain(
      "1 installed, 0 updated, 0 unchanged, 0 skipped",
    );
    expect(await adapter.exists(".agents/skills/lapis-markdown/SKILL.md")).toBe(
      true,
    );
    expect(await adapter.exists(".agents/skills/disabled")).toBe(false);
    expect(
      vault.getFileByPath(".agents/skills/lapis-markdown/SKILL.md"),
    ).toBeTruthy();
    const file = vault.getFileByPath(".agents/skills/lapis-markdown/SKILL.md")!;
    expect(await vault.cachedRead(file)).toBe("one");
    const packaged =
      app.plugins.plugins.get("markdown")!.packagedAgentSkills![0];
    (packaged.files as Record<string, string>)["SKILL.md"] = "two";
    await commands.get("app:update-plugin-skills")!.callback();
    expect(await vault.cachedRead(file)).toBe("two");
    let dirty = true;
    app.fileEditingSessions.register(".agents/skills/lapis-markdown/SKILL.md", {
      get dirty() {
        return dirty;
      },
      async flush() {
        await adapter.write(".agents/skills/lapis-markdown/SKILL.md", "local");
        dirty = false;
      },
      async protect() {
        return () => {};
      },
    });
    await commands.get("app:update-plugin-skills")!.callback();
    expect(notices.at(-1)).toContain("lapis-markdown (locally-modified)");
    expect(await adapter.read(".agents/skills/lapis-markdown/SKILL.md")).toBe(
      "local",
    );
  });
  it("uses the admitted operation host for native writes", async () => {
    const calls: unknown[] = [];
    const adapter = new MemoryVaultAdapter();
    const vault = new Vault(adapter);
    await vault.load();
    const app = {
      vault,
      operations: {
        invoke: async (...args: unknown[]) => {
          calls.push(args);
          await adapter.mkdir(".agents/skills/lapis-markdown", {
            recursive: true,
          });
          await adapter.write(
            ".agents/skills/lapis-markdown/SKILL.md",
            "native",
          );
          return { outcome: { status: "ok", value: [] } };
        },
      },
    } as unknown as App;
    await createAppSkillManagement(app).manage("update", "lapis-markdown");
    expect(calls[0]).toMatchObject([
      "skills",
      "update",
      { version: 1, input: { skill: "lapis-markdown" } },
    ]);
    expect(
      vault.getFileByPath(".agents/skills/lapis-markdown/SKILL.md"),
    ).toBeTruthy();
  });
});
