/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_COMMIT_HASH: string;
  readonly VITE_LAPIS_DESKTOP_TELEMETRY?: string;
  readonly VITE_LAPIS_DESKTOP_OTLP_TRACES_ENDPOINT?: string;
  readonly VITE_LAPIS_DESKTOP_TELEMETRY_SERVICE_NAME?: string;
  readonly VITE_LAPIS_DESKTOP_TELEMETRY_VERSION?: string;
  readonly VITE_LAPIS_NOSTR_REGISTRY_RELAYS?: string;
  readonly VITE_LAPIS_NOSTR_CURATOR_PUBKEYS?: string;
  readonly VITE_LAPIS_NOSTR_INSTALL_QUORUM?: string;
  readonly VITE_LAPIS_NOSTR_BLOSSOM_URL?: string;
}

declare module "svelte/internal/client" {
  const module: Record<string, unknown>;
  export = module;
}

declare module "svelte/internal/disclose-version" {
  const module: Record<string, unknown>;
  export = module;
}
