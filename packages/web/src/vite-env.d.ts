/// <reference types="vite/client" />

declare const __LAPIS_SERVER_MODE__: boolean;
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_APP_COMMIT_HASH: string;
  readonly VITE_LAPIS_NOSTR_REGISTRY_RELAYS?: string;
  readonly VITE_LAPIS_NOSTR_CURATOR_PUBKEYS?: string;
  readonly VITE_LAPIS_NOSTR_INSTALL_QUORUM?: string;
  readonly VITE_LAPIS_NOSTR_BLOSSOM_URL?: string;
}
