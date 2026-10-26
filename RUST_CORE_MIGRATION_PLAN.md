# Shared Rust application services for Lapis

Agreed plan, 2026-10-23. Desktop and the hosted server will use the same Rust
application services. Existing production screens remain their presentation.
The standalone local/offline web application retains its browser implementation.
Canonical requirements live in
[Rust application services](spec/src/architecture/rust-application-services.md).
[MIGRATION.md](MIGRATION.md) links completion status and owning evidence.

## Goal and audited boundaries

Move durable application behaviour out of window-owned controllers. Tauri embeds
the shared core; a Rust HTTP server embeds the same core. Node/pnpm remain build
tools, and explicitly configured external agents retain their prerequisites.

| Area               | Current arrangement                                                           | Migration                                                      |
| ------------------ | ----------------------------------------------------------------------------- | -------------------------------------------------------------- |
| AI conversations   | TypeScript coordinates turns, queues, context and transcript persistence      | Rust owns accepted work; views observe it                      |
| Memory             | Renderer-owned capture, indexing, claims and timers                           | Vault-owned durable jobs and maintenance                       |
| Metadata/Search    | App-owned parsing, reconciliation and projections over native SQL             | Native index owner and scheduler                               |
| History            | Native capture/storage; window-scoped admission and renderer index scheduling | Reuse engines and move lifetime/scheduling                     |
| Tools              | Rust bridge calls JavaScript registrations                                    | Native first-party tools; explicit client-dependent extensions |
| Imports/operations | Native readers with client orchestration and publication                      | Service-owned accepted jobs and reconnectable progress         |
| Terminal/Compute   | Native engines already exist                                                  | Adapt ownership without rebuilding engines                     |

Editor buffers, tabs, selection, rendering, live diagnostics and UI plugin
callbacks stay client-owned. See the
[desktop review](docs/rust-core-desktop-review.md) for the current source baseline.

## Architecture and ownership

- Notes owns a Cargo workspace containing `lapis-app-core`,
  `lapis-app-protocol` and `lapis-server` under `crates/`. Modules group by feature.
  Core code is independent of Tauri, HTTP, Svelte and browser APIs.
- `lapis-ai` owns generic ACP, process supervision and Compute engines.
  `jj-store` owns history, checkpoints, restore and Forge engines. Extract and
  consume existing implementations through public contracts.
- Plugin algorithms remain in their source repository. Native first-party
  metadata/tools belong in a transport-independent `lapis-plugin-services`
  crate in `lapis-plugins`; Notes owns application policy and coordination.
- Tauri embeds core and retains window/OS policy. The Axum server embeds core,
  owns authentication and managed-vault admission, and serves the current Web
  build. The Node companion protocol is transitional.

One admitted runtime owns each vault's writers, jobs, indexes and service
configuration. Views and tabs attach as clients. Closing windows detaches clients
while accepted work continues until the application quits. Explicit vault close,
disable and Quit fence admission, cancel where needed and drain persistence.
Restart restores completed/interrupted/uncertain outcomes without replaying
prompts or uncertain effects. An independent OS daemon is outside this plan.

Use one authoritative implementation for each service/vault during staging.
Never dual-write or fall back after an uncertain failure. An unavailable selected
service reports its actual state. Lazy services start only when admitted.

## Contracts and retained behaviour

- Rust DTOs generate JSON schemas and TypeScript types with a drift gate.
  Commands, queries, job snapshots, progress and capabilities share domain
  contracts over Tauri IPC and versioned HTTP/SSE.
- Replace tRPC with a coordinated client/server upgrade; stale clients fail
  explicitly. Keep file/resource bodies streamed and ordinary App/Vault,
  AppDatabase and History plugin-facing interfaces behind adapters.
- Hosts derive caller authority and resolve opaque vault IDs. Browser input
  never selects roots, credentials or executables. Service lifetimes are
  independent of event subscribers and client acknowledgements.
- First-party background tools/processors execute in native services. Label
  extensions as service-owned or client-dependent. Missing clients cannot
  execute JavaScript callbacks; report unavailable or uncertain outcomes without
  silently retrying them. Do not embed another JS application runtime.
- All saves, AI edits, restore and undo share service writer coordination.
  Editor clients retain dirty buffers and report revisions; a disconnect cannot
  silently grant permission to overwrite them.
- Keep current conversation formats, hashes, Markdown memory, notes, settings
  and repository history. Durable job authority is separate from disposable
  indexes. Rebuild derived indexes where appropriate; no Deno-era import is
  required. All memory remains vault-visible.
- Preserve native execution mode negotiation, exact approval option IDs,
  cancellation, prompt/context separation and explicit unknown outcomes.
  Restore never authorizes execution.

## Ordered implementation

Each complete part has an acceptance gate, owning evidence and a Jujutsu commit.
The numbered parts below make the first extraction independently reviewable
without claiming the whole vault or server slice has shipped.

