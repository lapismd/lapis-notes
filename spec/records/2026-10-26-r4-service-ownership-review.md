# R4 source review and first service-owned slice

Read-only source review, 2026-10-26. Baselines: Notes main `029e2c22` over
CORE025 `b55e03c5`, Desktop `fa13c1ce`, and Lapis AI `b4a5f747`. The AI service
and runtime sources are byte-identical to the selected native pin `6548afe0`.
No product checks or new feature qualification are claimed by this review.

## Current ownership

- Notes `services/turns` already owns accepted work, private journal authority,
  supervised execution, portable transcript publication and sequential
  conversation continuation. `submit_turn` permits one active job per vault.
  Opening the journal interrupts accepted pre-dispatch turns and marks running
  turns unknown; it cannot create another dispatch claim.
- The shared native-chat observer deliberately projects empty queues and
  requests, disables attachments/approval/runtime controls and supplies no
  application context. `TurnInput` carries one target, prompt, context and
  model/effort/mode options. This is the qualified R2 boundary, not full R4.
- Desktop owns the retained application queue and addressed-participant policy
  under `src/lib/ai/conversations` and `chat/controller`. The separately versioned
  AI plugin still carries the older controller integration; it is a reference
  for retained algorithms, not a substitute for the newer Desktop behavior.
- `lapis-ai-service` already provides host execution and injectable supervised
  execution/session ports. The ACP request enum already supports exact permission
  replies. Application queue, context, durable conversation and tool policy do
  not belong in that generic engine. Docker remains deferred.

## Compatibility needed before service queue ownership

Desktop queue version 1 retains its exact authored entry, recipient IDs/tokens/
labels, per-target model/thinking, execution modes and profile instructions,
validated comment captures and bounded attachment paths. It allows sixteen
items and 128 KiB; at most four recipients and eight attachment paths belong to
one item. Queue receipts retain stable original capture and parent identities.
Files are read at dispatch, not embedded as raw snapshots in queue metadata.

The current Core input cannot represent that full capture. In particular,
Desktop queued authored IDs use the existing `queued-user-<UUID>` string
format, independently of dispatch request UUIDs. Native publication currently
uses the request UUID as the user entry ID. New queue support must preserve the
original authored ID rather than reinterpret or regenerate it. Explicit provider
default thinking also maps to omitted runtime effort without rewriting its saved
selection. Mode/instructions are frozen at queue capture; approval-policy changes
apply to subsequent live requests under the retained approval contract.

Source-owned full-result fixtures should freeze valid and invalid queue captures,
comments, default/explicit efforts, modes/instructions and terminal receipts
before adding native admission. A small first live queue profile can keep R2's
existing single target/plain text controls; unsupported fields must be refused
before draft acknowledgement, never silently discarded.

## First implementable service slice

R4.1 should reuse the current private record store, turn journal and selected
writer. Queue acceptance and provider dispatch are distinct transitions. Persist
an exact bounded capture before acknowledging Queue; create a fresh dispatch
claim only when its preceding durable turn and cleanup are confirmed. Revalidate
native target/scope admission at dispatch. Do not retain executable, credential
or resumable provider authority in the capture.

An accepted live queue belongs to the vault owner and can advance without a
window. Explicit Stop/disable/close/Quit pauses or drains it; failure and unknown
outcomes prevent advancement. A cold view observes the paused queue without
dispatch. Native journal recovery may retain interrupted/unknown transitions;
explicit resume can select only unstarted items, never replay started deliveries.
This replaces the old renderer's `kick` lifetime instead of adding another
scheduler alongside it.

The useful first gate is: accept a held first turn and a queued explicit second
message, detach every client, complete exactly once, reconnect and verify both
portable authored entries and queue receipts. Also prove FIFO/capacity,
competing-client claims, failure/Stop/cancel, lost acceptance replies and cold
explicit-resume refusal of a previously started item. Source, transport, actual
provider and both retained-screen acceptance remain distinct.

## Why participants follow the queue boundary

Current `Conversation::write_transcript` publishes its captured prior transcript,
one user entry and one assistant entry through an exact version. Simply removing
`jobs.is_empty()` or spawning more workers would give each participant a stale
whole-conversation snapshot. The participant slice needs one service conversation
publication owner that appends independent captured delivery/binding outcomes;
it cannot rely on competing whole-file writers.

Contexts/skills/handoff, native tools/approvals and Changes/undo retain their
original R4 scope. R3's admitted writer/editor recovery is their prerequisite.
Standalone browser behavior, the deferred AgentStore/ThreadStore experiment,
Docker execution, hosted terminals and default cutover are not added here.
