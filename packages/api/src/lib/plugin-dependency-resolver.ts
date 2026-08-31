import type { PluginManifest } from "./plugin";

export interface PluginDependencyContext {
  pluginId: string;
  pluginPath: string;
  manifest: PluginManifest;
  host: "workspace" | "electron-renderer" | "electron-sidecar";
  format: "commonjs" | "esm" | "node-esm";
}

export interface PluginSharedDependencyInfo {
  specifier: string;
  version?: string;
  platforms: string[];
  public: boolean;
  deprecated?: boolean;
  replacement?: string;
  reason?: string;
}

export interface PluginDependencyResolver {
  list(): PluginSharedDependencyInfo[];

  prepare(
    specifiers: string[],
    context: PluginDependencyContext,
  ): Promise<void>;

  require(specifier: string, context: PluginDependencyContext): unknown;

  canResolve(specifier: string, context: PluginDependencyContext): boolean;
}

export type PluginDependencyResolverFactory = (
  dependencies: Record<string, any>,
) => PluginDependencyResolver;

/**
 * Browser ESM modules emitted by the Svelte compiler rather than authored as
 * plugin dependencies. Renderer hosts provide these exact namespaces so a
 * plugin can compose host-owned Svelte components without bundling a second
 * runtime. They intentionally stay out of manifest sharedDependencies.
 */
export const implicitRendererEsmHostModules = [
  "svelte",
  "svelte/internal/client",
  "svelte/internal/disclose-version",
] as const;

export type ImplicitRendererEsmHostModule =
  (typeof implicitRendererEsmHostModules)[number];

export function isImplicitRendererEsmHostModule(
  specifier: string,
): specifier is ImplicitRendererEsmHostModule {
  return (implicitRendererEsmHostModules as readonly string[]).includes(
    specifier,
  );
}

export interface RendererImportMapEnvironment {
  document: Document;
  globalObject: object;
  createModuleUrl(source: string): string;
}

interface RendererHostModuleRegistry {
  mappedSpecifiers: Set<string>;
  modules: Map<string, unknown>;
  urls: Map<string, string>;
}

const RENDERER_HOST_MODULE_REGISTRY_KEY = "lapis.plugin.renderer-host-modules";
const RENDERER_HOST_MODULE_REGISTRY_SYMBOL = Symbol.for(
  RENDERER_HOST_MODULE_REGISTRY_KEY,
);

export class LegacyObjectDependencyResolver
  implements PluginDependencyResolver
{
  constructor(private readonly dependencies: Record<string, any>) {}

  list(): PluginSharedDependencyInfo[] {
    return Object.keys(this.dependencies)
      .sort()
      .map((specifier) => ({
        specifier,
        platforms: ["web", "electron-renderer"],
        public: true,
      }));
  }

  async prepare(
    _specifiers: string[],
    _context: PluginDependencyContext,
  ): Promise<void> {}

  require(specifier: string, context: PluginDependencyContext): unknown {
    const dependency = this.resolve(specifier);
    if (dependency !== undefined) {
      return dependency;
    }
    throw new Error(
      `Cannot require ${specifier} in plugin ${context.pluginId}`,
    );
  }

  canResolve(specifier: string, _context?: PluginDependencyContext): boolean {
    return this.resolve(specifier) !== undefined;
  }

  protected resolve(specifier: string): unknown | undefined {
    const direct = this.dependencies[specifier];
    if (direct !== undefined) {
      return direct;
    }
    const normalized = this.normalizeAllowedScopedSubpath(specifier);
    return normalized ? this.dependencies[normalized] : undefined;
  }

  private normalizeAllowedScopedSubpath(specifier: string): string | null {
    if (!this.isAllowedScopedDependency(specifier)) {
      return null;
    }

    const normalized = specifier
      .replace(/\/(?:index\.)?(?:m?js|cjs)$/i, "")
      .replace(/\/$/, "");

    return normalized !== specifier ? normalized : null;
  }

  private isAllowedScopedDependency(specifier: string): boolean {
    return (
      specifier.startsWith("@lapis-notes/") || specifier.startsWith("@lucide/")
    );
  }
}

/**
 * Resolves renderer ESM shared dependencies through native import maps while
 * retaining the legacy object-backed CommonJS contract.
 *
 * The generated facade exports references from the host-owned module namespace
 * rather than bundling another copy into an installed plugin. Import maps and
 * facade URLs are shared for the lifetime of the renderer document.
 */
export class RendererImportMapPluginDependencyResolver extends LegacyObjectDependencyResolver {
  constructor(
    dependencies: Record<string, any>,
    private readonly environment?: RendererImportMapEnvironment,
  ) {
    super(dependencies);
  }