| Slice | Deliverable                                                                                             | Acceptance gate                                                                                                         |
| ----- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| R0    | Save plan, source review, retained-work mapping and ownership guidance                                  | Formatting, specification checks and truthful ledger                                                                    |
| R1.1  | Extract existing native vault file engine into Notes-owned core; desktop consumes it directly           | Real-file conformance, conditional/crash/escape tests and desktop native regression checks; no duplicate implementation |
| R1.2  | Shared protocol, admitted vault/writer owner and service lifetime                                       | Competing clients, revoke/drain, detach/reconnect and conditional publication                                           |
| R1.3  | Tauri and authenticated Rust HTTP adapters, existing shell read/edit and native backup ownership        | Same file actions through both hosts; backup after client detach and controlled Quit                                    |
| R2    | One durable ACP conversation through existing chat                                                      | Real accepted turn completes with no client; reconnect/cold restart without replay                                      |
| R3    | Native AppDatabase, metadata/projection/Search reconciliation and history-index scheduling              | Index external changes with no client; equivalent query results and cache rebuilds                                      |
| R4    | Queues, participants, skills/context/handoff, approvals, native tools and Changes/undo                  | Existing desktop scenarios through both transports, including conflict and uncertain outcomes                           |
| R5    | Native memory capture/recall, claims, schedules, forget and relocation                                  | Unattended maintenance, no duplicate job, handwritten edits and cold recovery                                           |
| R6    | Imports/capture, existing Forge/transfer and Compute jobs, installation transactions, terminal lifetime | Qualify each operation's detach/progress/cancel/interrupted-publication behaviour                                       |
| R7    | Complete Rust hosted access and retire Node/companion/obsolete desktop orchestration                    | Complete hosted/desktop journeys, Linux packaging and standalone-browser regression checks                              |

R1.3 shell acceptance depends on the existing high-level AppDatabase method
catalogue. Bring that native database facade portion of R3 forward to connect
the retained hosted shell; do not expose raw SQL or add a browser fallback. R3's
unattended indexing, Search and history-scheduling gates remain unchanged.

R3 includes native semantic Search using ONNX Runtime and the current model,
tokenizer, pooling and normalization contracts. Keep the browser implementation
for local web. Qualify model output/retrieval before switching; token-hash
embeddings cannot silently replace configured semantic embeddings.

R6 reuses existing terminal engines and does not introduce hosted terminals.
Existing public Agent and Repository screens remain the integration surface.
Preserve live-leaf capture, exact operation pins and awaitable host teardown.

### R2 delivery checkpoints

R2.2 retains one application-adoption gate, with the following implementation
checkpoints so transport completion cannot be mistaken for completed chat.
These divide the existing scope; they do not add another migration.

| Task   | Deliverable                                                      | Acceptance boundary                                                                                   |
| ------ | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| R2.2.1 | Typed turn protocol, native HTTP commands and public client port | Native worker/detach/restart fixtures, authenticated transport, SDK and browser regressions           |
| R2.2.2 | Service-owned conversation creation and sequential continuation  | Follow-up turns retain one conversation and its files; reconnect/recovery never replay work           |
| R2.2.3 | Tauri selection and existing chat observing the native writer    | Existing Agent screen through both hosts, with no renderer transcript writer for the selected service |

R2.3 remains the actual-provider, detach and cold-application gate after these
checkpoints. A configured-binary protocol fixture is source evidence only.

### R4 delivery checkpoints

The [current source review](spec/records/2026-10-26-r4-service-ownership-review.md)
confirms R4's existing scope. R4 remains Waiting on R3; these checkpoints divide
that scope and do not change defaults or grant feature completion.

| Task | Deliverable                                                                                    | Acceptance boundary                                                                                                                                                                                                                                                  |
| ---- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R4.1 | Lossless retained queue captures and a vault-owned bounded FIFO over the existing turn journal | Freeze source format/receipt fixtures first. Then accept a queued explicit message durably, complete it after the preceding confirmed turn with no client, and prove cancel/Stop, capacity, competing clients, lost replies and cold explicit resume without replay. |
| R4.2 | Logical participants and one conversation publication owner                                    | Preserve authored parent/delivery/binding identities and independent outcomes; simultaneous participant workers cannot replace one another's transcript output.                                                                                                      |
| R4.3 | Native preparation of retained context, skills, commands and handoff                           | Preserve immutable instructions/modes, dispatch-time bounded attachment reads and hashes; retain explicit client-dependent capture limits and authored/context separation.                                                                                           |
| R4.4 | Native approvals and first-party application tools                                             | Preserve exact offered option IDs, current approval policy, cancellation/unknown effects and source authorization; execute supported first-party tools without JavaScript clients.                                                                                   |
| R4.5 | Changes/guarded undo and complete both-host workflow acceptance                                | Reuse exact operation/revision pins and the R3 writer/intent guard; qualify retained public screens, rich workflow payloads, detach and cold recovery through both transports.                                                                                       |

