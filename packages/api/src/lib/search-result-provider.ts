import { EventDispatcher } from "./events";
import type { SearchQueryAst } from "./search-query";

export type SearchResultScope = "files" | "history" | "all";
export type SearchResultRange = { start: number; end: number };
export type SearchProviderMatch = {
  id: string;
  field: string;
  text: string;
  ranges: SearchResultRange[];
  line?: number;
  context?: string;
};
export type SearchProviderHit = {
  /** Stable within the provider, independently of paging and index generation. */
  id: string;
  groupId: string;
  title: string;
  path?: string;
  extension?: string;
  timestamp?: number;
  version?: {
    /** Domain-independent identity for deduplicating identical saved contents. */
    contentId?: string;
    references?: Array<{
      id: string;
      label: string;
      author: string;
      timestamp: number;
      target: Readonly<Record<string, string>>;
    }>;
    id: string;
    label: string;
    author: string;
    timestamp: number;
    occurrences?: number;
  };
  badges?: string[];
  matches: SearchProviderMatch[];
  /** Opaque to Search; only the contributing provider interprets this target. */
  target: Readonly<Record<string, string>>;
};
export type SearchProviderStatus = {
  phase: "ready" | "indexing" | "paused";
  indexed: number;
  complete: boolean;
  omitted?: number;
  description?: string;
};
export type SearchResultRequest = {
  text: string;
  query: SearchQueryAst;
  caseSensitive: boolean;
  mode: "auto" | "lexical" | "vector" | "hybrid";
  limit: number;
  cursor?: string;
  signal: AbortSignal;
};
export type SearchResultPage = {
  generation: string;
  hits: SearchProviderHit[];
  next?: string;
  status?: SearchProviderStatus;
};
export type SearchResultProvider = {
  id: string;
  label: string;
  scope: Exclude<SearchResultScope, "all" | "files">;
  fields: readonly string[];
  modes: readonly SearchResultRequest["mode"][];
  search(request: SearchResultRequest): Promise<SearchResultPage>;
  activate(hit: SearchProviderHit, match?: SearchProviderMatch): Promise<void>;
  expand?(
    hit: SearchProviderHit,
    match: SearchProviderMatch,
    direction: "before" | "after",
    signal: AbortSignal,
  ): Promise<SearchProviderMatch>;
  subscribe?(invalidate: () => void): () => void;
};
export type SearchResultProviderRegistration = {
  readonly id: string;
  dispose(): void;
};

/** App-owned result sources. Registration grants no file or restore authority. */
export class SearchResultProviderRegistry extends EventDispatcher<{
  changed: [
    change: {
      providerId: string;
      reason: "registered" | "unregistered" | "invalidated";
    },
  ];
}> {
  private readonly providers = new Map<string, SearchResultProvider>();

  register(provider: SearchResultProvider): SearchResultProviderRegistration {
    const id = provider.id.trim();
    if (!id || !provider.label.trim())
      throw new Error("Search result provider requires an id and label.");
    if (this.providers.has(id))
      throw new Error(`Search result provider already registered: ${id}`);
    const registered = { ...provider, id };
    this.providers.set(id, registered);
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = registered.subscribe?.(() => {
        if (this.providers.get(id) === registered)
          this.emit("changed", { providerId: id, reason: "invalidated" });
      });
    } catch (error) {
      this.providers.delete(id);
      throw error;
    }
    this.emit("changed", { providerId: id, reason: "registered" });
    return {
      id,
      dispose: () => {
        if (this.providers.get(id) !== registered) return;
        this.providers.delete(id);
        unsubscribe?.();
        this.emit("changed", { providerId: id, reason: "unregistered" });
      },
    };
  }

  getAll(): SearchResultProvider[] {
    return [...this.providers.values()];
  }
  get(id: string): SearchResultProvider | undefined {
    return this.providers.get(id);
  }
}
