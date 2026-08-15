import { describe, expect, it, vi } from "vitest";
import {
  CommandManager,
  getHotkeyId,
  Scope,
  type Hotkey,
} from "../command.svelte";

globalThis.app = {
  commands: {
    commandsFor() {
      return [];
    },
  },
} as never;

function createKeyboardEvent(
  key: string,
  modifiers: Partial<
    Pick<KeyboardEvent, "ctrlKey" | "altKey" | "shiftKey" | "metaKey">
  > = {},
): KeyboardEvent {
  let defaultPrevented = false;

  return {
    key,
    ctrlKey: modifiers.ctrlKey ?? false,
    altKey: modifiers.altKey ?? false,
    shiftKey: modifiers.shiftKey ?? false,
    metaKey: modifiers.metaKey ?? false,
    get defaultPrevented() {
      return defaultPrevented;
    },
    preventDefault() {
      defaultPrevented = true;
    },
    stopPropagation() {},
  } as KeyboardEvent;
}

function withNavigatorPlatform<T>(platform: string, callback: () => T): T {
  const descriptor = Object.getOwnPropertyDescriptor(
    globalThis.navigator,
    "platform",
  );

  Object.defineProperty(globalThis.navigator, "platform", {
    configurable: true,
    value: platform,
  });

  try {
    return callback();
  } finally {
    if (descriptor) {
      Object.defineProperty(globalThis.navigator, "platform", descriptor);
    } else {
      Object.defineProperty(globalThis.navigator, "platform", {
        configurable: true,
        value: undefined,
      });
    }
  }
}

class TestVault {
  files: Record<string, string> = {};

  getFileByPath(path: string) {
    return Object.hasOwn(this.files, path) ? ({ path } as never) : null;
  }

  async read(file: { path: string }) {
    return this.files[file.path];
  }

  async modify(file: { path: string }, data: string) {
    this.files[file.path] = data;
  }

  async mkpath(_path: string) {}

  async create(path: string, data: string) {
    this.files[path] = data;
    return { path } as never;
  }
}

function createCommandManager(vault = new TestVault()) {
  return new CommandManager({
    vault,
    workspace: {
      activeLeaf: null,
      getFocusedCommandHostId: () => "root",
      getCommandHostLeaf: () => null,
    },
    contextKeys: { evaluate: () => true },
  } as never);
}

const modK: Hotkey = { modifiers: ["Mod"], key: "K" };

