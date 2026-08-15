/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_APP_COMMIT_HASH: string;
  readonly LAPIS_AGENT_RUNTIME_URL?: string;
  readonly LAPIS_AGENT_RUNTIME_TOKEN?: string;
}
