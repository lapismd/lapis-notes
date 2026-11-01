import type {
  App,
  AppPluginDistributionOptions,
  PluginAssetServer,
  SyncHostService,
  VaultProfile,
  VaultSession,
} from "@lapis-notes/api";
import type { NativeChatHost } from "../native-chat/index";
import type { RepositoryFactory } from "../native-repository";

type AppOptions = ConstructorParameters<typeof App>[0];

/** Browser permissions and platform registration remain owned by the host. */
export interface NotesWorkspaceHost {
  syncHost?: AppOptions["syncHost"];
  unavailablePlugins?: AppOptions["unavailablePlugins"];
  attach?(app: App, syncHost: SyncHostService): () => void;
  configure?(app: App): Promise<(() => void) | void>;
  /** Close host attachments after the session, before releasing compatibility ownership. */
  dispose?(app: App): Promise<void>;
}

export interface NotesWorkspaceSessionProps {
  profile: VaultProfile;
  session: VaultSession;
  runtime: "web-pwa" | "node-server" | "rust-server";
  onReady(app: App): void | Promise<void>;
  onOpenRecent(profile: VaultProfile): Promise<void>;
  onManageVaults(): Promise<void>;
  listProfiles(): Promise<VaultProfile[]>;
  pluginAssetServer?: PluginAssetServer;
  pluginDistributionOptions?: AppPluginDistributionOptions;
  nativeChat?: (app: App) => NativeChatHost;
  repositoryFactory?: RepositoryFactory;
  host?: NotesWorkspaceHost;
}

export interface NotesWorkspaceSessionHandle {
  persistLayout(): Promise<void>;
  canRecoverLeave(): boolean;
  dispose(persistLayout: boolean): Promise<void>;
}
