export const rendererOptimizeDependencyExclusions = [
  "@lapis-notes/api",
  "harper.js",
  "@tursodatabase/database-wasm/vite",
  "@lapismd/design-core",
] as const;

export const rendererOptimizeDependencyInclusions = [
  "@lapismd/mira/**",
] as const;

export const rendererSvelteOptions = {
  emitCss: false,
} as const;

export { rendererPluginImportMap } from "@lapis-notes/app-profile/plugin-host-build";
