# Plugin Model / Application services

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
