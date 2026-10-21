# Hosted AI and repository history parity

Agreed implementation plan, 2026-10-21. The initial server has one authenticated
owner and multiple managed vaults. It runs agents on its host; Docker execution
is a later optional backend. Node remains the HTTP application. The desktop
application is the feature reference and uses the same shared services.

This roadmap does not assert delivered behavior. Canonical `spec/src` contracts
govern implementation. The single completion ledger is the Hosted AI and history
section of [MIGRATION.md](MIGRATION.md); verification records live in
`spec/records`. Update them in each verified slice and commit in every owning
repository. Record source, fixture, browser, native, provider and platform
qualification separately.

## Product scope

- Preserve authentication, managed vaults, authoritative Markdown, disposable
  AppDatabase indexes, conditional writes, subscriptions, imports/exports and
  signed plugin installation in the qualified Node server.
- Support one owner, including concurrent browser sessions and multiple vaults.
  Public registration, invitations, collaborative editing, multiple application
  instances and terminal migration remain outside this plan.
- Deliver the desktop AI and repository-history features through the existing
  production components. Add no separate hosted chat or history implementation.
- Conversations and all memory are vault-visible. `Memory/User` remains visible
  vault content; identity records attribution and recall scope rather than
  private note access. Credentials and drafts remain outside shared content.
- An accepted turn continues after browser disconnect. The service owns event
  consumption, tools and persistence. Reconnection observes the existing turn.
  Restart or an unknown outcome never automatically replays a submitted prompt.
- Only the configured owner can answer approvals, questions or cancellation.
  Multiple tabs cannot answer a live request twice. Exact permission option IDs,
  admission generations and request identities remain authoritative.

## Shared architecture

Node owns HTTP/tRPC, authentication, vault identity/path resolution and browser
delivery. A private, supervised Rust companion owns the reusable native services
and exposes bounded, versioned IPC over a local Unix socket. The socket is not a
public endpoint; caller-controlled paths, executables and credentials never enter
browser requests. One service can manage several vaults lazily.

Share by source ownership:

| Owner           | Responsibility                                                                                                          |
| --------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `lapis-notes`   | Hosted application, vault coordination, browser adapters, headless App and durable conversation orchestration           |
| `lapis-plugins` | Public AI/history presentation and host-independent controllers through existing package boundaries                     |
| `lapis-ai`      | ACP clients, supervised execution, compute, capture readers and neutral host service extracted from its Tauri adapter   |
| `jj-store`      | Operation-pinned history, `jj-vault` checkpoints/restore/AI observations, `jj-forge` sync and a neutral history service |
| `lapis-desktop` | Tauri admission, windows, device credentials and desktop integration adapters                                           |

Extract small reusable crates from `tauri-plugin-lapis-ai` and
`tauri-plugin-jj-store`; their Tauri adapters become consumers. Reuse algorithms
already in `jj-vault` and `lapis-ai-capture`. Keep Notes-specific admission,
writer coordination and persistence policy out of generic native crates.
Use a Notes-owned native coordination package only for actual shared application
policy. Existing public package ranges remain portable; any temporary local
validation overlay records exact source revisions and archive checksums.

Extract browser-independent conversation orchestration behind injected ports.
The hosted service owns it without a browser. Svelte presentation observes state
and sends commands. Desktop continues through its native adapter. The headless
engine must not import the Svelte history plugin to obtain history services.

## Execution backend

Agent identity, model/provider selection, negotiated execution mode, approval
policy and process placement are independent choices. A conversation captures
its admitted agent configuration; changing Settings affects future bindings.

Introduce a narrow execution backend in the runtime, initially implemented only
by host processes. Its contract covers capability/readiness discovery, prepared
launch, admitted roots, explicit environment/secret delivery, bounded protocol
streams, relative-path translation, cancellation, status and confirmed cleanup.
The backend must remain independent of Tauri and application persistence.

