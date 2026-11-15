import type { App, AppStateProperties, VaultSession } from "../../dist";
import type {
  NativeSyncCommand,
  NativeSyncObservation,
  NativeSyncPort,
  NativeSyncReply,
} from "../../dist/native-sync";

const command = {
  provider: "lapis-server",
  requestId: "checkpoint-1",
  operation: "checkpoint",
  input: { reason: "manual" },
} satisfies NativeSyncCommand;
const observation = {
  provider: "lapis-server",
  revision: 1,
  snapshot: { status: "idle-clean" },
} satisfies NativeSyncObservation;
const port: NativeSyncPort = {
  provider: "lapis-server",
  snapshot: () => observation,
  async call(request) {
    return {
      provider: "lapis-server",
      requestId: request.requestId,
      value: null,
    } satisfies NativeSyncReply;
  },
  observe() {
    return () => {};
  },
};

const properties = { nativeSync: port } satisfies Pick<
  AppStateProperties,
  "nativeSync"
>;
const session = { nativeSync: port } satisfies Pick<VaultSession, "nativeSync">;
declare const app: App;
const lease = app.nativeSync?.select("lapis-server");
void [properties, session, lease?.snapshot(), lease?.call(command)];
void lease?.apply(command);
void lease?.detach();

// @ts-expect-error Native Sync currently has one explicit destination provider.
app.nativeSync?.select("nostr");
const invalid: NativeSyncCommand = {
  // @ts-expect-error Commands cannot retarget the admitted provider.
  provider: "nostr",
  requestId: "invalid",
  operation: "checkpoint",
  input: {},
};
void invalid;
