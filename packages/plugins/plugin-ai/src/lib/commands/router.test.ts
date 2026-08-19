import { describe, expect, it } from "vitest";
import { AppSlashCommandRegistry } from "@lapis-notes/api/agent-skills";
import { SlashCommandCatalog } from "./catalog";
import { formatSlashHelp } from "./groups";
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

  it("reserves host names including help aliases", () => {
    const catalog = new SlashCommandCatalog();
    const names = catalog.list().map((command) => command.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "help",
        "new",
        "agent",
        "model",
        "status",
        "scope",
        "context",
        "skills",
        "tools",
        "native",
        "skill",
        "cancel",
        "refresh",
      ]),
    );
    expect(catalog.get("commands")?.name).toBe("help");
    expect(catalog.get("help")?.source).toBe("app");
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

  it("treats /help and /commands as local catalog listings", async () => {
    const catalog = new SlashCommandCatalog();
    catalog.replaceNativeCommands("binding-a", [
      { name: "compact", description: "Compact the thread" },
    ]);
    const router = new SlashCommandRouter(catalog);
    expect(
      await router.execute(router.resolve("/help")!, {
        discovery: { scopeDir: "" },
      }),
    ).toEqual({ kind: "local", notice: "help" });
    expect(
      await router.execute(router.resolve("/commands")!, {
        discovery: { scopeDir: "" },
      }),
    ).toEqual({ kind: "local", notice: "help" });
    const help = formatSlashHelp(catalog.list("binding-a"), "Codex ACP");
    expect(help).toContain("App");
    expect(help).toContain("/help");
    expect(help).toContain("Current Agent · Codex ACP");
    expect(help).toContain("/native compact");
  });

  it("interpolates vault prompt commands without overriding reserved names", async () => {
    const catalog = new SlashCommandCatalog();
    catalog.replaceFileCommands(
      [
        {
          name: "review",
          description: "Review the note",
          source: "vault",
          kind: "prompt",
          dispatch: { kind: "prompt", template: "Review $ARGUMENTS." },
        },
      ],
      [
        {
          name: "help",
          description: "Custom help docs",
          source: "user",
          kind: "host",
          dispatch: { kind: "host", execute: () => undefined },
        },
      ],
    );
    const router = new SlashCommandRouter(catalog);
    expect(catalog.get("help")?.description).toBe("Custom help docs");
    expect(catalog.get("help")?.source).toBe("app");
    expect(
      await router.execute(router.resolve("/review auth")!, {
        discovery: { scopeDir: "" },
      }),
    ).toEqual({ kind: "prompt", prompt: "Review auth." });
  });

  it("maps /search arguments onto notes_search query", async () => {
    const extensions = new AppSlashCommandRegistry();
    extensions.register(
      { pluginId: "search" },
      {
        name: "search",
        description: "Search notes",
        argumentHint: "<query>",
        dispatch: { kind: "tool", tool: "notes_search" },
      },
    );
    const router = new SlashCommandRouter(new SlashCommandCatalog(extensions));
    expect(
      await router.execute(router.resolve("/search OAuth")!, {
        discovery: { scopeDir: "" },
      }),
    ).toEqual({
      kind: "tool",
      tool: "notes_search",
      input: { query: "OAuth" },
    });
    expect(
      await router.execute(router.resolve("/search")!, {
        discovery: { scopeDir: "" },
      }),
    ).toMatchObject({
      kind: "error",
      message: "Usage: /search <query>",
    });
  });
});
