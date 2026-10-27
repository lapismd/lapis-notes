# Architecture / Native conversation queues

## Retained queue capture compatibility

## LN-CORE-029 — Lossless retained queue captures

<a id="ln-core-029"></a>

**Requirement.** The native queue codec MUST preserve complete retained
version-one captures and terminal receipts against frozen, unchanged Desktop
validator results, including omitted fields, independent authored/dispatch
identities, selected provider defaults and existing bounds. Decoding MUST NOT
grant execution, credential, binding or file authority.

This is R4.1's first source checkpoint. R3 is complete; the codec
alone does not enable admission, queue scheduling, commands, transports or host
controls. Core's separate source queue admission follows LN-CORE-030 and
LN-CORE-031 below. Existing screens, host selection and defaults remain
unchanged; no new wire command or protocol DTO is introduced by these source
checkpoints.

The source fixture captures full accepted values and original validation errors
from Desktop `f276120b30395860aebed67362bfb320ded6f22c`, including imported
validators and public mention-codec provenance. Fixtures retain constructor
receipts separately from the more permissive retained receipt validator. A
compatibility read cannot invent stronger identity checks or normalize authored
bytes. Native admission must independently validate live request authority.

Queue metadata retains at most sixteen captures and 128 KiB encoded JSON, four
recipients and eight attachment paths per capture. UTF-8 byte bounds, UTF-16
string/range bounds and Unicode code-point bounds stay distinct. Captured paths
remain original data and are read only at a later admitted dispatch boundary.
Validated comment captures preserve their complete existing fields. Model,
thinking, mode and instructions are immutable capture data. Explicit `default`
thinking remains saved while its runtime effort field stays omitted. Omitted
or null per-target thinking inherits the captured global choice; explicit
`default` or `off` retains its own meaning.

The compatibility configuration object omits unset effort. The typed native
bridge carries that absence as `TurnOptions.effort: None` (JSON `null`). The
runtime reports `NotRequested` and applies no downstream effort or model setter.
The literal `default` MUST NOT become a requested effort value.

Source checks must compare complete retained results, not just counts or
accepted flags. Later FIFO durability, Stop/cancel, cold explicit resume,
competing clients, uncertain replies, actual providers and both retained hosts
keep R4.1's original service gate. The codec creates no worker, journal claim,
fallback or retry.

## Native bounded queue source ownership

## LN-CORE-030 — Durable bounded FIFO admission

<a id="ln-core-030"></a>

**Requirement.** Core MUST durably accept immutable queue captures with distinct
acceptance and native dispatch UUIDs, preserve authored message identities, and
serialize competing clients through the existing vault turn owner. Authored IDs
MUST remain distinct from portable entries and queue receipt identities. The first
profile MUST refuse unsupported rich captures before acknowledgement and bound
pending captures to sixteen items and 128 KiB.

Native source controls accept, observe, pause, cancel unstarted entries and
explicitly resume. They introduce no transport commands or host activation.
Exact acceptance retries return retained state; changed input under the same
identity is refused. Retained terminal records have separate finite bounds and
are never silently truncated. Current operator targets, default mode, physical
scope and writer guards are checked at admission and again before dispatch.
Compatibility decoding grants no launch authority.

## LN-CORE-031 — Queue cleanup and recovery barriers

<a id="ln-core-031"></a>

**Requirement.** The existing single native turn lane MUST advance FIFO only
after durable terminal publication and confirmed execution cleanup. Passive
client detach MUST preserve accepted live work. Stop, disable, close, failure,
unknown delivery and publication uncertainty MUST pause advancement. Cold
restore MUST pause all queues and never replay started entries; explicit resume
MUST acknowledge the exact current native head and admit only unstarted entries.

Explicit Stop requests cancellation rather than asserting that dispatched effects
were cancelled. The existing turn contract keeps an unconfirmed dispatched
result Unknown. Queue acceptance must preserve that exact outcome and receipt,
keep later captures paused, and require confirmed execution cleanup plus explicit
exact-head resume before advancing unstarted work.

One portable conversation writer preserves authored user objects, assistant
parent identities and validated queue receipts. Receipts remain data rather
than prompt instructions. Queue receipt publication never races an active turn's
captured transcript. R4/R4.1 retain their both-host/end-to-end gates;
source fixtures do not establish provider or host acceptance.

## LN-CORE-032 — Admitted native queue transport

<a id="ln-core-032"></a>

