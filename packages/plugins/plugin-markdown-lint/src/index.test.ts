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
  };
  metadata: { id: string; languages: string[] };
};

function createMockApp(disabledRules: unknown[] = []) {
  const providers: RegisteredProvider[] = [];

  return {
    providers,
    app: {
      configuration: {
        getConfiguration: () => ({
          get: vi.fn((key: string, fallback: unknown) =>
            key === "markdown-lint.disabledRules" ? disabledRules : fallback,
          ),
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

    const { app, providers } = createMockApp([
      " MD041 ",
      "",
      "MD013",
      12,
    ]);
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

    const diagnostics = await providers[0]!.provider.provideDiagnostics({});

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
    await providers[0]!.provider.provideDiagnostics({});

    expect(
      languageServiceMocks.probeNativeMarkdownLanguageService,
    ).toHaveBeenCalledWith(expect.any(Function));
    expect(
      languageServiceMocks.createNativeMarkdownLanguageServiceProvider,
    ).toHaveBeenCalledWith(expect.any(Function), {
      getRules: expect.any(Function),
    });
    expect(
      languageServiceMocks.createMarkdownLanguageServiceProvider,
    ).not.toHaveBeenCalled();
  });
});
