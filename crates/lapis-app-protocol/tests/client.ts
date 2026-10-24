import {
  PROTOCOL_MAJOR,
  type Request,
  type Reply,
  type VaultCommand,
  type AttachClient,
  type ManagedVault,
  type LoginRequest,
  type SessionInfo,
  type MetaTransaction,
  type MetaPage,
  type NotebookState,
  type NotificationRecord,
  type ChangeSet,
  type StoreHistory,
  type CoreIndexedFile,
  type MetadataPageQuery,
} from "../bindings/protocol.js";
const command = {
  kind: "write_text",
  path: "note.md",
  text: "hello",
  expected: { kind: "missing" },
} satisfies VaultCommand;
const request: Request = {
  protocol_version: PROTOCOL_MAJOR,
  request_id: "request",
  vault_id: "vault",
  generation: "generation",
  command,
};
// @ts-expect-error Unknown commands cannot enter a typed client.
const unknown: VaultCommand = { kind: "save_anything" };
// @ts-expect-error Conditional writes require an expected version.
const unsafe: VaultCommand = {
  kind: "write_text",
  path: "note.md",
  text: "lost",
};
// @ts-expect-error Discard requires a specific editor.
const discard: VaultCommand = { kind: "discard_editor" };
function result(reply: Reply) {
  if (reply.outcome.status === "error") return reply.outcome.error.code;
  const value = reply.outcome.value;
  if (value.kind === "editor_claims")
    return value.claims.map((claim) => claim.editor_id);
  if (value.kind === "text") return value.snapshot.version;
  return value.kind;
}
void [request, unknown, unsafe, discard, result];

const fileAction: VaultCommand = {
  kind: "files",
  operation: { operation: "rename", path: "old.md", newPath: "new.md" },
};
const escape: VaultCommand = {
  kind: "files",
  operation: {
    // @ts-expect-error Native destinations are never portable file commands.
    operation: "open-path",
    path: "/tmp/other",
  },
};
void [fileAction, escape];

const attach: AttachClient = { protocol_version: PROTOCOL_MAJOR };
const vault: ManagedVault = { vault_id: "vault", name: "Notes" };
const remoteRoot: AttachClient = {
  protocol_version: PROTOCOL_MAJOR,
  // @ts-expect-error Only the operator may configure native roots.
  root: "/tmp/other",
};
void [attach, vault, remoteRoot];

const login: LoginRequest = { username: "owner", password: "disposable" };
const session: SessionInfo = {
  username: "owner",
  csrf_token: "csrf",
  expires_at: 1_700_000_000_000,
};
const claimedIdentity: LoginRequest = {
  username: "owner",
  password: "disposable",
  // @ts-expect-error Session identity is derived from the authenticated cookie.
  session_id: "untrusted",
};
void [login, session, claimedIdentity];

const metadata: MetaTransaction = {
  checks: [{ key: "optional", exists: false }],
  mutations: [{ key: "nullable", value: null }, { key: "deleted" }],
};
const page: MetaPage = { entries: [], nextCursor: "plugin:last" };
const metadataSql: MetaTransaction = {
  mutations: [],
  // @ts-expect-error Metadata transactions never receive SQL.
  sql: "DROP TABLE app_meta",
};
void [metadata, page, metadataSql];

const notebook: NotebookState = {
  sourcePath: "note.md",
  mtime: 12.5,
  updatedAt: 20,
  cells: { first: { state: "complete", outputs: [{ text: "done" }] } },
};
const notice: NotificationRecord = {
  id: "notice",
  message: "Saved",
  severity: "info",
  createdAt: 1,
  updatedAt: 2,
  read: false,
  cleared: false,
};
const change: ChangeSet = {
  revision: 1,
  domains: ["notebook"],
  paths: ["note.md"],
  committedAt: 2,
};
const invalidNotice: NotificationRecord = {
  ...notice,
  // @ts-expect-error Only the existing severity catalogue is admitted.
  severity: "debug",
};
void [notebook, notice, change, invalidNotice];

const history: StoreHistory = {
  path: "note.md",
  eventType: "modify",
  createdAt: 1,
  content: "new",
  contentHash: "hash",
  replaceLatest: true,
  maxRevisions: 10,
};
const invalidHistory: StoreHistory = {
  ...history,
  // @ts-expect-error Native history retains the existing event catalogue.
  eventType: "overwrite",
};
void [history, invalidHistory];

const metadataQuery: MetadataPageQuery = {
  query: {
    propertyFilters: [{ name: "team.members[].active", op: "=", value: true }],
    sort: [{ field: { kind: "file", field: "mtime" }, direction: "DESC" }],
  },
  include: ["properties", "tags"],
  limit: 20,
};
const unknownDomain: MetadataPageQuery = {
  // @ts-expect-error Selective reads use the retained typed domain catalogue.
  include: ["sql"],
};
const corePublication = {} as CoreIndexedFile;
const projectionInCore: CoreIndexedFile = {
  ...corePublication,
  // @ts-expect-error Core file publication is independent of plugin projections.
  task: {},
};
void [metadataQuery, unknownDomain, projectionInCore];