Host execution uses supervised children of the service account and retains
current process-group cleanup. Vault checks and tool admission remain enforced;
OS privileges are those of the service account. Backend selection is trusted
host configuration. An unavailable backend refuses explicitly, without fallback
or replay. The first product exposes only the implemented host backend.

Later Docker execution provides admitted images, mounts, workspace translation,
network/credential delivery, resource limits and container lifecycle behind the
same contract. Killing an attached client alone cannot confirm container cleanup.
Container execution may advertise fewer capabilities. No Docker SDK, images,
container scheduler or speculative configuration UI is required initially.
Local model serving can adopt the same placement boundary during Compute work;
cloud provider selection remains independent of process placement.

## Feature inventory and invariants

### Repository history and writes

Reuse operation-pinned History transport and `RepositoryServices`/`HistoryReader`
ports for file history, Diff/Before/After, blame, search and navigation. Provide
checkpoints, automatic backup, guarded selected restore and recovery. Historical
reads never reconcile or mutate repository heads. Persistent repository state
lives outside disposable metadata/search indexes.

Resolve opaque vault IDs to admitted roots on the server. Bind history handles
to the owner, vault and admission generation. Bound output and lifetimes. Serialize
restore/checkpoint/tool actions with ordinary server writes and preserve ETag
preconditions, dirty-editor protection and concurrent-browser conflict handling.
Uploading Markdown does not transfer repository ancestry; explicit adoption,
history transfer and import are separate actions. Forge authentication and sync
remain explicit, with offline reads and non-destructive recovery.

### AI conversations and tools

Retain named agent profiles, independently configured providers, exact models,
effort, instructions, participant addressing, queues, drafts, attachments, skills,
handoff, approvals, questions, cancellation, recovery and transcript navigation.
Modes come only from current ACP negotiation and must be acknowledged before a
prompt. Approval policy remains separate from provider mode. Automatic approval
can use only a fresh, uniquely offered one-time option; restored or ambiguous
requests confer no permission.

Server-side tool execution uses the same AppToolHost registrations and guarded
vault writers. Maintain bounded concurrency and owner/vault/turn identities.
Accepted events persist independently of browser acknowledgement; reconnect
delivery is a projection, not the runtime's only event consumer. Do not retry
uncertain effects. Private endpoints and secrets remain host-owned per vault and
agent profile; portable profiles contain opaque configuration references.

Exact sent-context inspection is ephemeral. Persisted transcript/reconnect logs
must exclude raw startup/profile/handoff/attachment/recall context previews.
Do not reconstruct historical context from present-day settings or files.

### AI changes and guarded undo

Confirm a saved-file baseline before provider writes and capture the terminal
boundary after admitted writers drain. Reuse `jj-vault` Begin/Bind/End/List/Read/
PreviewUndo/Undo/PendingUndo operations. Changes are observations and can include
concurrent edits; do not claim exclusive AI authorship.

Reuse Changes navigation, Diff/Before/After and selected-path/turn undo. Check
ending bytes/modes, active writers and dirty editors; preserve a safety checkpoint
and journal recovery per path. Baseline failure offers retry, cancellation or
explicit continuation without protection. Disabled history must not initialize
repository storage. Synced checkpoint links do not authorize undo: require trusted
native receipts. Imported receipt reconstruction, hunk/merge-aware undo and whole
conversation undo remain deferred.

### Markdown memory

Share the desktop dated Markdown format: workspace notes in `Memory`, personal
notes in `Memory/User`, project notes in `Memory/Projects/<path>`, observations
in `YYYY-MM-DD.md` and curated conclusions in `MEMORY.md`. Keep provenance,
activation/checkpoint, forget/exclusion and relocation receipts in `.lapis/memory`.

Run capture only after durable terminal turns. Rebuild indexes without restoring
forgotten content; preserve handwritten edits, conditional writes and dirty-editor
guards. Folder relocation is recoverable and never overwrites/merges content.
Use the saved timezone. Old hashed files stay untouched and unused. Restricted
background memory/handoff processing uses only a qualified bundled Lapis profile,
without tools or filesystem discovery. Discovery does not authorize execution.

