/// <reference types="vite/client" />

declare const __LAPIS_SERVER_MODE__: boolean;
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_APP_COMMIT_HASH: string;
  readonly LAPIS_AGENT_RUNTIME_URL?: string;
  readonly LAPIS_AGENT_RUNTIME_TOKEN?: string;
  readonly LAPIS_TERMINAL_HOST_URL?: string;
  readonly LAPIS_TERMINAL_HOST_TOKEN?: string;
}
