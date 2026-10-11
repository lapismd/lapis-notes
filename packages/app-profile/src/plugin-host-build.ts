import { pluginHostModuleRegistry } from "@lapis-notes/api/plugin-host-modules";

interface HostModule {
  entry: string;
  moduleId: string;
  packageName: string;
  platforms: readonly string[];
  public: boolean;
  defaultExport?: boolean;
  source?: string;
}

const registry: Record<string, HostModule> = pluginHostModuleRegistry;
const editorRuntimeSpecifiers = new Set([
  "@codemirror/autocomplete",
  "@codemirror/commands",
  "@codemirror/language",
  "@codemirror/lint",
  "@codemirror/search",
  "@codemirror/state",
  "@codemirror/view",
  "@lezer/common",
  "@lezer/highlight",
  "@lezer/lr",
]);
const modules = Object.entries(registry).filter(
  ([specifier, entry]) =>
    entry.public &&
    entry.platforms.includes("web") &&
    (entry.packageName === "@lapis-notes/api" ||
      specifier === "@lapis-notes/markdown/embed" ||
      editorRuntimeSpecifiers.has(specifier) ||
      entry.source === "renderer-abi"),
);
const names = new Map(
  modules.map(([specifier, entry]) => [
    specifier,
    specifier === "@lapis-notes/api"
      ? "plugin-host-api"
      : specifier === "@lapis-notes/api/workspace-host"
        ? "plugin-host-workspace-host"
        : `plugin-host-${entry.moduleId}`,
  ]),
);
const virtualIds = new Map(
  modules.map(([specifier]) => [specifier, `\0lapis-${names.get(specifier)}`]),
);

export const rendererPluginImportMap = {
  imports: Object.fromEntries(
    modules.map(([specifier]) => [specifier, `/${names.get(specifier)}.js`]),
  ),
};
export const rendererPluginHostInputs = Object.fromEntries(
  modules.map(([specifier]) => [
    names.get(specifier)!,
    virtualIds.get(specifier)!,
  ]),
);

export function resolvePluginHostModule(id: string): string | undefined {
  for (const [specifier, virtualId] of virtualIds) {
    if (id === virtualId || id === rendererPluginImportMap.imports[specifier])
      return virtualId;
  }
  return undefined;
}

export function loadPluginHostModule(id: string): string | undefined {
  for (const [specifier, entry] of modules) {
    if (id !== virtualIds.get(specifier)) continue;
    return (
      `export * from ${JSON.stringify(entry.entry)};\n` +
      (entry.defaultExport
        ? `export { default } from ${JSON.stringify(entry.entry)};\n`
        : "")
    );
  }
  return undefined;
}