### Imports and Compute

Reuse progressive Codex JSONL, Cursor project-transcript and OpenCode SQLite
imports and the shared capture readers. Index metadata privately and rebuildably;
keep bodies and credentials out of the index. Admit explicit uploaded sources or
configured worker data, never an unrestricted server HOME scan. Opaque handles,
bounded pages and cancellation/drain apply. Provisional previews cannot be saved;
import requires final unchanged-file fencing or a pinned SQLite transaction.
Automatic capture remains a separate, opted-in Codex-only feature.

Retain explicit Compute model preparation/import/download/start/stop, limits,
status and optional inference peers. Startup and Settings reads do not start or
download models. No automatic cloud fallback. Linux CPU, macOS ARM64, loaded-model
and paired-device qualification are distinct gates.

## Ordered implementation slices

| Slice | Deliverable                                                   | Acceptance boundary                                                                                               |
| ----- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| H00   | Save this plan, decisions and single ledger                   | Document formatting, canonical links and specification checks                                                     |
| H01   | Reconcile qualified Node port with current main               | Preserve current API changes; server/service regressions, Node smoke and cold hosted acceptance                   |
| H02   | Neutral history service and private companion IPC             | Real temporary repositories; scoped handles, pinned reads, invalid/revoked calls and supervised shutdown          |
| H03   | Hosted history, checkpoints, backup and guarded restore       | Two managed vaults; browser read/restore/conflict/reconnect/restart, App write coordination                       |
| H04   | Neutral ACP service, execution port and host implementation   | Native fixture processes; readiness, modes, permissions, cancellation, unknown outcomes, cleanup and vault scope  |
| H05   | Shared headless conversation engine and hosted read-only chat | Real installed provider; browser disconnect while accepted turn completes; reconnect and restart without replay   |
| H06   | Turn history, Changes, guarded undo and mutation tools        | Baseline before writes; retained receipts, conflict/dirty-editor guards, cancellation and cold recovery           |
| H07   | Shared Markdown memory and unattended maintenance             | Durable turn capture, recall scope, handwritten edits, forget/reindex, move and cold reopen across vaults         |
| H08   | Progressive imports and explicit capture                      | Three source formats; provisional rejection, final fences, cancellation, dedup and persisted reopen               |
| H09   | Forge backup/sync, history transfer and Compute               | Real admitted upstream, outage/recovery, restore, native model lifecycle and separate inference gates             |
| H10   | Full desktop/hosted parity qualification                      | Shared stories, accessibility, real providers/tools, Linux packaging and complete feature ledger                  |
| H11   | Optional Docker backend                                       | Deferred; later require mounted-file parity, translated paths, credentials, modes and confirmed container cleanup |

Every code slice updates its owning canonical requirements, verification rows,
source evidence and the ledger. Start with the exact failing boundary, then run
all required affected checks/builds and consumer acceptance. Keep private leaf,
shared contract and native/provider evidence distinct. Documentation and browser
fixtures never substitute for a native or real-provider gate.

## Reviewed reference baseline

Initial review: Desktop `8990cb57`, Lapis AI `ea27e0d1`, JJ Store `a5dd0ddc`,
qualified Node port `953d673b`; current Notes API baseline `ce1a786e`.
Recheck source revisions before extraction and qualify resulting consumers.
Desktop M10.2/M10.3/M10.4 remain in progress and M14.8 is partial; do not inherit
completion from implemented controls or old fixture results. Bundled loaded-model,
mounted trust/recovery, accessibility and paired-device gaps remain explicit.

The newly recorded AI tool-expansion backlog is outside migration parity until
its features are separately implemented and qualified. Native AgentStore/
ThreadStore conversation storage remains deferred; active ACP vault transcripts
are the migration baseline. Deno desktop is superseded and frozen. Signing,
publication, installation and deployment retain their separate release gates.
