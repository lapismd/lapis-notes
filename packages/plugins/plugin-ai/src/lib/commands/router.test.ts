import { describe, expect, it } from "vitest";
import { AppSlashCommandRegistry } from "@lapis-notes/api/agent-skills";
import { SlashCommandCatalog } from "./catalog";
import { SlashCommandRouter } from "./router";

describe("SlashCommandCatalog", () => {
  it("keeps reserved commands ahead of native collisions", () => {
    const catalog = new SlashCommandCatalog();
    catalog.replaceNativeCommands("binding-a", [
      { name: "skills", description: "Codex skills" },
      { name: "compact", description: "Compact the thread" },
    ]);
    expect(catalog.get("skills", "binding-a")?.source).toBe("app");
    expect(catalog.get("compact", "binding-a")?.source).toBe("native-agent");
    expect(catalog.native("binding-a", "skills")?.description).toBe(
      "Codex skills",
    );
  });
});

describe("SlashCommandRouter", () => {
  it("rejects unknown commands and reserved host commands", async () => {
    const router = new SlashCommandRouter(new SlashCommandCatalog());
    const unknown = router.resolve("/nope");
    expect(unknown?.kind).toBe("unknown");
    const executed = await router.execute(unknown!, {
      discovery: { scopeDir: "" },
    });
    expect(executed).toMatchObject({ kind: "error" });
    const listed = await router.execute(router.resolve("/skills")!, {
      discovery: { scopeDir: "" },
    });
    expect(listed).toEqual({ kind: "local", notice: "skills" });
  });

  it("does not let extension commands override reserved names", () => {
    const extensions = new AppSlashCommandRegistry();
    extensions.register(
      { pluginId: "demo" },
      {
        name: "new",
        description: "Should not win",
        dispatch: { kind: "prompt", template: "nope" },
      },
    );
    const catalog = new SlashCommandCatalog(extensions);
    expect(catalog.get("new")?.source).toBe("app");
  });

  it("treats /agent as a reserved local command", async () => {
    const extensions = new AppSlashCommandRegistry();
    extensions.register(
      { pluginId: "demo" },
      {
        name: "agent",
        description: "Should not win",
        dispatch: { kind: "prompt", template: "nope" },
      },
    );
    const catalog = new SlashCommandCatalog(extensions);
    expect(catalog.get("agent")?.source).toBe("app");
    const router = new SlashCommandRouter(catalog);
    const resolved = router.resolve("/agent cursor");
    expect(resolved).toMatchObject({
      kind: "command",
      command: { name: "agent", source: "app" },
    });
    expect(
      await router.execute(resolved!, { discovery: { scopeDir: "" } }),
    ).toEqual({
      kind: "local",
      notice: "agent",
      arguments: "cursor",
    });
  });
});
