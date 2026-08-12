import {
  getNativeDesktopBridge,
  hasNativeDesktopCapability,
  Plugin,
  type App,
  type LanguageServiceProvider,
  type PluginManifest,
} from "@lapis-notes/api";
import {
  createMarkdownLanguageServiceProvider as createMarkdownLintProvider,
  createNativeMarkdownLanguageServiceProvider,
  probeNativeMarkdownLanguageService,
} from "@lapis-notes/language-service/markdown";

import manifestSpec from "../manifest.json";

const MARKDOWN_LINT_PROVIDER_ID = "markdown-lint";

function getMarkdownLintRules(app: App): Record<string, unknown> | undefined {
  const disabledRules = app.configuration
    .getConfiguration()
    .get<unknown[]>("markdown-lint.disabledRules", []);
  if (!Array.isArray(disabledRules) || disabledRules.length === 0) {
    return undefined;
  }

  const entries = disabledRules
    .filter((rule): rule is string => typeof rule === "string")
    .map((rule) => rule.trim())
    .filter((rule) => rule.length > 0)
    .map((rule) => [rule, false] as const);
  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries);
}

function createMarkdownLintProviderForApp(app: App): LanguageServiceProvider {
  let providerPromise: Promise<LanguageServiceProvider> | null = null;
  let resolvedProvider: LanguageServiceProvider | null = null;
  let disposed = false;

  const getProvider = async (): Promise<LanguageServiceProvider> => {
    if (disposed) {
      throw new Error("Markdownlint provider disposed");
    }
    if (!providerPromise) {
      providerPromise = resolveMarkdownLintProvider(app).then((provider) => {
        resolvedProvider = provider;
        if (disposed) {
          provider.dispose?.();
          throw new Error("Markdownlint provider disposed");
        }
        return provider;
      });
    }
    return providerPromise;
  };

  return {
    metadata: {
      id: MARKDOWN_LINT_PROVIDER_ID,
      languages: ["markdown"],
      runtime: "in-process",
      priority: 100,
      capabilities: { diagnostics: true, codeActions: true },
    },
    async updateDocument(update) {
      const provider = await getProvider();
      await provider.updateDocument?.(update);
    },
    async provideDiagnostics(context) {
      const provider = await getProvider();
      return (await provider.provideDiagnostics?.(context)) ?? [];
    },
    async provideCodeActions(context, range) {
      const provider = await getProvider();
      return (await provider.provideCodeActions?.(context, range)) ?? [];
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      resolvedProvider?.dispose?.();
      if (!resolvedProvider && providerPromise) {
        void providerPromise.catch(() => undefined);
      }
    },
  };
}

async function resolveMarkdownLintProvider(
  app: App,
): Promise<LanguageServiceProvider> {
  const getRules = () => getMarkdownLintRules(app);
  const bridge = getNativeDesktopBridge();
  if (
    bridge &&
    hasNativeDesktopCapability("language-service") &&
    (await probeNativeMarkdownLanguageService((command, payload) =>
      bridge.invoke(command, payload),
    ).catch(() => false))
  ) {
    return createNativeMarkdownLanguageServiceProvider(
      (command, payload) => bridge.invoke(command, payload),
      { getRules },
    );
  }

  return createMarkdownLintProvider({ getRules });
}

export class MarkdownLintPlugin extends Plugin {
  constructor(
    app: App,
    manifest: PluginManifest = manifestSpec as PluginManifest,
  ) {
    super(app, manifest);
  }

  async onload(): Promise<void> {
    this.registerLapisServiceProvider({
      id: MARKDOWN_LINT_PROVIDER_ID,
      service: "language-service",
      provider: createMarkdownLintProviderForApp(this.app),
      metadata: {
        id: MARKDOWN_LINT_PROVIDER_ID,
        languages: ["markdown"],
        runtime: "in-process",
        priority: 100,
        capabilities: { diagnostics: true, codeActions: true },
      },
    });
  }
}

export { createMarkdownLintProviderForApp };

export default MarkdownLintPlugin;
