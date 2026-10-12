import type { VaultProfile } from "./storage/vault-state";

export const LAPIS_SERVER_PROTOCOL_MAJOR = 1;

export type ServerVaultRole = "owner" | "editor" | "viewer";

export interface ServerVaultProfile extends VaultProfile {
  kind: "server-hosted";
  role: ServerVaultRole;
  archived: boolean;
}

export interface ServerHostCapabilities {
  appDatabase: true;
  fileWatch: true;
  languageService: true;
  pluginAssets: true;
  vaultResources: true;
  ai: false;
  terminal: false;
  collaboration: false;
  multiInstance: false;
}

export type ServerHostErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PRECONDITION_FAILED"
  | "INVALID_PATH"
  | "PROTOCOL_MISMATCH"
  | "RESYNC_REQUIRED"
  | "RATE_LIMITED"
  | "INTERNAL";

export class ServerHostError extends Error {
  constructor(
    readonly code: ServerHostErrorCode,
    message: string,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = "ServerHostError";
  }
}

export class VaultConflictError extends ServerHostError {
  constructor(message = "The vault file changed before it could be saved") {
    super("CONFLICT", message);
    this.name = "VaultConflictError";
  }
}