describe("scope key matching", () => {
  it("supports wildcard handlers for modal key capture", () => {
    const scope = new Scope();
    const handler = vi.fn(() => false);

    scope.register(null, null, handler);

    const event = createKeyboardEvent("a");
    expect(scope.handleEvent(event)).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it("supports modifier-scoped wildcard handlers", () => {
    const scope = new Scope();
    const handler = vi.fn(() => false);

    scope.register(["Shift"], null, handler);

    expect(
      scope.handleEvent(createKeyboardEvent("A", { shiftKey: true })),
    ).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(scope.handleEvent(createKeyboardEvent("a"))).toBe(false);
  });

  it("executes Mod hotkeys from command bindings on macOS events", () => {
    withNavigatorPlatform("MacIntel", () => {
      const callback = vi.fn();
      const manager = new CommandManager({
        workspace: { activeLeaf: null },
        contextKeys: { evaluate: () => true },
      } as never);

      manager.registerCommand({
        id: "test:mod-hotkey",
        name: "Test Mod hotkey",
        hotkeys: [{ modifiers: ["Mod", "Shift"], key: "f" }],
        callback,
      });

      globalThis.app = { commands: manager } as never;

      const event = createKeyboardEvent("F", {
        metaKey: true,
        shiftKey: true,
      });

      expect(new Scope().handleEvent(event)).toBe(true);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    });
  });

  it("consumes browser-defaultable command hotkeys after command execution", () => {
    const callback = vi.fn();
    const manager = new CommandManager({
      workspace: { activeLeaf: null },
      contextKeys: { evaluate: () => true },
    } as never);

    manager.registerCommand({
      id: "test:command-palette",
      name: "Test command palette",
      hotkeys: [{ modifiers: ["Meta"], key: "p" }],
      callback,
    });

    globalThis.app = { commands: manager } as never;

    const event = createKeyboardEvent("p", { metaKey: true });

    expect(new Scope().handleEvent(event)).toBe(true);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it("executes checkCallback command hotkeys through the command manager", () => {
    const callback = vi.fn(() => true);
    const manager = createCommandManager();

    manager.registerCommand({
      id: "test:check-command",
      name: "Test check command",
      hotkeys: [{ modifiers: ["Meta"], key: "j" }],
      checkCallback: callback,
    });

    globalThis.app = { commands: manager } as never;

    const event = createKeyboardEvent("j", { metaKey: true });

    expect(new Scope().handleEvent(event)).toBe(true);
    expect(callback).toHaveBeenCalledWith(true);
    expect(callback).toHaveBeenCalledWith(false);
    expect(event.defaultPrevented).toBe(true);
  });

  it("uses its explicit application instead of a conflicting global alias", () => {
    const explicitCallback = vi.fn();
    const explicitManager = createCommandManager();
    explicitManager.registerCommand({
      id: "test:explicit-owner",
      name: "Explicit owner",
      hotkeys: [{ modifiers: ["Meta"], key: "e" }],
      callback: explicitCallback,
    });
    const fallbackManager = createCommandManager();
    globalThis.app = { commands: fallbackManager } as never;

    const event = createKeyboardEvent("e", { metaKey: true });
    const scope = new Scope(undefined, {
      commands: explicitManager,
    } as never);

    expect(scope.handleEvent(event)).toBe(true);
    expect(explicitCallback).toHaveBeenCalledTimes(1);
  });
});

describe("command hotkey overrides", () => {
  it("uses default hotkeys until a custom override replaces them", async () => {
    const manager = createCommandManager();
    const callback = vi.fn();

    manager.registerCommand({
      id: "test:defaults",
      name: "Test defaults",
      hotkeys: [modK],
      callback,
    });

    expect(manager.getEffectiveHotkeys("test:defaults")).toEqual([modK]);
    expect(manager.commandsFor(modK).map((command) => command.id)).toEqual([
      "test:defaults",
    ]);

    await manager.setHotkeys("test:defaults", [
      { modifiers: ["Mod", "Shift"], key: "L" },
    ]);

    expect(manager.commandsFor(modK)).toEqual([]);
    expect(
      manager
        .commandsFor({ modifiers: ["Mod", "Shift"], key: "L" })
        .map((command) => command.id),
    ).toEqual(["test:defaults"]);
  });

  it("supports explicit unbinding, removal, and reset to defaults", async () => {
    const manager = createCommandManager();
    manager.registerCommand({
      id: "test:unbind",
      name: "Test unbind",
      hotkeys: [modK],
      callback: vi.fn(),
    });

    await manager.setHotkeys("test:unbind", []);

    expect(manager.isHotkeyCustomized("test:unbind")).toBe(true);
    expect(manager.getEffectiveHotkeys("test:unbind")).toEqual([]);
    expect(manager.commandsFor(modK)).toEqual([]);

    await manager.addHotkey("test:unbind", {
      modifiers: ["Mod", "Alt"],
      key: "U",
    });
    expect(manager.getEffectiveHotkeys("test:unbind")).toEqual([
      { modifiers: ["Mod", "Alt"], key: "U" },
    ]);

    await manager.removeHotkey("test:unbind", {
      modifiers: ["Alt", "Mod"],
      key: "u",
    });
    expect(manager.getEffectiveHotkeys("test:unbind")).toEqual([]);

    await manager.resetHotkeys("test:unbind");
    expect(manager.isHotkeyCustomized("test:unbind")).toBe(false);
    expect(manager.getEffectiveHotkeys("test:unbind")).toEqual([modK]);
  });

  it("round-trips hotkeys.json and ignores malformed files", async () => {
    const vault = new TestVault();
    const manager = createCommandManager(vault);
    manager.registerCommand({
      id: "test:persist",
      name: "Test persist",
      hotkeys: [modK],
      callback: vi.fn(),
    });

    await manager.setHotkeys("test:persist", [
      { modifiers: ["Ctrl"], key: "P" },
    ]);

    expect(JSON.parse(vault.files["/.obsidian/hotkeys.json"])).toEqual({
      "test:persist": [{ modifiers: ["Ctrl"], key: "P" }],
    });

    const restored = createCommandManager(vault);
    restored.registerCommand({
      id: "test:persist",
      name: "Test persist",
      hotkeys: [modK],
      callback: vi.fn(),
    });
    await restored.loadHotkeys();

    expect(restored.getEffectiveHotkeys("test:persist")).toEqual([
      { modifiers: ["Ctrl"], key: "P" },
    ]);

    vault.files["/.obsidian/hotkeys.json"] = "{";
    const malformed = createCommandManager(vault);
    await expect(malformed.loadHotkeys()).resolves.toBeUndefined();
    expect(malformed.hotkeyOverrides).toEqual({});
  });

  it("reports conflicts while preserving first registered command priority", async () => {
    const manager = createCommandManager();
    manager.registerCommand({
      id: "test:first",
      name: "Test first",
      hotkeys: [modK],
      callback: vi.fn(),
    });
    manager.registerCommand({
      id: "test:second",
      name: "Test second",
      hotkeys: [],
      callback: vi.fn(),
    });

    await manager.setHotkeys("test:second", [modK]);

    expect(manager.getHotkeyConflicts()).toEqual([
      {
        hotkey: modK,
        hotkeyId: getHotkeyId(modK),
        commandIds: ["test:first", "test:second"],
      },
    ]);
    expect(manager.commandsFor(modK).map((command) => command.id)).toEqual([
      "test:first",
      "test:second",
    ]);
  });
});
