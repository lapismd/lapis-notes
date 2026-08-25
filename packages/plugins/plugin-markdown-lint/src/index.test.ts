import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  getNativeDesktopBridge: vi.fn(() => null),
  hasNativeDesktopCapability: vi.fn(() => false),
}));

const languageServiceMocks = vi.hoisted(() => ({
  createMarkdownLanguageServiceProvider: vi.fn(),
  createNativeMarkdownLanguageServiceProvider: vi.fn(),
  probeNativeMarkdownLanguageService: vi.fn(),
}));

vi.mock("@lapis-notes/api", () => {
  class MockPlugin {
    readonly unloaders = new Set<() => void>();

    constructor(
      readonly app: any,
      readonly manifest: any,
    ) {}

    register(callback: () => void): void {
      this.unloaders.add(callback);
    }

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

  return {
    Plugin: MockPlugin,
    getNativeDesktopBridge: apiMocks.getNativeDesktopBridge,
    hasNativeDesktopCapability: apiMocks.hasNativeDesktopCapability,
    matchesEditorAssociationGlob: (pattern: string, path: string) => {
      if (pattern.includes("node_modules")) {
        return /(^|\/)node_modules\//.test(path);
      }
      if (pattern.includes("{md") || pattern.endsWith(".md")) {
        return /\.(md|markdown|mdown|mkd|mdwn|mdtxt|mdtext)$/iu.test(path);
      }
      return false;
    },
  };
});

vi.mock("@lapis-notes/language-service/markdown", () => languageServiceMocks);

import { MarkdownLintPlugin } from "./index";

type RegisteredProvider = {
  id: string;
  service: string;
  provider: {
    metadata: { id: string; languages: string[] };
    provideDiagnostics(context: unknown): Promise<unknown[]>;
    provideCodeActions(context: unknown, range: unknown): Promise<unknown[]>;
    applyCommand?(
      context: unknown,
      command: { id: string; arguments?: unknown[] },
    ): Promise<void>;
  };
  metadata: { id: string; languages: string[] };
};

function createMockApp(values: Record<string, unknown> = {}) {
  const providers: RegisteredProvider[] = [];

  return {
    providers,
    values,
    app: {
      configuration: {
        getConfiguration: () => ({
          get: vi.fn((key: string, fallback: unknown) =>
            key in values ? values[key] : fallback,
          ),
        }),
        updateConfigurationOption: vi.fn(async (key: string, value: unknown) => {
          values[key] = value;
        }),
      },
      plugins: {
        registerLapisServiceProvider: vi.fn(
          (registration: RegisteredProvider) => {
            providers.push(registration);
            return () => {
              const index = providers.indexOf(registration);
              if (index >= 0) {
                providers.splice(index, 1);
              }
            };
          },
        ),
      },
    },
  };
}

function documentContext(uri = "vault:///Notes/Welcome.md") {
  return { document: { uri } };
}

describe("MarkdownLintPlugin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.getNativeDesktopBridge.mockReturnValue(null);
    apiMocks.hasNativeDesktopCapability.mockReturnValue(false);
  });

  it("registers installable plugin configuration and language-service provider", async () => {
    languageServiceMocks.createMarkdownLanguageServiceProvider.mockImplementation(
      ({ getRules }: { getRules: () => Record<string, unknown> }) => ({
        metadata: {
          id: "markdown-lint-worker",
          languages: ["markdown"],
        },
        provideDiagnostics: vi.fn(async () => [{ rules: getRules() }]),
        provideCodeActions: vi.fn(async () => [{ title: "Fix lint issue" }]),
      }),
    );

    const { app, providers } = createMockApp({
      "markdown-lint.disabledRules": [" MD041 ", "", "MD013", 12],
    });
    const plugin = new MarkdownLintPlugin(app as never);

    await plugin.onload();

    expect(plugin.manifest.id).toBe("lapis-markdown-lint");
    expect(app.plugins.registerLapisServiceProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "markdown-lint",
        service: "language-service",
        metadata: expect.objectContaining({
          id: "markdown-lint",
          languages: ["markdown"],
        }),
      }),
    );

    const diagnostics = await providers[0]!.provider.provideDiagnostics(
      documentContext(),
    );

    expect(
      languageServiceMocks.createMarkdownLanguageServiceProvider,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        getRules: expect.any(Function),
      }),
    );
    expect(diagnostics).toEqual([
      {
        rules: {
          MD041: false,
          MD013: false,
        },
      },
    ]);
    expect(providers).toHaveLength(1);

    plugin.unload();

    expect(providers).toHaveLength(0);
  });

  it("prefers the probed native language service capability", async () => {
    const bridge = { invoke: vi.fn(async () => []) };
    const nativeProvider = {
      metadata: {
        id: "markdownlint-native-sidecar",
        languages: ["markdown"],
      },
      provideDiagnostics: vi.fn(async () => []),
      provideCodeActions: vi.fn(async () => []),
    };
    apiMocks.getNativeDesktopBridge.mockReturnValue(bridge as never);
    apiMocks.hasNativeDesktopCapability.mockReturnValue(true);
    languageServiceMocks.probeNativeMarkdownLanguageService.mockResolvedValue(
      true,
    );
    languageServiceMocks.createNativeMarkdownLanguageServiceProvider.mockReturnValue(
      nativeProvider,
    );

    const { app, providers } = createMockApp();
    await new MarkdownLintPlugin(app as never).onload();
    await providers[0]!.provider.provideDiagnostics(documentContext());

    expect(
      languageServiceMocks.probeNativeMarkdownLanguageService,
    ).toHaveBeenCalledWith(expect.any(Function));
    expect(
      languageServiceMocks.createNativeMarkdownLanguageServiceProvider,
    ).toHaveBeenCalledWith(expect.any(Function), {
      getRules: expect.any(Function),
    });
    const nativeOptions = languageServiceMocks
      .createNativeMarkdownLanguageServiceProvider.mock.calls[0]![1] as {
        getRules(): Record<string, unknown>;
      };
    expect(nativeOptions.getRules()).toEqual({ MD013: false });
    expect(
      languageServiceMocks.createMarkdownLanguageServiceProvider,
    ).not.toHaveBeenCalled();
  });

  it("seeds MD013 as disabled and skips excluded open documents", async () => {
    languageServiceMocks.createMarkdownLanguageServiceProvider.mockImplementation(
      ({ getRules }: { getRules: () => Record<string, unknown> }) => ({
        metadata: {
          id: "markdown-lint-worker",
          languages: ["markdown"],
        },
        provideDiagnostics: vi.fn(async () => [{ rules: getRules() }]),
        provideCodeActions: vi.fn(async () => [{ title: "Fix lint issue" }]),
      }),
    );

    const { app, providers } = createMockApp();
    await new MarkdownLintPlugin(app as never).onload();

    expect(await providers[0]!.provider.provideDiagnostics(documentContext())).toEqual([
      { rules: { MD013: false } },
    ]);
    expect(
      await providers[0]!.provider.provideDiagnostics(
        documentContext("vault:///node_modules/pkg/README.md"),
      ),
    ).toEqual([]);
    expect(
      await providers[0]!.provider.provideCodeActions(
        documentContext("vault:///node_modules/pkg/README.md"),
        {},
      ),
    ).toEqual([]);
  });

  it("re-enables MD013 when disabledRules is an empty list", async () => {
    languageServiceMocks.createMarkdownLanguageServiceProvider.mockImplementation(
      ({ getRules }: { getRules: () => Record<string, unknown> }) => ({
        metadata: {
          id: "markdown-lint-worker",
          languages: ["markdown"],
        },
        provideDiagnostics: vi.fn(async () => [{ rules: getRules() }]),
        provideCodeActions: vi.fn(async () => []),
      }),
    );

    const { app, providers } = createMockApp({
      "markdown-lint.disabledRules": [],
    });
    await new MarkdownLintPlugin(app as never).onload();

    expect(await providers[0]!.provider.provideDiagnostics(documentContext())).toEqual([
      { rules: undefined },
    ]);
  });

  it("appends a vault disable command to disabledRules", async () => {
    languageServiceMocks.createMarkdownLanguageServiceProvider.mockReturnValue({
      metadata: {
        id: "markdown-lint-worker",
        languages: ["markdown"],
      },
      provideDiagnostics: vi.fn(async () => []),
      provideCodeActions: vi.fn(async () => []),
    });

    const { app, providers, values } = createMockApp({
      "markdown-lint.disabledRules": ["MD013"],
    });
    await new MarkdownLintPlugin(app as never).onload();

    await providers[0]!.provider.applyCommand!(documentContext(), {
      id: "markdown-lint:disable-rule",
      arguments: ["MD018"],
    });

    expect(values["markdown-lint.disabledRules"]).toEqual(["MD013", "MD018"]);
    expect(app.configuration.updateConfigurationOption).toHaveBeenCalledWith(
      "markdown-lint.disabledRules",
      ["MD013", "MD018"],
    );
  });
});
