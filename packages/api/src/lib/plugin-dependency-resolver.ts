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

  async prepare(): Promise<void> {}

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

  private resolve(specifier: string): unknown | undefined {
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