  override async prepare(
    specifiers: string[],
    context: PluginDependencyContext,
  ): Promise<void> {
    if (context.format !== "esm" || specifiers.length === 0) return;

    const environment =
      this.environment ?? createRendererImportMapEnvironment();
    const registry = getRendererHostModuleRegistry(environment.globalObject);
    const imports: Record<string, string> = {};

    for (const specifier of specifiers) {
      const dependency = this.resolve(specifier);
      if (dependency === undefined) {
        throw new Error(
          `Cannot resolve ${specifier} in plugin ${context.pluginId}`,
        );
      }
      registry.modules.set(specifier, dependency);
      if (registry.mappedSpecifiers.has(specifier)) continue;

      let moduleUrl = registry.urls.get(specifier);
      if (!moduleUrl) {
        moduleUrl = environment.createModuleUrl(
          createRendererHostModuleFacade(specifier, dependency),
        );
        registry.urls.set(specifier, moduleUrl);
      }
      imports[specifier] = moduleUrl;
      registry.mappedSpecifiers.add(specifier);
    }

    if (Object.keys(imports).length === 0) return;
    const importMap = environment.document.createElement("script");
    importMap.type = "importmap";
    importMap.dataset.lapisPluginHostModules = "true";
    importMap.textContent = JSON.stringify({ imports });
    environment.document.head.append(importMap);
  }
}

function createRendererImportMapEnvironment(): RendererImportMapEnvironment {
  if (typeof document === "undefined" || !document.defaultView) {
    throw new Error("Renderer plugin import maps require a browser document");
  }
  const rendererWindow = document.defaultView;
  return {
    document,
    globalObject: rendererWindow,
    createModuleUrl(source) {
      return rendererWindow.URL.createObjectURL(
        new rendererWindow.Blob([source], { type: "text/javascript" }),
      );
    },
  };
}

function getRendererHostModuleRegistry(
  globalObject: object,
): RendererHostModuleRegistry {
  const owner = globalObject as Record<PropertyKey, unknown>;
  const existing = owner[RENDERER_HOST_MODULE_REGISTRY_SYMBOL];
  if (isRendererHostModuleRegistry(existing)) return existing;

  const registry: RendererHostModuleRegistry = {
    mappedSpecifiers: new Set(),
    modules: new Map(),
    urls: new Map(),
  };
  Object.defineProperty(owner, RENDERER_HOST_MODULE_REGISTRY_SYMBOL, {
    configurable: false,
    enumerable: false,
    value: registry,
    writable: false,
  });
  return registry;
}

function isRendererHostModuleRegistry(
  value: unknown,
): value is RendererHostModuleRegistry {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<RendererHostModuleRegistry>;
  return (
    candidate.mappedSpecifiers instanceof Set &&
    candidate.modules instanceof Map &&
    candidate.urls instanceof Map
  );
}

function createRendererHostModuleFacade(
  specifier: string,
  dependency: unknown,
): string {
  const namespace = isModuleNamespace(dependency) ? dependency : {};
  const moduleLookup = [
    `const registry = globalThis[Symbol.for(${JSON.stringify(RENDERER_HOST_MODULE_REGISTRY_KEY)})];`,
    `const moduleNamespace = registry?.modules.get(${JSON.stringify(specifier)});`,
    `if (!moduleNamespace) throw new Error(${JSON.stringify(`Host module ${specifier} is unavailable`)});`,
  ];
  const exports = Object.keys(namespace)
    .filter((name) => name !== "default")
    .sort()
    .flatMap((name, index) => {
      const localName = `__lapisHostExport${index}`;
      return [
        `const ${localName} = moduleNamespace[${JSON.stringify(name)}];`,
        `export { ${localName} as ${JSON.stringify(name)} };`,
      ];
    });
  if (Object.hasOwn(namespace, "default")) {
    exports.push("export default moduleNamespace.default;");
  }
  return [...moduleLookup, ...exports, ""].join("\n");
}

function isModuleNamespace(value: unknown): value is Record<string, unknown> {
  return (
    (typeof value === "object" && value !== null) || typeof value === "function"
  );
}

export function isPluginDependencyResolver(
  value: unknown,
): value is PluginDependencyResolver {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as PluginDependencyResolver).list === "function" &&
    typeof (value as PluginDependencyResolver).prepare === "function" &&
    typeof (value as PluginDependencyResolver).require === "function" &&
    typeof (value as PluginDependencyResolver).canResolve === "function"
  );
}
