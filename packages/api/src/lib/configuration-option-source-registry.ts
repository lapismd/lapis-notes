import type { App } from "./context.svelte";
import type { EnumType, StringType } from "./configuration.svelte";
import { EventDispatcher } from "./events";
import { logging } from "./logging";

export type ConfigurationOption = {
  value: string;
  label?: string;
  description?: string;
  markdownDescription?: string;
  detail?: string;
  icon?: string;
  disabled?: boolean;
  source?: string;
};

export type ConfigurationOptionSourceContext = {
  app: App;
  sourceId: string;
  schema: StringType | EnumType;
  configId?: string;
  categoryId?: string;
  settingTitle?: string;
  currentValue?: unknown;
  query?: string;
  limit?: number;
  signal?: AbortSignal;
};

export type MaybePromise<T> = T | Promise<T>;

export type ConfigurationOptionSourceProvider = {
  label?: string;
  description?: string;
  pluginId?: string;
  cache?: "none" | "session";
  getOptions(
    context: ConfigurationOptionSourceContext,
  ): MaybePromise<readonly ConfigurationOption[]>;
};

export type ConfigurationOptionSourceChangeReason =
  | "registered"
  | "unregistered"
  | "invalidated";

export type ConfigurationOptionSourceChange = {
  sourceId: string;
  reason: ConfigurationOptionSourceChangeReason;
};

export type ConfigurationOptionSourceRegistration = {
  readonly id: string;
  invalidate(): void;
  dispose(): void;
};

const SOURCE_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/;

const logger = logging.getLogger("configuration-option-sources");

export function normalizeOptionSourceId(id: string): string {
  return id.trim();
}

export function validateOptionSourceId(id: string): void {
  const normalized = normalizeOptionSourceId(id);
  if (!normalized) {
    throw new Error("Configuration option source id must not be empty.");
  }
  if (!SOURCE_ID_PATTERN.test(normalized)) {
    throw new Error(
      `Invalid configuration option source id: ${id}. Expected pattern ${SOURCE_ID_PATTERN.source}.`,
    );
  }
}

export function normalizeConfigurationOptions(
  options: readonly ConfigurationOption[],
  sourceId: string,
): ConfigurationOption[] {
  const seen = new Set<string>();
  const normalized: ConfigurationOption[] = [];

  for (const option of options) {
    const value = String(option.value ?? "").trim();
    if (!value || seen.has(value)) {
      continue;
    }

    seen.add(value);
    normalized.push({
      ...option,
      value,
      label: option.label?.trim() || value,
      source: option.source ?? sourceId,
    });
  }

  return normalized;
}

export class ConfigurationOptionSourceRegistry extends EventDispatcher<{
  changed: [change: ConfigurationOptionSourceChange];
}> {
  private readonly sources = new Map<
    string,
    ConfigurationOptionSourceProvider
  >();
  private readonly sessionCache = new Map<
    string,
    readonly ConfigurationOption[]
  >();

  private sessionCachePrefix(sourceId: string): string {
    return `${sourceId}:`;
  }

  private clearSessionCache(sourceId: string): void {
    const prefix = this.sessionCachePrefix(sourceId);
    for (const key of [...this.sessionCache.keys()]) {
      if (key.startsWith(prefix)) {
        this.sessionCache.delete(key);
      }
    }
  }

  private sessionCacheKey(
    sourceId: string,
    context: Omit<ConfigurationOptionSourceContext, "sourceId">,
  ): string {
    const params =
      "optionsSourceParams" in context.schema
        ? context.schema.optionsSourceParams
        : undefined;
    const query = context.query?.trim() ?? "";
    const limit = context.limit ?? 50;
    return `${sourceId}:${JSON.stringify(params ?? null)}:${query}:${limit}`;
  }

  register(
    id: string,
    provider: ConfigurationOptionSourceProvider,
  ): ConfigurationOptionSourceRegistration {
    validateOptionSourceId(id);
    const sourceId = normalizeOptionSourceId(id);

    if (this.sources.has(sourceId)) {
      throw new Error(
        `Configuration option source already registered: ${sourceId}`,
      );
    }

    this.sources.set(sourceId, provider);
    this.emit("changed", { sourceId, reason: "registered" });

    let disposed = false;

    return {
      id: sourceId,
      invalidate: () => {
        if (!disposed && this.sources.get(sourceId) === provider) {
          this.clearSessionCache(sourceId);
          this.emit("changed", { sourceId, reason: "invalidated" });
        }
      },
      dispose: () => {
        if (disposed) {
          return;
        }
        disposed = true;
        if (this.sources.get(sourceId) === provider) {
          this.clearSessionCache(sourceId);
          this.sources.delete(sourceId);
          this.emit("changed", { sourceId, reason: "unregistered" });
        }
      },
    };
  }

  has(id: string): boolean {
    return this.sources.has(normalizeOptionSourceId(id));
  }

  async resolve(
    id: string,
    context: Omit<ConfigurationOptionSourceContext, "sourceId">,
  ): Promise<ConfigurationOption[]> {
    const sourceId = normalizeOptionSourceId(id);
    const provider = this.sources.get(sourceId);

    if (!provider) {
      return [];
    }

    const useSessionCache = provider.cache === "session";
    if (useSessionCache) {
      const cached = this.sessionCache.get(
        this.sessionCacheKey(sourceId, context),
      );
      if (cached) {
        return normalizeConfigurationOptions(cached, sourceId);
      }
    }

    try {
      const options = await provider.getOptions({
        ...context,
        sourceId,
        limit: context.limit ?? 50,
      });
      const normalized = normalizeConfigurationOptions(options, sourceId);
      if (useSessionCache) {
        this.sessionCache.set(
          this.sessionCacheKey(sourceId, context),
          normalized,
        );
      }
      return normalized;
    } catch (error) {
      logger.warn(
        `Configuration option source ${sourceId} failed to resolve options.`,
        error,
      );
      return [];
    }
  }

  getRegisteredSourceIds(): string[] {
    return [...this.sources.keys()].sort();
  }
}
