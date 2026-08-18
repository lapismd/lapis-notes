import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./provider", () => ({
  createSpellcheckProviderForApp: vi.fn(() => ({
    metadata: {
      id: "spellcheck",
      languages: ["markdown", "plaintext"],
    },
    provideDiagnostics: vi.fn(async () => []),
    provideCodeActions: vi.fn(async () => []),
    warmup: vi.fn(async () => {}),
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
        on: vi.fn(() => ({})),
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
      languageServices: {
        reportProviderFailure: vi.fn(),
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
    expect(app.workspace.on).not.toHaveBeenCalled();
    expect(app.configuration.on).toHaveBeenCalledWith(
      "updated",
      expect.any(Function),
    );
    const onUpdated = vi.mocked(app.configuration.on).mock.calls[0]?.[1] as (
      event: { key: string },
    ) => void;
    const refreshStatus = vi.spyOn(plugin, "refreshStatus");
    onUpdated({ key: "spellcheck.dialect" });
    expect(refreshStatus).toHaveBeenCalledOnce();
    refreshStatus.mockClear();
    onUpdated({ key: "spellcheck.maxFileLength" });
    expect(refreshStatus).not.toHaveBeenCalled();
    plugin.unload();
    expect(providers).toHaveLength(0);
    expect(app.statusBar.items["spellcheck:status"]).toBeUndefined();
  });

  it("reports Harper setup failure without failing plugin enablement", async () => {
    const { createSpellcheckProviderForApp } = await import("./provider");
    vi.mocked(createSpellcheckProviderForApp).mockReturnValueOnce({
      metadata: {
        id: "spellcheck",
        languages: ["markdown", "plaintext"],
      },
      provideDiagnostics: vi.fn(async () => []),
      provideCodeActions: vi.fn(async () => []),
      warmup: vi.fn(async () => {
        throw new Error("harper setup failed");
      }),
    } as never);
    const { app } = createMockApp();
    const plugin = new SpellcheckPlugin(app as never);
    await plugin.onload();

    await vi.waitFor(() => {
      expect(app.languageServices.reportProviderFailure).toHaveBeenCalledWith(
        "spellcheck:spellcheck",
        expect.objectContaining({ message: "harper setup failed" }),
      );
    });
    expect(app.statusBar.items["spellcheck:status"]).toBeDefined();
  });
});
