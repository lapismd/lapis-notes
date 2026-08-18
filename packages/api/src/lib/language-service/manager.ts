import type {
  LanguageServiceCodeAction,
  LanguageServiceCodeActionCommand,
  LanguageServiceCompletionList,
  LanguageServiceDiagnostic,
  LanguageServiceGlobalDeclaration,
  LanguageServiceHover,
  LanguageServiceLocation,
  LanguageServicePosition,
  LanguageServiceProvider,
  LanguageServiceRange,
  LanguageServiceRequestContext,
  VirtualDocument,
} from "./types";
import type {
  DiagnosticCollection,
  DiagnosticResource,
  WorkspaceDiagnosticEntry,
  WorkspaceDiagnostic,
} from "../diagnostics";
import type { Menu } from "../menu.svelte";
import { markdownlintRuleUrl } from "../components/editor/extensions/lint/lapis-lint-diagnostic-helpers";

const PROVIDER_REQUEST_TIMEOUT_MS = 8_000;
const PROVIDER_TIMEOUT_MESSAGE = "did not complete";

type SettledProviderRequest<T> =
  | { status: "ok"; value: T }
  | { status: "timeout" };

async function settleProviderRequest<T>(
  request: Promise<T | undefined> | T | undefined,
  fallback: T,
): Promise<SettledProviderRequest<T>> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(request).then((value) => ({
        status: "ok" as const,
        value: value ?? fallback,
      })),
      new Promise<SettledProviderRequest<T>>((resolve) => {
        timeoutId = setTimeout(
          () => resolve({ status: "timeout" }),
          PROVIDER_REQUEST_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

function providerFailureMessage(id: string, error: unknown): string {
  const reason =
    error instanceof Error ? error.message : error ? String(error) : "";
  if (reason === PROVIDER_TIMEOUT_MESSAGE) {
    return `Language diagnostics provider “${id}” did not complete`;
  }
  return reason
    ? `Language diagnostics provider “${id}” failed: ${reason}`
    : `Language diagnostics provider “${id}” failed`;
}

export interface LanguageServiceDiagnosticsBinding {
  collection: DiagnosticCollection;
  applyCodeAction: (
    document: VirtualDocument,
    action: LanguageServiceCodeAction,
  ) => Promise<void> | void;
}

export class LanguageServiceManager {
  private readonly providers = new Map<string, LanguageServiceProvider>();
  private readonly documents = new Map<string, VirtualDocument>();
  private readonly globals = new Map<
    string,
    LanguageServiceGlobalDeclaration
  >();
  private readonly onBeforeResolve?: (
    languageId: string,
  ) => Promise<void> | void;
  private diagnosticsBinding: LanguageServiceDiagnosticsBinding | null = null;
  private readonly openDocuments = new Map<string, number>();
  private readonly cachedCodeActions = new Map<
    string,
    readonly LanguageServiceCodeAction[]
  >();
  private readonly providerFailures = new Map<string, WorkspaceDiagnostic>();

  constructor(
    options: {
      onBeforeResolve?: (languageId: string) => Promise<void> | void;
    } = {},
  ) {
    this.onBeforeResolve = options.onBeforeResolve;
  }

  registerProvider(provider: LanguageServiceProvider): () => void {
    const existing = this.providers.get(provider.metadata.id);
    if (existing && existing !== provider) {
      throw new Error(
        `Language service provider ${provider.metadata.id} is already registered`,
      );
    }
    this.providers.set(provider.metadata.id, provider);
    return () => {
      if (this.providers.get(provider.metadata.id) === provider) {
        this.providers.delete(provider.metadata.id);
        this.clearProviderFailure(provider.metadata.id);
        this.clearPublishedDiagnostics();
        void provider.dispose?.();
      }
    };
  }

  bindDiagnostics(binding: LanguageServiceDiagnosticsBinding): () => void {
    this.diagnosticsBinding = binding;
    this.publishProviderFailures();
    return () => {
      if (this.diagnosticsBinding !== binding) return;
      this.unbindDiagnostics();
    };
  }

  reportProviderFailure(id: string, error: unknown): void {
    this.providerFailures.set(id, {
      message: providerFailureMessage(id, error),
      severity: "error",
      source: "Language service",
      code: id,
    });
    this.publishProviderFailures();
  }

  clearProviderFailure(id: string): void {
    if (!this.providerFailures.delete(id)) return;
    this.publishProviderFailures();
  }

  unbindDiagnostics(): void {
    this.clearPublishedDiagnostics();
    this.diagnosticsBinding = null;
  }

  retainDocument(uri: string): () => void {
    this.openDocuments.set(uri, (this.openDocuments.get(uri) ?? 0) + 1);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const next = (this.openDocuments.get(uri) ?? 1) - 1;
      if (next > 0) {
        this.openDocuments.set(uri, next);
        return;
      }
      this.openDocuments.delete(uri);
      this.documents.delete(uri);
      this.deleteCachedCodeActions(uri);
      const collection = this.diagnosticsBinding?.collection;
      if (collection && !collection.disposed) {
        collection.delete(resourceForUri(uri));
      }
    };
  }

  buildDiagnosticItemMenu(menu: Menu, entry: WorkspaceDiagnosticEntry): void {
    const uri = entry.resource?.uri;
    if (!uri || !this.diagnosticsBinding) return;
    const actions = this.cachedCodeActionsFor(uri, entry.diagnostic);
    if (!actions.length) return;
    const document = this.documents.get(uri);
    if (!document) return;
    for (const action of actions) {
      menu.addItem((item) =>
        item
          .setTitle(action.title)
          .setIcon("lightbulb")
          .setSection("fix")
          .onClick(() =>
            this.diagnosticsBinding?.applyCodeAction(document, action),
          ),
      );
    }
  }

  registerGlobalDeclaration(
    declaration: LanguageServiceGlobalDeclaration,
  ): () => void {
    this.globals.set(declaration.uri, declaration);
    return () => {
      const current = this.globals.get(declaration.uri);
      if (current === declaration) {
        this.globals.delete(declaration.uri);
      }
    };
  }

  updateDocument(document: VirtualDocument): void {
    this.documents.set(document.uri, document);
    for (const provider of this.providers.values()) {
      if (!provider.metadata.languages.includes(document.languageId)) {
        continue;
      }
      void Promise.resolve(provider.updateDocument?.({ document })).catch((error) => {
        if (this.providers.get(provider.metadata.id) !== provider) return;
        console.warn("Language document update failed", {
          provider: provider.metadata.id,
          error,
        });
      });
    }
  }

  getDocument(uri: string): VirtualDocument | null {
    return this.documents.get(uri) ?? null;
  }

  getGlobalDeclarations(): LanguageServiceGlobalDeclaration[] {
    return [...this.globals.values()].sort((left, right) =>
      left.uri.localeCompare(right.uri),
    );
  }

  async diagnostics(
    document: VirtualDocument,
  ): Promise<LanguageServiceDiagnostic[]> {
    this.updateDocument(document);
    await this.onBeforeResolve?.(document.languageId);
    const sorted = this.matchingProviders(document.languageId, "diagnostics");
    if (!sorted.length) {
      this.publishDiagnostics(document, []);
      return [];
    }
    const skipProviderIds = new Set<string>();
    const results = await Promise.all(
      sorted.map(async (provider) => {
        const result = await this.settleProviderCapability(
          provider,
          "diagnostics",
          provider.provideDiagnostics?.(this.context(document)),
          [],
        );
        if (result.timedOut || this.providerFailures.has(provider.metadata.id)) {
          skipProviderIds.add(provider.metadata.id);
        }
        return result.value;
      }),
    );
    const diagnostics = results.flatMap((diagnostics) => diagnostics ?? []);
    await this.cacheCodeActions(document, diagnostics, skipProviderIds);
    this.publishDiagnostics(document, diagnostics);
    return diagnostics;
  }

  async completions(
    document: VirtualDocument,
    position: LanguageServicePosition,
  ): Promise<LanguageServiceCompletionList | null> {
    this.updateDocument(document);
    await this.onBeforeResolve?.(document.languageId);
    for (const provider of this.providersFor(
      document.languageId,
      "completion",
    )) {
      const completions = await provider
        .provideCompletions?.(this.context(document), position)
        .catch((error) => {
          console.warn("Language completion provider failed", {
            provider: provider.metadata.id,
            error,
          });
          return null;
        });
      if (completions?.items.length) {
        return completions;
      }
    }
    return null;
  }

  async hover(
    document: VirtualDocument,
    position: LanguageServicePosition,
  ): Promise<LanguageServiceHover | null> {
    this.updateDocument(document);
    await this.onBeforeResolve?.(document.languageId);
    for (const provider of this.providersFor(document.languageId, "hover")) {
      const hover = await provider
        .provideHover?.(this.context(document), position)
        .catch((error) => {
          console.warn("Language hover provider failed", {
            provider: provider.metadata.id,
            error,
          });
          return null;
        });
      if (hover) {
        return hover;
      }
    }
    return null;
  }

  async definition(
    document: VirtualDocument,
    position: LanguageServicePosition,
  ): Promise<LanguageServiceLocation[]> {
    this.updateDocument(document);
    await this.onBeforeResolve?.(document.languageId);
    for (const provider of this.providersFor(
      document.languageId,
      "definition",
    )) {
      const locations = await provider
        .provideDefinition?.(this.context(document), position)
        .catch((error) => {
          console.warn("Language definition provider failed", {
            provider: provider.metadata.id,
            error,
          });
          return [];
        });
      if (locations?.length) {
        return locations;
      }
    }
    return [];
  }

  async applyCommand(
    document: VirtualDocument,
    command: LanguageServiceCodeActionCommand,
  ): Promise<void> {
    this.updateDocument(document);
    const context = this.context(document);
    for (const provider of this.providers.values()) {
      if (!provider.applyCommand) continue;
      await Promise.resolve(provider.applyCommand(context, command)).catch(
        (error) => {
          console.warn("Language command provider failed", {
            provider: provider.metadata.id,
            command: command.id,
            error,
          });
        },
      );
    }
  }

  async codeActions(
    document: VirtualDocument,
    range: LanguageServiceRange,
    skipProviderIds?: ReadonlySet<string>,
  ): Promise<LanguageServiceCodeAction[]> {
    this.updateDocument(document);
    await this.onBeforeResolve?.(document.languageId);
    const sorted = this.matchingProviders(document.languageId, "codeActions");
    if (!sorted.length) {
      return [];
    }
    const results = await Promise.all(
      sorted.map((provider) => {
        if (skipProviderIds?.has(provider.metadata.id)) {
          return Promise.resolve([]);
        }
        return this.settleProviderCapability(
          provider,
          "codeActions",
          provider.provideCodeActions?.(this.context(document), range),
          [],
        ).then((result) => result.value);
      }),
    );
    return results.flatMap((actions) => actions ?? []);
  }

  cachedCodeActionsFor(
    uri: string,
    diagnostic: Pick<WorkspaceDiagnostic, "message" | "range" | "code">,
  ): readonly LanguageServiceCodeAction[] {
    return (
      this.cachedCodeActions.get(diagnosticCacheKey(uri, diagnostic)) ?? []
    );
  }

  private context(document: VirtualDocument): LanguageServiceRequestContext {
    return {
      document,
      globals: this.getGlobalDeclarations(),
    };
  }

  private matchingProviders(
    languageId: string,
    capability: keyof LanguageServiceProvider["metadata"]["capabilities"],
  ): LanguageServiceProvider[] {
    return [...this.providers.values()]
      .filter(
        (provider) =>
          provider.metadata.languages.includes(languageId) &&
          provider.metadata.capabilities[capability],
      )
      .sort(
        (left, right) =>
          (right.metadata.priority ?? 0) - (left.metadata.priority ?? 0),
      );
  }

  private providersFor(
    languageId: string,
    capability: keyof LanguageServiceProvider["metadata"]["capabilities"],
  ): LanguageServiceProvider[] {
    return this.matchingProviders(languageId, capability);
  }

  private publishDiagnostics(
    document: VirtualDocument,
    diagnostics: readonly LanguageServiceDiagnostic[],
  ): void {
    if (
      !this.diagnosticsBinding ||
      this.diagnosticsBinding.collection.disposed ||
      !this.openDocuments.has(document.uri)
    ) {
      return;
    }
    this.diagnosticsBinding.collection.set(
      resourceForUri(document.uri),
      diagnostics.map(toWorkspaceDiagnostic),
    );
  }

  private async cacheCodeActions(
    document: VirtualDocument,
    diagnostics: readonly LanguageServiceDiagnostic[],
    skipProviderIds?: ReadonlySet<string>,
  ): Promise<void> {
    this.deleteCachedCodeActions(document.uri);
    await Promise.all(
      diagnostics.map(async (diagnostic) => {
        const actions = await this.codeActions(
          document,
          diagnostic.range,
          skipProviderIds,
        );
        if (!this.openDocuments.has(document.uri)) return;
        this.cachedCodeActions.set(
          diagnosticCacheKey(document.uri, diagnostic),
          uniqueActionsForDiagnostic(actions, diagnostic),
        );
      }),
    );
  }

  private deleteCachedCodeActions(uri: string): void {
    const prefix = `${uri}\u0000`;
    for (const key of this.cachedCodeActions.keys()) {
      if (key.startsWith(prefix)) this.cachedCodeActions.delete(key);
    }
  }

  private async settleProviderCapability<T>(
    provider: LanguageServiceProvider,
    capability: "diagnostics" | "codeActions",
    request: Promise<T | undefined> | T | undefined,
    fallback: T,
  ): Promise<{ value: T; timedOut: boolean }> {
    try {
      const settled = await settleProviderRequest(request, fallback);
      if (this.providers.get(provider.metadata.id) !== provider) {
        return { value: fallback, timedOut: false };
      }
      if (settled.status === "timeout") {
        this.reportProviderFailure(
          provider.metadata.id,
          new Error(PROVIDER_TIMEOUT_MESSAGE),
        );
        return { value: fallback, timedOut: true };
      }
      this.clearProviderFailure(provider.metadata.id);
      return { value: settled.value, timedOut: false };
    } catch (error) {
      if (this.providers.get(provider.metadata.id) !== provider) {
        return { value: fallback, timedOut: false };
      }
      console.warn(
        capability === "diagnostics"
          ? "Language diagnostics provider failed"
          : "Language code action provider failed",
        {
          provider: provider.metadata.id,
          error,
        },
      );
      this.reportProviderFailure(provider.metadata.id, error);
      return { value: fallback, timedOut: false };
    }
  }

  private publishProviderFailures(): void {
    const collection = this.diagnosticsBinding?.collection;
    if (!collection || collection.disposed) return;
    collection.set(null, [...this.providerFailures.values()]);
  }

  private clearPublishedDiagnostics(): void {
    this.cachedCodeActions.clear();
    this.providerFailures.clear();
    const collection = this.diagnosticsBinding?.collection;
    if (collection && !collection.disposed) collection.clear();
  }
}

function resourceForUri(uri: string): DiagnosticResource {
  const rawPath = uri.startsWith("vault:///")
    ? uri.slice("vault:///".length)
    : uri;
  let detail = rawPath;
  try {
    detail = decodeURI(rawPath);
  } catch {
    // Preserve an opaque URI when it is not URI encoded.
  }
  return {
    uri,
    label: detail.split("/").at(-1) || detail,
    detail,
    icon: "file-text",
  };
}

function toWorkspaceDiagnostic(
  diagnostic: LanguageServiceDiagnostic,
): WorkspaceDiagnostic {
  return {
    message: diagnostic.message,
    severity: diagnostic.severity,
    range: diagnostic.range,
    source: diagnostic.source,
    code: toWorkspaceDiagnosticCode(diagnostic),
  };
}

function toWorkspaceDiagnosticCode(
  diagnostic: LanguageServiceDiagnostic,
): WorkspaceDiagnostic["code"] {
  const code = diagnostic.code;
  if (
    diagnostic.source === "markdownlint" &&
    typeof code === "string" &&
    /^MD\d+$/i.test(code)
  ) {
    return { value: code, target: markdownlintRuleUrl(code) };
  }
  return code;
}

function diagnosticCacheKey(
  uri: string,
  diagnostic: Pick<WorkspaceDiagnostic, "message" | "range" | "code">,
): string {
  return `${uri}\u0000${diagnostic.message}\u0000${String(
    typeof diagnostic.code === "object"
      ? diagnostic.code.value
      : (diagnostic.code ?? ""),
  )}\u0000${JSON.stringify(diagnostic.range ?? null)}`;
}

function uniqueActionsForDiagnostic(
  actions: readonly LanguageServiceCodeAction[],
  diagnostic: LanguageServiceDiagnostic,
): LanguageServiceCodeAction[] {
  const matching = actions.filter(
    (action) =>
      !action.diagnostics?.length ||
      action.diagnostics.some((entry) => diagnosticsMatch(entry, diagnostic)),
  );
  const seenTitles = new Set<string>();
  return matching.filter((action) => {
    if (seenTitles.has(action.title)) {
      return false;
    }
    seenTitles.add(action.title);
    return true;
  });
}

function diagnosticsMatch(
  left: LanguageServiceDiagnostic,
  right: LanguageServiceDiagnostic,
): boolean {
  return (
    left.message === right.message &&
    String(left.code ?? "") === String(right.code ?? "") &&
    JSON.stringify(left.range ?? null) === JSON.stringify(right.range ?? null)
  );
}