R4.1 starts with the currently declared single-recipient plain-text Core profile;
unsupported rich payloads remain visibly unavailable rather than accepted and
dropped. Its source codecs preserve the complete retained queue format before
other controls are enabled. Application request UUIDs and authored message IDs
remain distinct. Provider-default effort must retain its existing omission
semantics. A source-codec pass alone does not complete the service/host gate.

Reuse Notes `RecordStore`, `TurnJournal`, portable conversation files and the
existing `lapis-ai-service` execution port. Keep the current single execution
lane until participant publication is explicitly coordinated. A passive client
detach does not stop an accepted live native queue; explicit Stop, disable,
vault close and Quit retain their pause/drain authority. Cold restore reads a
paused queue and never dispatches it automatically. Explicit resume can admit
only still-unstarted items, never replay started or unknown deliveries.

## Work retained from the hosted parity plan

The original [AI/history plan](AI_HISTORY_PARITY_PLAN.md) is a historical roadmap
for the Node approach, superseded for future implementation by this plan.
Qualified source contracts and tests remain useful; their feature gates are
carried forward rather than restarted or marked complete.

| Existing work                                           | Disposition                                                                                         |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| H00/H01 qualified Node baseline                         | Keep as serving baseline until R7                                                                   |
| H02 neutral history and companion                       | Reuse neutral service; retire companion transport at R7                                             |
| H03 hosted history/restore                              | Reuse qualified feature contracts/tests from committed hosted branch; record integration separately |
| H04 native ACP/host backend                             | Reuse `lapis-ai-service` and execution abstraction                                                  |
| Committed H05 engine, retention and request correlation | Retain behavioural fixtures and contracts; replace Node-specific ownership with Rust                |
| Uncommitted H05 accepted-work experiment                | Leave intact in `hosted-services`; do not finish or import it as a production prerequisite          |
| H06/H07/H08/H09                                         | Carry existing scope into R4/R5/R6; do not expand deferred functionality                            |
| H10 qualification                                       | Carry into R7, retaining source/native/provider/platform distinctions                               |
| H11 Docker backend                                      | Deferred                                                                                            |

## Verification and governance

Prefer parallel agents for independent implementation, with disjoint file
ownership and review before intake. Portable local validation defaults to the
repository-owned Docker lanes, including remote Docker when configured; retain
explicit native lanes for actual OS/WebView and platform artifacts. Bound heavy
Rust and browser runs by the selected machine’s capacity. Parallel work does not
change feature dependencies or allow a source checkpoint to satisfy a host gate.

- First reproduce the exact affected boundary. Reuse stored-format/hash, vault,
  AppDatabase, Markdown/Unicode metadata, Search, tool and history fixtures.
- Exercise common service acceptance over both transports; cover multiple
  vaults/clients, stale cursors, duplicate submissions, approval races, external
  edits, failed persistence and restart. Core-only extraction does not qualify
  an unimplemented hosted adapter or a provider journey.
- Add minimal-shell stories for visible reconnecting, pending, conflict,
  interrupted and client-dependent states using production presentation.
- Keep desktop tests headless by default. Native window/OS acceptance is a
  separate gate and must not be claimed from browser mocks.
- Follow each source repository's verification ladder. Record exact commands,
  before/after failures and source/native/provider/Linux evidence separately.
  Do not rerun unrelated expensive lanes without a relevant change or failure.
- The master ledger links owning desktop task/evidence status. Keep current
  shared-screen M15.1 and original M10/native-provider gaps explicit.
- Audit core independence and reject new authoritative schedulers in desktop or
  hosted presentation. Standalone browser fallback is an intentional exception
  with shared conformance fixtures, not a second desktop writer.
- Keep portable published ranges. Private native consumers may use the existing
  documented temporary sibling prerequisites, recording revisions. Publication,
  signing, installed-app replacement and deployment require separate authority.

## Defaults and limits

The hosted deployment has one owner and multiple managed vaults. Preserve
standalone local/offline web. Deno desktop stays frozen. Docker execution,
multi-user collaboration, hosted terminal, an OS daemon and new deferred feature
expansions are outside this migration. Do not revive the deferred native
AgentStore/ThreadStore conversation experiment.

## Remaining History scope (2026-10-26)

R3.2.3.6 is split in [remaining native History parity](spec/src/architecture/rust-history-parity.md):
guarded restore first, capture/settings controls next, then original-repository
source selection. Optional legacy AppDatabase History capture ownership is
Deferred: current Desktop and hosted profiles do not bundle that plugin, and its
installed behavior remains client-driven in both. Native repository restore and
original-source parity remain mandatory; no replacement scheduler or UI is added.