**Requirement.** Generated queue commands MUST expose bounded accept, read,
Stop, cancel-unstarted and explicit resume through the existing admitted client
boundary. HTTP MUST reuse protocol, principal, Origin and CSRF checks before
Core authority. Captures, receipts and independent request identities MUST
round-trip without creating renderer work ownership, automatic retries or
cold-start dispatch. Public records MUST exclude private operator snapshots.

The source-only shared API port uses these generated DTOs through the existing
native-turns package entry. The wire supplies opaque conversation, acceptance,
predecessor and target IDs plus captured data; executable, credential, vault-root
and resume-session authority remain unavailable. Core revalidates all data and
current scope/target/default admission. Request JSON is at most 1 MiB; complete
queue responses retain the existing 8 MiB record bound. Transport failure after
acceptance remains uncertain to the caller, which reads retained state rather
than automatically replaying. Cold resume and no-replay follow LN-CORE-031.

This checkpoint adds no host/UI selection or defaults. Both actual transports,
existing screen controls, rich participants/tools and complete R4 workflows
retain their original gates; R4/R4.1 are active with host adoption pending.

## LN-CORE-036 — Shared native queue observation and controls

<a id="ln-core-036"></a>

**Requirement.** Shared chat hosts MUST use the admitted native queue for
supported follow-ups, project retained state into the existing Agent screen and
route explicit Stop, cancel and resume to Core. Lost acceptance replies MUST
retain their original identity and recover by observation without replay.
Host-declared captures MUST preserve authored identities and selection; missing
selection MUST remain unavailable rather than inferred from target labels.

The optional host port supplies complete saved recipient metadata and capture
selection separately from opaque execution-target authority. R2-only hosts remain
operational with queueing unavailable. The shared pure constructor follows the
frozen Desktop plaintext constructor: trimmed prompt, separate capture and
`queued-user-` UUIDs, owner/user-message provenance and an immutable ACP selection.
Attachments, comments, multiple recipients and application commands remain
refused before queue acknowledgement in this first profile. Native admission
revalidates the full compatibility shape, bounds and current target.

Acceptance identity matches the exact submitted action; native dispatch identity
remains independently generated. Read-only observation maps pending/uncertain
entries and paused state into public queue controls. Cancel addresses the exact
unstarted acceptance; explicit resume names the current native conversation head.
Terminal receipts appear as status data in the existing transcript, preserving
their saved identities without reinterpreting them as user prompts. A detached
or closed view owns neither advancement nor retained work. The hosted
adapter uses its existing admitted client and protocol/Origin/CSRF path, fences
stale leases and never retries an uncertain mutation. Operator metadata, both
actual host integrations and complete provider acceptance remain separate gates.

The opt-in installed-provider journey uses isolated operator configuration and the
existing retained screen. It verifies actual-running capture/cancel, detached
FIFO completion, explicit Stop cleanup, paused cold recovery and exact-head
resume. Model and thinking remain unrequested; native null options retain the
NotRequested boundary. Hosted and Tauri receipts qualify separately before the
combined R4.1.6 gate closes. Stop uncertainty keeps its separate no-replay
branch. Successful cold resume uses a confirmed completed head; its admitted idle Stop
and explicitly offline retained-state fixture are declared separately from live
admission and retained UI actions. Deterministic peers cannot replace installed-provider evidence.

## LN-CORE-037 — Trusted queue capture metadata

<a id="ln-core-037"></a>

**Requirement.** Native targets MAY expose an optional complete plaintext queue
selection declared by trusted host configuration. Hosted startup MUST validate
its recipient token, identity, label and selection before admission. Missing
metadata MUST leave shared UI capture unavailable while preserving R2 operation. Capture MUST freeze the declared mode
and selection; neither the renderer nor dispatch MAY infer provider or recipient
metadata from opaque target IDs or display labels.

The admitted raw queue port still accepts complete explicit supported captures
without discovery metadata, preserving LN-CORE-030/032. Discovery data is not
execution authority and never replaces Core admission of that captured request.

The generated optional `queue_selection` contains the exact saved recipient and
its ACP selection, including omitted model/thinking fields. It grants no launch,
credential, executable or provider-session authority. The shared constructor
freezes an omitted execution mode to the trusted target's current `default_mode`;
explicit provider-default thinking remains captured while native runtime effort
stays omitted. Private native target snapshots retain metadata for the existing
admission/dispatch guard. Changes to operator metadata pause later dispatch
rather than recapturing choices or silently switching providers.
