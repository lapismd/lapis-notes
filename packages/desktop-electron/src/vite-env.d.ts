/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_COMMIT_HASH: string;
}

declare module "svelte/internal/client" {
  const module: Record<string, unknown>;
  export = module;
}

declare module "svelte/internal/disclose-version" {
  const module: Record<string, unknown>;
  export = module;
}
