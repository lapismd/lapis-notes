import type { CachedMetadata } from "./cache.svelte";
import type { App } from "./context.svelte";
import { EventDispatcher } from "./events";
import type { TFile } from "./storage";

export type SearchDocumentSource = {
  /** Human-readable content used for snippets, lexical search, and embeddings. */
  content: string;
  /** Curated structured metadata included in metadata search. */
  metadata?: Record<string, unknown>;
  /** Tags contributed by the domain parser, with or without a leading hash. */
  tags?: readonly string[];
};

export type SearchDocumentProviderContext = {
  app: App;
  file: TFile;
  content: string;
  metadata: CachedMetadata;
};

export type SearchDocumentProvider = {
  /** Registry-wide provider id. Plugin helpers namespace local ids. */
  id: string;
  /** Higher priorities override lower-priority matching providers. */
  priority?: number;
  matches(file: TFile): boolean;
  extract(
    context: SearchDocumentProviderContext,
  ): SearchDocumentSource | null | Promise<SearchDocumentSource | null>;
};

export type SearchDocumentProviderChange = {
  providerId: string;
  reason: "registered" | "unregistered";
};

export type SearchDocumentProviderRegistration = {
  readonly id: string;
  dispose(): void;
};

function validateProvider(provider: SearchDocumentProvider): void {
  if (!provider.id.trim()) {
    throw new Error("Search document provider id must not be empty.");
  }
  if (!Number.isFinite(provider.priority ?? 0)) {
    throw new Error(
      `Search document provider ${provider.id} must use a finite priority.`,
    );
  }
}

/** Public registry for domain-owned, Search-consumed document projections. */
export class SearchDocumentProviderRegistry extends EventDispatcher<{
  changed: [change: SearchDocumentProviderChange];
}> {
  private readonly providers = new Map<string, SearchDocumentProvider>();

  register(
    provider: SearchDocumentProvider,
  ): SearchDocumentProviderRegistration {
    validateProvider(provider);
    const id = provider.id.trim();
    if (this.providers.has(id)) {
      throw new Error(`Search document provider already registered: ${id}`);
    }

    const registered = { ...provider, id };
    this.providers.set(id, registered);
    this.emit("changed", { providerId: id, reason: "registered" });

    let disposed = false;
    return {
      id,
      dispose: () => {
        if (disposed) return;
        disposed = true;
        if (this.providers.get(id) !== registered) return;
        this.providers.delete(id);
        this.emit("changed", { providerId: id, reason: "unregistered" });
      },
    };
  }

  getAll(): SearchDocumentProvider[] {
    return [...this.providers.values()];
  }

  resolve(file: TFile): SearchDocumentProvider | null {
    const matches = this.getAll()
      .filter((provider) => provider.matches(file))
      .sort(
        (left, right) =>
          (right.priority ?? 0) - (left.priority ?? 0) ||
          left.id.localeCompare(right.id),
      );
    const selected = matches[0];
    if (!selected) return null;

    const conflicting = matches[1];
    if (
      conflicting &&
      (conflicting.priority ?? 0) === (selected.priority ?? 0)
    ) {
      throw new Error(
        `Ambiguous search document providers for ${file.path}: ${selected.id}, ${conflicting.id}`,
      );
    }
    return selected;
  }
}
