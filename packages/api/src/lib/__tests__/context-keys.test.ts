import { describe, expect, it } from "vitest";
import type { App } from "../context.svelte";
import { CommandManager } from "../command.svelte";
import {
  ContextKeyService,
  evaluateWhenClause,
  parseWhenClause,
} from "../context-keys.svelte";
import { commandContributionToCommand } from "../lapis-extension";

describe("context key service", () => {
  it("parses and evaluates boolean, equality, and grouping expressions", () => {
    const context = new ContextKeyService({
      "editor.active": true,
      "editor.language": "md",
      "editor.hasSelection": false,
      count: 2,
    });

    expect(
      evaluateWhenClause(
        "editor.active && (editor.language == 'md' || count == 1)",
        (key) => context.get(key),
      ),
    ).toBe(true);
    expect(
      evaluateWhenClause(
        "!editor.hasSelection && count != 3 && editor.language == 'md'",
        (key) => context.get(key),
      ),
    ).toBe(true);
  });

  it("emits change events for set and reset", () => {
    const context = new ContextKeyService();
    const changedKeys: string[][] = [];

    context.on("change", (event) => {
      changedKeys.push(event.keys);
    });

    context.set("view.id", "markdown");
    context.reset("view.id");

    expect(changedKeys).toEqual([["view.id"], ["view.id"]]);
  });

  it("creates scoped keys with reset handles", () => {
    const context = new ContextKeyService();
    const key = context.createScopedKey("plugin.demo", "ready", true);

    expect(key.key).toBe("plugin.demo.ready");
    expect(key.get()).toBe(true);

    key.set(false);
    expect(context.get("plugin.demo.ready")).toBe(false);

    key.reset();
    expect(context.get("plugin.demo.ready")).toBeUndefined();
  });

  it("rejects malformed when clauses", () => {
    expect(() => parseWhenClause("editor.active &&")).toThrow(
      /Unexpected token|Expected/,
    );
    expect(() => parseWhenClause("(editor.active")).toThrow(/Expected \)/);
  });
});

describe("command availability with when clauses", () => {
  it("uses context keys for declarative command visibility", () => {
    const contextKeys = new ContextKeyService({
      "workspace.trusted": true,
      "editor.active": false,
      "plugin.enabled.demo": false,
    });
    const app = {
      workspace: { activeLeaf: null },
      contextKeys,
    } as App;
    const commands = new CommandManager(app);

    commands.registerCommand({
      ...commandContributionToCommand({
        command: "hello",
        title: "Hello",
        when: "workspace.trusted && editor.active && plugin.enabled.demo",
      }),
      callback() {},
    });

    expect(commands.isCommandAvailable("hello")).toBe(false);

    contextKeys.set("editor.active", true);
    contextKeys.set("plugin.enabled.demo", true);

    expect(commands.isCommandAvailable("hello")).toBe(true);
    expect(
      commands.getAvailableCommands().map((command) => command.id),
    ).toEqual(["hello"]);
  });
});
