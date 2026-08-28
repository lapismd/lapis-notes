export const rendererOptimizeDependencyExclusions = [
  "@lapis-notes/api",
  "harper.js",
  "ghostty-web",
  "@lapismd/design-core",
] as const;

export const rendererOptimizeDependencyInclusions = [
  "@lapismd/mira/**",
] as const;

export const rendererSvelteOptions = {
  emitCss: false,
} as const;
