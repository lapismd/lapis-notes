import type {
  LanguageServiceCodeAction,
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
        void provider.dispose?.();
      }
    };
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
      void provider.updateDocument?.({ document });
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
      return [];
    }
    const topPriority = sorted[0].metadata.priority ?? 0;
    const tier = sorted.filter(
      (provider) => (provider.metadata.priority ?? 0) === topPriority,
    );
    const results = await Promise.all(
      tier.map((provider) =>
        provider.provideDiagnostics?.(this.context(document)).catch((error) => {
          console.warn("Language diagnostics provider failed", {
            provider: provider.metadata.id,
            error,
          });
          return [];
        }),
      ),
    );
    return results.flatMap((diagnostics) => diagnostics ?? []);
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

  async codeActions(
    document: VirtualDocument,
    range: LanguageServiceRange,
  ): Promise<LanguageServiceCodeAction[]> {
    this.updateDocument(document);
    await this.onBeforeResolve?.(document.languageId);
    const sorted = this.matchingProviders(document.languageId, "codeActions");
    if (!sorted.length) {
      return [];
    }
    const topPriority = sorted[0].metadata.priority ?? 0;
    const tier = sorted.filter(
      (provider) => (provider.metadata.priority ?? 0) === topPriority,
    );
    const results = await Promise.all(
      tier.map((provider) =>
        provider
          .provideCodeActions?.(this.context(document), range)
          .catch((error) => {
            console.warn("Language code action provider failed", {
              provider: provider.metadata.id,
              error,
            });
            return [];
          }),
      ),
    );
    return results.flatMap((actions) => actions ?? []);
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
}
