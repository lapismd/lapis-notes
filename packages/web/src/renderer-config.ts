export const rendererOptimizeDependencyExclusions = [
  "@lapis-notes/api",
  "harper.js",
  "ghostty-web",
  "@tursodatabase/database-wasm/vite",
  "@lapismd/design-core",
] as const;

export const rendererOptimizeDependencyInclusions = [
  "@lapismd/mira/**",
] as const;

export const rendererSvelteOptions = {
  emitCss: false,
} as const;

export const rendererPluginImportMap = {
  imports: {
    "@lapis-notes/api": "/plugin-host-api.js",
    "@lapis-notes/api/workspace-host": "/plugin-host-workspace-host.js",
  },
} as const;
