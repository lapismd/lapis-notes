import {
  Notice,
  normalizeMetadataValue,
  type App,
  type MetadataType,
  type TFile,
  type TypeWidget,
} from "@lapis-notes/api";
import {
  createFrontmatterPropertyManager,
  FrontmatterController,
  type FrontmatterConfig,
  type FrontmatterControllerCommit,
  type FrontmatterProperty,
  type FrontmatterPropertyKind,
  type FrontmatterPropertyManager,
  type FrontmatterTypeDefinition,
} from "@lapismd/mira/preview/frontmatter";

export function flattenMetadataValues(values: unknown[]): string[] {
  const out: string[] = [];
  for (const value of values) {
    if (Array.isArray(value)) {
      out.push(...flattenMetadataValues(value));
      continue;
    }
    if (typeof value === "string" || typeof value === "number") {
      const text = String(value).trim();
      if (text) out.push(text);
    }
  }
  return out;
}

function adaptTypeWidget(widget: TypeWidget): FrontmatterTypeDefinition {
  return {
    type: widget.type,
    label: widget.name,
    icon: widget.icon,
    defaultValue: () => widget.default(),
    validate: (value) => widget.validate(value),
  };
}

function liveFrontmatterConfig(app: App): FrontmatterConfig {
  const manager = app.metadataTypeManager;
  const types: Record<string, FrontmatterPropertyKind> = {};
  for (const [key, def] of Object.entries(manager.types)) {
    if (def?.type) {
      types[key] = def.type;
    }
  }

  const widgets = Object.values(manager.registeredTypeWidgets)
    .filter((widget) => widget.type !== "unknown")
    .map(adaptTypeWidget);

  return {
    types,
    widgets,
    valueSuggestions: (key) =>
      flattenMetadataValues(manager.getValues(key)),
    propertySuggestions: () => {
      const properties = manager.getAllProperties();
      const names = new Set([
        ...Object.keys(properties),
        ...Object.keys(manager.types),
      ]);
      return [...names].map((name) => {
        const type =
          properties[name]?.type ?? manager.types[name]?.type ?? "text";
        const widget = manager.registeredTypeWidgets[type];
        return {
          name,
          kind: type as FrontmatterPropertyKind,
          icon: widget?.icon,
        };
      });
    },
    onActionError(error, action) {
      new Notice(
        error instanceof Error
          ? error.message
          : `Failed to ${action} property`,
      );
    },
  };
}

function withLiveConfig(app: App): FrontmatterPropertyManager {
  return createFrontmatterPropertyManager(liveFrontmatterConfig(app));
}

export function createLapisFrontmatterPropertyManager(
  app: App,
): FrontmatterPropertyManager {
  const manager: FrontmatterPropertyManager = {
    get config() {
      return liveFrontmatterConfig(app);
    },
    resolveType(
      pathString: string,
      key: string,
      value: unknown,
    ): FrontmatterPropertyKind {
      return withLiveConfig(app).resolveType(pathString, key, value);
    },
    properties(record: Record<string, unknown>): FrontmatterProperty[] {
      return withLiveConfig(app).properties(record);
    },
    typeOptions(): FrontmatterTypeDefinition[] {
      return withLiveConfig(app).typeOptions();
    },
    resolveWidget(
      kind: FrontmatterPropertyKind,
    ): FrontmatterTypeDefinition | null {
      return withLiveConfig(app).resolveWidget(kind);
    },
    coerceValue(
      value: unknown,
      kind: FrontmatterPropertyKind,
      property?: FrontmatterProperty,
    ): unknown {
      return withLiveConfig(app).coerceValue(value, kind, property);
    },
    defaultValue(kind: FrontmatterPropertyKind): unknown {
      return withLiveConfig(app).defaultValue(kind);
    },
    setType(key: string, type: FrontmatterPropertyKind): void {
      app.metadataTypeManager.setType(key, type as MetadataType);
    },
    async rename(prevId: string, newId: string) {
      try {
        const result = await app.metadataTypeManager.rename(prevId, newId);
        if (result.failedFiles.length) {
          new Notice(
            `Renamed ${result.updatedFiles.length} files; ${result.failedFiles.length} failed`,
          );
        } else if (prevId !== newId) {
          new Notice(`Successfully renamed property ${prevId} -> ${newId}`);
        }
        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to rename property";
        new Notice(message);
        throw error;
      }
    },
  };
  return manager;
}

function recordsEqual(
  left: Record<string, unknown>,
  right: Record<string, unknown>,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export async function commitLapisFrontmatterRecord(
  app: App,
  file: TFile,
  commit: FrontmatterControllerCommit,
): Promise<void> {
  try {
    await app.fileManager.processFrontMatter(file, (frontmatter) => {
      for (const key of Object.keys(frontmatter)) {
        if (!Object.prototype.hasOwnProperty.call(commit.record, key)) {
          delete frontmatter[key];
        }
      }
      for (const [key, value] of Object.entries(commit.record)) {
        const declaredType = app.metadataTypeManager.types[key]?.type;
        frontmatter[key] = declaredType
          ? normalizeMetadataValue(declaredType, value)
          : value;
      }
    });
  } catch (error) {
    new Notice(
      error instanceof Error
        ? error.message
        : `Failed to update properties for ${file.path}`,
    );
  }
}

export function createLapisFrontmatterController(
  app: App,
  file: TFile | null,
  propertyManager: FrontmatterPropertyManager,
): FrontmatterController {
  const seed =
    file != null
      ? { ...(app.metadataCache.getCache(file.path)?.frontmatter ?? {}) }
      : {};

  return new FrontmatterController({
    record: seed,
    propertyManager,
    sourcePath: file?.path,
    onRecordChange:
      file == null
        ? undefined
        : (commit: FrontmatterControllerCommit) =>
            commitLapisFrontmatterRecord(app, file, commit),
  });
}

export function syncLapisFrontmatterController(
  controller: FrontmatterController,
  app: App,
  file: TFile | null,
  propertyManager: FrontmatterPropertyManager,
): void {
  const seed =
    file != null
      ? { ...(app.metadataCache.getCache(file.path)?.frontmatter ?? {}) }
      : {};

  controller.update({
    propertyManager,
    sourcePath: file?.path,
    onRecordChange:
      file == null
        ? undefined
        : (commit: FrontmatterControllerCommit) =>
            commitLapisFrontmatterRecord(app, file, commit),
  });

  if (!recordsEqual(controller.getRecord(), seed)) {
    controller.syncRecord(seed, { commit: false });
  }
}
