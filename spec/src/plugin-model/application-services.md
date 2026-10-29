# Plugin Model / Application services

The ordinary hosted profile selects native metadata, History and Tasks together
under LN-CORE-069. Plugin observers keep their existing owning App and native
admission; standalone local Web keeps its separate browser implementations.

R7 static asset delivery keeps plugin modules and authenticated installed resources
on their existing admitted routes. Serving the built application from Rust grants
no additional plugin file, credential, App or execution authority.

Semantic-model transport acceptance uses an admitted host client and the
existing database provider. The retained Search plugin journey separately owns
provider declarations, renderer-writer fencing and native selection lifetime;
model qualification introduces no plugin callback or ambient App authority.

The App-owned `fileEditingSessions` registry may bind an admitted native
editing-intent port under [LN-CORE-019–021](../architecture/native-editor-intents.md).
Plugins register their real writer and saved text through that registry; native
readiness, protection and protected yield/rearm remain App-owned. The port
grants no path, secret or persistence authority beyond the admitted host client.

The public `NativeTurnService` is an already-admitted host port. Its generated
DTOs carry portable commands and observations; plugins cannot nominate native
launch paths or credentials. Accepted work and transcript writes stay in Core
under LN-CORE-003/004. The native chat profile refreshes trusted target metadata
and submits its declared default mode under
[LN-CORE-009/010](../architecture/rust-turn-admission.md#ln-core-009). Plugin
labels and opaque target IDs cannot infer provider modes; explicit native API
requests retain their authored mode. The hosted actual-provider screen verifies
that App teardown releases its admitted client while accepted work continues;
cold History reads preserve the exact result without another Submit. Desktop's
separate screen acceptance remains R2.3.

The optional admitted `NativeQueueService` and shared chat queue observer follow
[LN-CORE-036/037](../architecture/rust-queue-admission.md#ln-core-036). Plugins and
views supply no queue scheduler or transcript writer. A host declares complete
recipient/capture metadata separately from an opaque runtime target; missing
discovery leaves UI queue capture unavailable while preserving idle R2 sends.
Retained native state supplies queue controls and status receipts. View detach
stops observation; explicit feature disable retains native pause/fence/drain.
Installed-provider queue acceptance preserves that observer boundary through
passive logout, native FIFO progress and explicit retained-screen Stop/resume;
it introduces no plugin scheduler, provider credentials or extra writer.

Hosted screen resources are prepared before the owning VaultSession and released
after its App/database teardown. This host connection preserves existing plugin
registration and explicit App ownership. Rust installed content uses the shared native verifier behind authenticated
admissions, while the existing client installer retains signature/trust and
plugin lifecycle. R1.3.9.3 qualifies delivery separately from R6 transactions.
Generated capabilities admit vault transfers without selecting Node.

Web hosts own the existing vault-change lifecycle before ready and through
teardown. File views retain rename/move projection through that owned App;
plugins need no host-specific observer or replacement file-management callback.

LN-SRCH-051 gives plugins disposable result-source registrations. The Plugin helper namespaces their IDs and removes their invalidation subscriptions on unload; it grants no additional source access.

The Sync flush port uses the owning App's complete workspace under LN-ARCH-128.
Local mutation admission also owns source cancellation before provider calls
and key teardown under LN-ARCH-122; a rejected guard cannot leave an input live.
Independent file writers can register with `App.fileEditingSessions` under
LN-ARCH-129 through LN-ARCH-131. This service has no plugin protocol or secret
authority, and production Sync apply still requires every writer's integration.

## LN-PLUG-011 — Package or repository rename: preserve runtime IDs, commands, view types, filenames

<a id="ln-plug-011"></a>

**Requirement.** A package or repository rename MUST preserve runtime IDs, commands, view types, filenames, and plugin-data paths unless a separate migration requirement explicitly changes them.

## LN-PLUG-014 — Plugin ribbon and status contributions: appear only while their owner is enabled

<a id="ln-plug-014"></a>

**Requirement.** Plugin ribbon and status contributions MUST appear only while their owner is enabled, and their commands MUST reuse existing compatible leaves. Status descriptors MAY choose left, center or right placement and attach a click menu through the same projected item.

## LN-PLUG-016 — Explicit view-access classifications

<a id="ln-plug-016"></a>

**Requirement.** Every first-party `Plugin.registerView` and `Plugin.registerSidebarView` registration MUST declare `ViewAccess` metadata as exactly one of `command`, `file`, `internal`, or `alias`; omitted metadata remains supported only for third-party compatibility.

## LN-PLUG-017 — ViewAccess.command registration: contribute one concise Open … command

<a id="ln-plug-017"></a>

**Requirement.** A `ViewAccess.command` registration MUST contribute one concise `Open …` command through its owning plugin, while `file`, `internal`, and `alias` registrations MUST NOT add a duplicate palette opener.

## LN-PLUG-023 — Plugin.registerAgentSlashCommand: register a composer slash command under

<a id="ln-plug-023"></a>

**Requirement.** `Plugin.registerAgentSlashCommand` MUST register a composer slash command under the owning plugin and dispose it on unload. It MUST NOT add a workspace palette command. Dispatch kinds MAY be host, tool, skill, or prompt.

## LN-PLUG-024 — Plugin.registerAgentResultView: register a transcript result view under

<a id="ln-plug-024"></a>

**Requirement.** `Plugin.registerAgentResultView` MUST register a transcript result view under the owning plugin and dispose it on unload. The view MUST name exactly one of `tool` or `command`. It MUST NOT add a workspace palette command. Duplicate active keys MUST be rejected.

## LN-PLUG-031 — First-party plugin and cache instrumentation: depend only on the App telemetry contract

<a id="ln-plug-031"></a>

**Requirement.** First-party plugin and cache instrumentation MUST depend only on the App telemetry contract and remain safe under `NoopTelemetryService`. Search provider failures MAY increment a bounded failure count, but plugin IDs, provider payloads, settings, document paths, content, and error messages MUST NOT become telemetry attributes or structured logs.

## LN-PLUG-062 — Plugin detail Back navigation: use a compact left-aligned icon button

<a id="ln-plug-062"></a>

**Requirement.** Plugin detail Back navigation MUST use a compact left-aligned icon button with a circular hover treatment, a tooltip and visible keyboard focus. It MUST return to the originating Plugins homepage or filtered directory without clearing its filters or scroll state.

Under LN-CORE-005/006, selected native indexing receives bounded processor and
projection identities, never JavaScript callbacks. Known compiled Tasks/Docs
contributions retain query handles; client-dependent contributions report
unavailability. Explicit plugin disable drains and fences its native projection;
App/view detach releases observation only. See the
[native ownership contract](../architecture/rust-indexing-lifetime.md).

The shared App indexing observer admits Search provider identities and chunk
settings without callbacks. Explicit Search plugin disable drains the native
owner, including after an uncertain selection response; App detach is passive.

Native metadata compatibility events follow
[LN-DB-064](../app-database/metadata-and-indexing.md#ln-db-064). Plugins receive
the matching committed metadata after either database-first or Vault-first
delivery, rather than gaining a second metadata writer to repair ordering.

Native editing Problems under LN-CORE-027 are App-owned service diagnostics.
They do not give a plugin claim ownership or a second persistence path; local
retry and native captured-state actions remain within App operation admission.

Native participant hosts follow [LN-CORE-048](../architecture/rust-participants.md#ln-core-048): adapt declared logical profiles and retained receipts into the existing complete Agent screen. Native publication remains the only writer; passive view lifetime never owns accepted work.

Native chat layout capture preserves saved conversation/scope before mount;
only an observed new draft clears the saved conversation. This retains existing
view state through native metadata/History/Tasks boot without creating a writer
or resubmitting accepted work. The pre-mount regression reproduces0/1 and passes
after the view-owned repair; final combined hosted acceptance remains R7.
