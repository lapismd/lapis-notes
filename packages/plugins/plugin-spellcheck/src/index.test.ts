import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./provider", () => ({
  createSpellcheckProviderForApp: vi.fn(() => ({
    metadata: {
      id: "spellcheck",
      languages: ["markdown", "plaintext"],
    },
    provideDiagnostics: vi.fn(async () => []),
    provideCodeActions: vi.fn(async () => []),
  })),
}));

vi.mock("./register-spellcheck-settings", () => ({
  registerSpellcheckSettings: vi.fn(),
}));

vi.mock("@lapis-notes/api", () => {
  class MockPlugin {
    readonly unloaders = new Set<() => void>();
    readonly commands: Array<{ id: string; name: string }> = [];

    constructor(
      readonly app: any,
      readonly manifest: any,
    ) {}

    addCommand(command: { id: string; name: string }): void {
      this.commands.push(command);
    }

    register(callback: () => void): void {
      this.unloaders.add(callback);
    }

    registerEvent(): void {}

    registerLapisServiceProvider(registration: any): void {
      const dispose = this.app.plugins.registerLapisServiceProvider({
        ...registration,
        plugin: this,
      });
      this.register(dispose);
    }

    unload(): void {
      for (const callback of this.unloaders) {
        callback();
      }
      this.unloaders.clear();
    }
  }

  class MockMenu {
    dropdown(): this {
      return this;
    }
    showAtElement(): void {}
    showAtPosition(): void {}
  }

  return {
    Plugin: MockPlugin,
    Menu: MockMenu,
  };
});

import { SpellcheckPlugin } from "./index";
import { registerSpellcheckSettings } from "./register-spellcheck-settings";

function createMockApp() {
  const providers: unknown[] = [];
  const items: Record<string, unknown> = {};
  return {
    providers,
    app: {
      configuration: {
        getConfiguration: () => ({
          get: (_key: string, fallback: unknown) => fallback,
        }),
        updateConfigurationOption: vi.fn(),
      },
      plugins: {
        registerLapisServiceProvider: vi.fn((registration: unknown) => {
          providers.push(registration);
          return () => {
            const index = providers.indexOf(registration);
            if (index >= 0) providers.splice(index, 1);
          };
        }),
      },
      statusBar: {
        upsertItem(item: { id: string }) {
          items[item.id] = item;
        },
        unregisterItem(id: string) {
          delete items[id];
        },
        items,
      },
      workspace: {
        on: vi.fn(() => () => undefined),
      },
    },
  };
}

describe("SpellcheckPlugin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers the language-service provider and status item by default", async () => {
    const { app, providers } = createMockApp();
    const plugin = new SpellcheckPlugin(app as never);
    await plugin.onload();

    expect(plugin.manifest.id).toBe("spellcheck");
    expect(registerSpellcheckSettings).toHaveBeenCalledWith(plugin);
    expect(app.plugins.registerLapisServiceProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "spellcheck",
        service: "language-service",
      }),
    );
    expect(app.statusBar.items["spellcheck:status"]).toMatchObject({
      id: "spellcheck:status",
      icon: "spell-check",
      segments: ["US"],
    });
    expect(providers).toHaveLength(1);
    plugin.unload();
    expect(providers).toHaveLength(0);
    expect(app.statusBar.items["spellcheck:status"]).toBeUndefined();
  });
});
