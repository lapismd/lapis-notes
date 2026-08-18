import type {
  WorkspaceDiagnosticCollectionOptions as DesignCollectionOptions,
  WorkspaceDiagnosticsManager as DesignDiagnosticsManager,
  WorkspaceDiagnosticsManagerSnapshot as DesignDiagnosticsSnapshot,
} from "@lapismd/design-core/workspace/problems";
import type { WorkspaceMenu } from "@lapismd/design-core/workspace/core";
import type { Menu } from "./menu.svelte";

export type DiagnosticSeverity =
  | "error"
  | "warning"
  | "information"
  | "hint";

export interface DiagnosticPosition {
  line: number;
  character: number;
}

export interface DiagnosticRange {
  start: DiagnosticPosition;
  end: DiagnosticPosition;
}

export type DiagnosticTag = "unnecessary" | "deprecated";

export interface DiagnosticResource {
  uri: string;
  label?: string;
  detail?: string;
  icon?: string;
}

export interface DiagnosticRelatedInformation {
  resource: DiagnosticResource;
  range?: DiagnosticRange;
  message: string;
}

export interface WorkspaceDiagnostic {
  message: string;
  severity: DiagnosticSeverity;
  range?: DiagnosticRange;
  source?: string;
  code?: string | number | { value: string | number; target?: string };
  tags?: readonly DiagnosticTag[];
  relatedInformation?: readonly DiagnosticRelatedInformation[];
}

export interface WorkspaceDiagnosticEntry {
  key: string;
  collectionId: string;
  collectionLabel: string;
  resource: DiagnosticResource | null;
  diagnostic: WorkspaceDiagnostic;
}

export interface DiagnosticCollectionOptions {
  label?: string;
  buildItemMenu?: (menu: Menu, entry: WorkspaceDiagnosticEntry) => void;
}

export type DiagnosticCollectionUpdate = readonly [
  resource: DiagnosticResource | null,
  diagnostics: readonly WorkspaceDiagnostic[] | undefined,
];

export interface DiagnosticCollection
  extends Iterable<
    readonly [DiagnosticResource | null, readonly WorkspaceDiagnostic[]]
  > {
  readonly id: string;
  readonly label: string;
  readonly disposed: boolean;
  set(
    resource: DiagnosticResource | null,
    diagnostics: readonly WorkspaceDiagnostic[] | undefined,
  ): void;
  set(entries: Iterable<DiagnosticCollectionUpdate>): void;
  get(
    resource: DiagnosticResource | null,
  ): readonly WorkspaceDiagnostic[] | undefined;
  has(resource: DiagnosticResource | null): boolean;
  delete(resource: DiagnosticResource | null): boolean;
  clear(): void;
  forEach(
    callback: (
      resource: DiagnosticResource | null,
      diagnostics: readonly WorkspaceDiagnostic[],
      collection: DiagnosticCollection,
    ) => void,
  ): void;
  dispose(): void;
}

export interface DiagnosticsSnapshot {
  entries: readonly WorkspaceDiagnosticEntry[];
  counts: Readonly<Record<DiagnosticSeverity, number>>;
}

type AppendMenu = (target: WorkspaceMenu, source: Menu) => void;

/** Lapis-owned façade over Design Core's application-independent manager. */
export class DiagnosticsManager {
  constructor(
    private readonly manager: DesignDiagnosticsManager,
    private readonly createMenu: () => Menu,
    private readonly appendMenu: AppendMenu,
  ) {}

  get size(): number {
    return this.manager.size;
  }

  createCollection(
    id: string,
    options: DiagnosticCollectionOptions = {},
  ): DiagnosticCollection {
    const designOptions: DesignCollectionOptions = {
      label: options.label,
      buildItemMenu: options.buildItemMenu
        ? (target, entry) => {
            const menu = this.createMenu();
            options.buildItemMenu?.(menu, entry as WorkspaceDiagnosticEntry);
            this.appendMenu(target, menu);
          }
        : undefined,
    };
    return this.manager.createCollection(
      id,
      designOptions,
    ) as DiagnosticCollection;
  }

  getCollection(id: string): DiagnosticCollection | undefined {
    return this.manager.getCollection(id) as DiagnosticCollection | undefined;
  }

  subscribe(subscriber: (snapshot: DiagnosticsSnapshot) => void): () => void {
    return this.manager.subscribe((snapshot: DesignDiagnosticsSnapshot) =>
      subscriber(snapshot as DiagnosticsSnapshot),
    );
  }

  snapshot(): DiagnosticsSnapshot {
    return this.manager.snapshot() as DiagnosticsSnapshot;
  }
}

export function bindRuntimePluginDiagnostics(
  plugins: {
    on(name: "plugin-error", listener: (id: string, message: string) => void): unknown;
    on(
      name: "plugin-enabled",
      listener: (plugin: { manifest: { id: string } }) => void,
    ): unknown;
    offref(ref: unknown): void;
  },
  diagnostics: Pick<DiagnosticsManager, "createCollection">,
): () => void {
  const collection = diagnostics.createCollection("lapis:runtime", {
    label: "Runtime",
  });
  const pluginFailures = new Map<string, WorkspaceDiagnostic>();
  const publish = () => {
    if (collection.disposed) return;
    collection.set(null, [...pluginFailures.values()]);
  };
  const errorRef = plugins.on("plugin-error", (id, message) => {
    pluginFailures.set(id, {
      message,
      severity: "error",
      source: "Plugin",
      code: id,
    });
    publish();
  });
  const enabledRef = plugins.on("plugin-enabled", (plugin) => {
    if (!pluginFailures.delete(plugin.manifest.id)) return;
    publish();
  });
  return () => {
    plugins.offref(errorRef);
    plugins.offref(enabledRef);
  };
}

export function diagnosticResourceForPath(path: string): DiagnosticResource {
  const normalized = path.replace(/^\/+/, "");
  return {
    uri: `vault:///${encodeURI(normalized)}`,
    label: normalized.split("/").at(-1) ?? normalized,
    detail: normalized,
    icon: "file-text",
  };
}

export function pathFromDiagnosticResource(
  resource: DiagnosticResource,
): string | null {
  if (!resource.uri.startsWith("vault:///")) return null;
  try {
    return decodeURI(resource.uri.slice("vault:///".length));
  } catch {
    return null;
  }
}
