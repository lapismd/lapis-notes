# Native logical participants

Retained authored identity, independent native delivery outcomes and one
conversation publication owner govern the source-only R4.2 checkpoints.
Installed runtime targets remain separate from logical recipient attribution.

## LN-CORE-033 — Retained native participant identities

<a id="ln-core-033"></a>

**Requirement.** Explicit native addressed messages MUST durably retain one exact
authored parent and dispatch capture with one to four distinct recipient/delivery
identities. Native request and binding identities MUST remain independent of
authored IDs, labels and runtime targets. Every target MUST receive current native
admission before acceptance. Captured tags MUST NOT grant execution, credentials,
tools, file access or provider-resume authority.

The source-only participant port reuses the existing turn journal, execution port
and private record store. It captures per-delivery inputs independently; retries
of the same acceptance return retained state and changed retries refuse. Its first
profile accepts plain text and explicit turn options. Rich context, tools,
approvals, live host/UI selection and participant provider resume retain their
existing R4 gates. Equal runtime targets or labels never merge logical recipients.

## LN-CORE-034 — One conversation publication owner

<a id="ln-core-034"></a>

**Requirement.** Participant workers MUST publish through one service-owned
conversation writer with shared exact transcript, binding and metadata revisions.
One worker's progress or terminal outcome MUST preserve every other delivery's
output and attribution. The authored parent MUST appear once, and each started
delivery MUST retain its exact binding before a native prompt. An external edit
or failed publication MUST fence later writes instead of replacing that content.

Worker output and outcomes remain independent even when several admitted native
workers complete simultaneously. Publication serializes owned updates; it does
not blindly reread/merge unknown external text or grant another save authority.
Ordinary turns and existing FIFO/default selection retain their single-lane
admission. No renderer writer or second execution engine is introduced.

## LN-CORE-035 — Participant recovery without replay

<a id="ln-core-035"></a>

**Requirement.** Cold participant recovery MUST retain independently confirmed
terminal outcomes, project unfinished started deliveries as unknown and unstarted
deliveries as not sent. Recovery MUST NOT dispatch, retry or resume a provider.
Only fresh durable acceptance MAY create native dispatch claims. Disable, cancel,
vault close and Quit MUST retain existing admission, cancellation and drain
authority across every participant worker.

Cancellation observed before a delivery's started barrier retains cancelled
without entering the execution port. Known rejected/unknown outcomes fence any
still-unstarted sibling as not sent; already-started outcomes remain independent.

The private message record and native turn journal distinguish accepted input,
started-before-prompt authority and terminal publication. A lost reply does not
authorize another claim. Source fixtures do not qualify either actual host,
external providers or complete R4/R4.1 workflows.

A fresh explicit continuation acknowledges retained native parent outcomes before
publishing another authored message. Its existing conversation writer preserves
or appends exact immutable unknown/not-sent entries before clearing old pending
metadata; it cannot steal an unowned or live parent. Merely reading recovery
state never writes portable conversation files.

## LN-CORE-042 — Lossless typed participant transport

<a id="ln-core-042"></a>

**Requirement.** Generated participant commands and records MUST preserve exact
accepted authored/dispatch data and separate logical, delivery, request, binding
and session identities. Several logical recipients MAY share an installed runtime
target without merging attribution or outcomes. Public records MUST exclude
private native installation and launch snapshots. Request JSON MUST be bounded
to 2 MiB and each complete message record to 8 MiB.

The dedicated accept/read/Stop/cancel port reuses the existing shared native-turns
entry, private record store, native turn owner and single publication owner.
Retained capture values remain independently validated by Core; generated
`unknown` fields do not authorize opaque provider or executable data.

## LN-CORE-043 — Admitted participant controls

<a id="ln-core-043"></a>

**Requirement.** Participant HTTP calls MUST reuse current protocol, admitted
client/vault/principal, Origin and CSRF authority before Core access. Stop MUST
address one acceptance, and cancel MUST match that acceptance's native request.
Lost replies and passive detach MUST NOT transfer ownership or trigger replay.
Cold observation and exact acceptance retries MUST retain independent outcomes
without dispatch, retry or provider resume.

Control acknowledgements report cancellation requests rather than inventing a
confirmed terminal outcome. Unknown or foreign associations cannot cancel another
message. Disabled services preserve observation of prior acceptance while refusing
new work. Native logical-profile catalog resolution, actual host selection and
complete both-host R4.2 adoption remain separate integration gates; a runtime
catalog entry is not a logical profile and captured labels never supply routing.

## LN-CORE-046 — Declared logical-profile captures

<a id="ln-core-046"></a>

**Requirement.** Core MUST project logical profiles from existing trusted
installation policy, preserving identities independently of runtime targets.
The catalog MUST contain at most sixteen distinct profiles; one runtime MAY
serve several profiles. Present selected-profile snapshots MUST retain complete
choices and native options, and match the current admitted declaration before
fresh acceptance. Missing snapshots MUST preserve existing raw admission behavior.

Sixteen is the retained configured-profile bound; thirty-two runtime targets and
one to four recipients per message remain distinct limits. Explicit provider-default
thinking remains captured without requesting native effort. The compatibility
configuration object omits unset effort; typed native `Option::None` is JSON
`null` and retains `NotRequested` with no downstream effort setter. Literal
`default` is never a requested effort value. Optional metadata uses the existing operator configuration and typed selection contracts;
there is no second catalog store. Metadata-absent R2 single-target idle behavior
and existing queue metadata remain compatible. Unsupported rich profiles refuse
rather than lose instructions, context or tools.

## LN-CORE-047 — Exact native-request receipt discovery

<a id="ln-core-047"></a>

**Requirement.** An admitted native-request lookup MUST return at most one
validated participant receipt for that exact request UUID in the current vault.
Ambiguous or corrupt matches MUST refuse without repairing stored bytes.
The lookup MUST NOT create acceptance or dispatch claims, write portable
conversation files, or retry or resume a provider. Existing conservative cold
outcome projection MUST remain independent of browser lifetime.

The lookup scans the existing bounded private receipt store, preserves all
acceptance/delivery/request associations and returns no installation snapshot.
Authored or captured identifiers are never substituted for native request UUIDs.

## LN-CORE-048 — Shared participant observation

<a id="ln-core-048"></a>

**Requirement.** Shared native chat hosts MUST project declared logical profiles
and independent participant outcomes through the existing public Agent screen.
They MUST capture each explicit message once, dispatch through the typed native
participant port, and recover unknown replies by the original acceptance identity.
Passive view detach MUST NOT stop accepted work. Failed or uncertain native
submission MUST NOT fall back to another writer, scheduler or execution path.

### Acceptance details

Shared hosts retain these capture, observation and control boundaries:

- Recipient IDs remain separate from runtime IDs and labels. UI action IDs stay
  separate from native acceptance UUIDs. Unsupported rich captures refuse, and
  missing metadata preserves ordinary single-target sends.
- All sibling states contribute to busy observation; captured binding/delivery
  attribution survives detach, cold recovery and later profile renames.
- Explicit Stop and existing leave/trust fences retain native authority. Busy
  multi-recipient queue/group interoperation remains unavailable until its group
  dependency is implemented by the queue owner; no renderer queue is introduced.

Shared-adapter and actual hosted-fixture evidence remain separate. Both retained
hosts, complete saved-profile editing, external providers, richer workflow and
complete R4.2 acceptance retain their existing gates.
