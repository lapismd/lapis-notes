# Architecture / Editor integration

## LN-ARCH-145 — Protected managed trash

<a id="ln-arch-145"></a>

**Requirement.** FileManager trash and deletion commands MUST protect and flush registered writers before filesystem removal, including folder descendants. Failed persistence MUST prevent removal and release protection for explicit retry. Admission MUST retain the originally selected source path; changed targets MUST reject before IO. Native removal failures MUST remain observable without leaving editing protected.

Application-state writers under
[LN-PKG-173](../packages/configuration-and-lifecycle.md#ln-pkg-173) and
[LN-PKG-174](../packages/configuration-and-lifecycle.md#ln-pkg-174) share the
App-owned registry. Their logical updates serialize before calculating a new
record, and their flush performs IO directly within its admitted operation.
Configuration, shortcut and plugin state retain distinct file baselines and
recovery callbacks; the host cannot replace them with independent save paths.
On conditional-capable hosts, the API Workspace configuration bridge admits
shared Settings changes synchronously through the public change event, before
the presentation controller's debounce. It submits only the changed field when
one is supplied, preserving independent queued API updates. API-to-controller
projection does not submit another write. The controller's deferred save does
not enqueue a second operation from inside the protected shutdown callback.

## LN-ARCH-142 — Document-owned conditional save baselines

<a id="ln-arch-142"></a>

**Requirement.** API editors on a vault advertising conditional text writes MUST save against their document-owned last acknowledged text. Background reads MUST NOT advance a dirty document's baseline. Successful saves and accepted clean refreshes MUST advance only that document's baseline. Hosts without that optional capability MAY retain existing persistence; an attempted conditional operation MUST NOT fall back to an unconditional write.

## LN-ARCH-143 — Retained editor conflicts

<a id="ln-arch-143"></a>

**Requirement.** Conditional API editor save conflicts MUST retain local text, the document baseline and an authoritative external snapshot or observable read failure. The original App MUST expose conflicts through a subscribable registry, including inactive and retired writers. Further editing MUST update retained local text without silently resolving the conflict. Flush and shutdown MUST remain blocked until explicit resolution.

## LN-ARCH-144 — Explicit conflict resolution

<a id="ln-arch-144"></a>

**Requirement.** Keeping local text MUST condition replacement on the displayed external snapshot; accepting external text MUST revalidate that snapshot before discarding local text. Another external change or unavailable snapshot MUST retain the conflict and require a new decision. Resolution MUST protect the document, drain pending saves and update only its original context. Resolving a retired writer MUST release its barrier without changing another document.

Host shutdown uses the pathless editing guard before destructive teardown. The
API-owned layout flush under [LN-WS-095](../workspace-shell/layout-and-persistence.md#ln-ws-095)
joins workspace persistence while that protection remains held. Registry disposal
follows the guard; a callback cannot await its own queued registry operations.
App-owned event projection uses `afterMutations` to schedule clean view rebinding
between admitted mutation guards. It does not acquire another editing guard or
flush dirty external writers. Guard callbacks may schedule this detached work,
but must not await it while holding their guard.

The public FileTextPersistence contract under
[LN-PKG-170](../packages/vault-and-storage.md#ln-pkg-170) lets independent file
writers share this conflict lifecycle. Each recovery carries its own protected
acknowledgement and reset callbacks, including asynchronous surface admission.

Managed frontmatter and metadata mutations under
[LN-PKG-172](../packages/vault-and-storage.md#ln-pkg-172) join the same serialized
registry before transformation. Their writer is admitted after existing
documents are protected and flushed. Failed computed drafts remain registered;
recovery excludes only that retained writer while protecting the other writers
of its file. A presentation-owned property record is checked against parsed
authoritative input, independently of unrelated body edits.

Mutable metadata type state retains one App-owned text writer and acknowledged
baseline across edits. Its saves and recovery run on the registry queue;
protection blocks model edits before yielding. Later edits update a retained
conflict's local snapshot. A flush already admitted by a lifecycle guard performs
IO directly without reentering the queued guard, preventing shutdown deadlock.

## LN-ARCH-137 — Guarded document-load admission

<a id="ln-arch-137"></a>

**Requirement.** Editor document loading MUST register its target before asynchronous reads and synchronously protect editing while draining original saves. Target-session protection and flush MUST wait for load publication or cancellation before admitting mutation. Controlled publication MUST bind file and contents together without a writable intermediate state. Read/save/publication failure, including synchronous publisher cancellation, MUST preserve the previous document and release the provisional registration.

## LN-ARCH-138 — Document-load cancellation and provenance

<a id="ln-arch-138"></a>

**Requirement.** A newer document load MUST supersede an older read without waiting for its result or allowing stale publication. Unload and destruction MUST cancel pending publication and release loading protection. Late read failure MUST be observed without affecting a newer document. Changed editor or view App, or target path MUST reject publication; loads started during independent editor protection MUST reject without changing the current binding.

## LN-ARCH-139 — Protected managed rename

<a id="ln-arch-139"></a>

**Requirement.** FileManager rename MUST protect and flush registered writers before moving a file/folder or calculating link replacements. Failed persistence MUST prevent rename and release protection. Protection MUST cover movement and link rewrites so pending editor timers cannot recreate the old path. Admission MUST retain the originally requested source path; changed targets MUST reject before filesystem mutation.

## LN-ARCH-132 — Document-owned editor save state

<a id="ln-arch-132"></a>

**Requirement.** Editor documents with a file MUST register a session with their original App. Owner, file, persistence-mode or writer changes MUST drain queued snapshots into their original save context before rebinding. Success in another context MUST NOT clear an earlier failure or skip its retry. Retired dirty contexts MUST remain registered until persistence succeeds; rejected registration MUST preserve the previous binding.

## LN-ARCH-133 — Protected API editor transactions

<a id="ln-arch-133"></a>

**Requirement.** Editor protection MUST synchronously block ordinary document transactions, explicit persistence and document/owner rebinding before draining saves. Independent idempotent leases MUST keep protection until every lease releases. CodeMirror readonly state and transaction filtering MUST survive extension reconfiguration. Controlled file refresh MAY update a protected clean buffer without queuing a write; document loading and public resets MUST NOT bypass protection.

## LN-ARCH-134 — Persistence-safe editor destruction

<a id="ln-arch-134"></a>

**Requirement.** Editor destruction MUST stop editing and begin draining queued snapshots instead of canceling them. Awaitable disposal MUST join persistence and report failure. Dirty retired sessions MUST remain registered for explicit host retry after their view is destroyed, and late completions MUST NOT notify a disposed or rebound surface. Successful retry MUST release retired registration without changing another document's buffer.

## LN-ARCH-135 — Captured external persistence writer

<a id="ln-arch-135"></a>

**Requirement.** API editors MAY bind an asynchronous external persistence writer. Saves MUST capture that writer and original App/file/content, join its completion and retain failure before acknowledging saved data; rebinding MUST NOT redirect queued writes. Protected admission MUST reject external mode without an explicit writer because notifications cannot prove persistence. Legacy notification-only editing MAY remain available, but queued unverified sessions MUST retain their barrier after retirement.

## LN-ARCH-136 — Text view save ownership

<a id="ln-arch-136"></a>

**Requirement.** `TextFileView.save` MUST persist the current Editor buffer through its captured persistence boundary rather than issue a parallel Vault write from cached view data. It MUST reject while editing is protected or destroyed and await persistence before reporting success. Optional clearing MUST affect only the same file binding captured before saving.

## LN-ARCH-129 — App-owned file editing sessions

<a id="ln-arch-129"></a>

**Requirement.** Each App MUST own a generic file editing-session registry, independent of Mira and Sync protocols. Sessions MUST expose dirty state, asynchronous flush and protection with an idempotent release. Registrations MUST bind a canonical vault-relative path and deduplicate a shared session. Detached dirty sessions MUST remain discoverable until successful persistence; changing paths MUST require a new session while the old session remains dirty.

## LN-ARCH-130 — Protected editing-session admission

<a id="ln-arch-130"></a>

**Requirement.** Registry guards MUST serialize callbacks, protect every matching session before flushing and admit mutation only after all protections and saves settle successfully; pathless guards MUST cover every file. Matching registration during admission or mutation MUST reject synchronously so writers can disable editing. Failed admission MUST drain all acquired releases. Callback failure MUST still release every acquired protection; failed release MUST withhold subsequent admission until cleanup succeeds.

## LN-ARCH-131 — Editing-session registry shutdown

<a id="ln-arch-131"></a>

**Requirement.** Registry shutdown MUST synchronously reject new registration, flush and guard requests, join admitted callbacks, reject not-yet-running callbacks and protect/flush remaining sessions before completion. A failed save or release MUST remain observable after all work settles and retain retryable cleanup. Repeated shutdown MUST join in-flight cleanup and permit retry after failure. Registrations and protection barriers MUST remain instance-owned without consulting ambient application state.

The registry does not replace API-editor discovery or activate Sync apply. Hosts
must integrate every writer's registration and lifecycle before selecting it as
the production apply guard.

## LN-ARCH-125 — Serialized editor persistence barrier

<a id="ln-arch-125"></a>

**Requirement.** API editor persistence MUST serialize debounced and explicit saves. Flush MUST join in-flight writes and drain the latest queued value; older completions MUST NOT replace a newer buffer through change notifications. Failed persistence MUST remain dirty, reject flushing and permit an explicit retry without losing the current buffer. Background failures MUST NOT become unhandled promise rejections.

## LN-ARCH-126 — Captured editor persistence destination

<a id="ln-arch-126"></a>

**Requirement.** Queued editor changes MUST retain their owning application, file and persistence mode from queue time. Switching files MUST NOT redirect an old write or notify the new document with old content. Editor reconfiguration MUST NOT discard pending persistence. These rules MUST apply independently of whether a pane is active.

## LN-ARCH-127 — Guarded editor file refresh

<a id="ln-arch-127"></a>

**Requirement.** File-change refresh MUST preserve unsaved editor text and reject reads completed after a document, owner, buffer or persistence generation changes. Out-of-order reads and disposed trackers MUST NOT restore stale content. Clean buffers MUST remain refreshable; a matching disk value MAY acknowledge mirrored content without replacing it. Failed refresh MUST retain the buffer and remain observable without an unhandled promise rejection.

## LN-ARCH-128 — Workspace-wide editor flush

<a id="ln-arch-128"></a>

**Requirement.** App Sync flush MUST discover workspace-owned API editors across active, inactive, sidebar, grouped and floating leaves. It MUST deduplicate shared instances, honor a requested path and reject changed document bindings or failed persistence. Every captured flush MUST settle before success or failure returns; success MUST require a matching editor. External Mira sessions require their separately registered persistence/protection boundary.

## LN-ARCH-010 — Editor demo bootstrap ownership

<a id="ln-arch-010"></a>

**Requirement.** The runnable editor demo MUST keep demo bootstrap and source-editor policy in Storybook fixtures while reusable runtime contracts remain in API, reusable File Explorer remains in `@lapis-notes/file-explorer`, Markdown owns Tags, and generic startup presentation remains in Design Core. Design Core MUST own current, reveal-or-create, and forced-new-tab Explorer intents while Lapis maps them to workspace leaves.

## LN-ARCH-020 — Api source-editor shell: expose the configured CodeMirror fold gutter

<a id="ln-arch-020"></a>

**Requirement.** The api source-editor shell MUST expose the configured CodeMirror fold gutter for language-provided fold ranges outside Markdown. Markdown MUST use Mira's inline fold controls without also painting the generic gutter.

## LN-ARCH-021 — Source editor's design-core ScrollArea: remain bounded by its workspace view

<a id="ln-arch-021"></a>

**Requirement.** The source editor's design-core ScrollArea MUST remain bounded by its workspace view and own vertical document scrolling. Nested CodeMirror scrollers MUST expand with content and MUST NOT paint a second vertical scrollbar. Its scrollbar interaction rail MUST remain pointer-reachable above an adjacent workspace resize rail.

## LN-ARCH-026 — API editor: consume diagnostic glyphs and semantic colours

<a id="ln-arch-026"></a>

**Requirement.** The API editor MUST consume diagnostic glyphs and semantic colours from Design Core's public workspace contract. It MUST keep CodeMirror-specific marker mounting, tooltip geometry, and pointer lifecycle inside the editor boundary. An open diagnostic card MUST retain its origin and placement throughout pointer handoff.

## LN-ARCH-027 — API editor: own CodeMirror inline-problem structure and styling. It

<a id="ln-arch-027"></a>

**Requirement.** The API editor MUST own CodeMirror inline-problem structure and styling. It MUST consume public workspace semantic tokens without moving editor-specific widgets into Design Core or application-global styles.

## LN-ARCH-033 — @lapis-notes/search: keep indexing and query execution behind API

<a id="ln-arch-033"></a>

**Requirement.** `@lapis-notes/search` MUST keep indexing and query execution behind API contracts while composing its grouped tree, settings, facets, badges, and overlays from public Design Core exports. Markdown panels MAY invoke Search only through commands.

## LN-ARCH-039 — Roles: own the ported legacy Applications page presentation

<a id="ln-arch-039"></a>

**Requirement.** Roles MUST own the ported legacy Applications page presentation and adapt only domain, vault, navigation, and Markdown/editor boundaries to Lapis APIs. Design Core remains the source of shared controls and Lapis remains the source of the outer workspace shell; neither boundary may recompose the ticket board, activity timeline, actions board, or `detail-perma` role sheet into a visually different page.

## LN-ARCH-053 — Bases: own advanced-filter draft validation inside its query

<a id="ln-arch-053"></a>

**Requirement.** Bases MUST own advanced-filter draft validation inside its query workflow. CodeMirror presents and describes the draft's accessible invalid state, while only a valid expression may cross into the applied document filter; API and Design Core contracts remain unchanged.

## LN-ARCH-065 — API: own plugin-scoped Markdown extension and file-surface registries

<a id="ln-arch-065"></a>

**Requirement.** API MUST own plugin-scoped Markdown extension and file-surface registries. Domain plugins MAY contribute CodeMirror and rendered-Markdown behavior through public contracts, while the bundled Markdown plugin remains the sole Mira adapter and full-file surface provider. Contributions and providers MUST be disposed with their registering plugin.

## LN-ARCH-080 — Graph: cross the AppDatabase boundary through bounded metadata

<a id="ln-arch-080"></a>

**Requirement.** Graph MUST cross the AppDatabase boundary through bounded metadata and link batches. Graph view failures remain locally visible and MUST also enter an owner-scoped Problems collection as active-file or workspace diagnostics; successful recovery clears them without transferring Graph lifecycle ownership to the shell.

## LN-ARCH-082 — Design Core: own the reusable structured-query input, completion presentation

<a id="ln-arch-082"></a>

**Requirement.** Design Core MUST own the reusable structured-query input, completion presentation, colour popover, and sortable-row interaction. API MUST own the shared vault syntax/completion model. Graph MUST depend only on those public contracts, AppDatabase path-only membership, and the public Markdown read-only embed while retaining viewport-clamped settings-panel composition with guttered handles, divider-free idle rows, rounded whole-row focus paint with an outer trailing gap, and visible padding-owned row actions with an internal trailing gutter; it MUST NOT import Search-plugin internals or duplicate Markdown rendering.

## LN-ARCH-086 — AI: own the read-only .jsonl file association because

<a id="ln-arch-086"></a>

**Requirement.** AI MUST own the read-only `.jsonl` file association because it owns the portable transcript and agent record schemas. The view MUST cross only public API file-view, Design Core chat, and Markdown embed boundaries; it MUST NOT transfer append-only persistence authority to workspace presentation, add a file command, or make Source Editor interpret AI records.

## LN-ARCH-088 — Workspace-owned plugin management: compose public Design Core SearchFilterBar, FilterCommandPicker, Resizable

<a id="ln-arch-088"></a>

**Requirement.** Workspace-owned plugin management MAY compose public Design Core SearchFilterBar, FilterCommandPicker, Resizable, and settings navigation primitives. Registry state, verified Markdown, filtering, installation actions, and application policy MUST remain in Lapis; reusable search, command-option, resizing, and responsive settings-shell behavior MUST remain in Design Core.

Attachment dropping keeps Design Core presentation and the existing Explorer callback. File Explorer owns admission, input bounds and FileManager new-file integration under LN-EXP-010/011/012. The API retains exclusive publication and tree projection; hosts do not add a replacement importer or bypass existing save ownership.
