# Architecture / Durable native turn admission

R2 retains LN-CORE-003/006/007 and the existing conversation files. It first
qualifies private accepted-dispatch authority, then the native ACP owner and
existing chat adapters. This source boundary alone does not complete R2 or
authorize a provider, native tool, executable or host path.

The journal lives in host-selected private storage outside the admitted vault.
The private root and vault root must not contain one another.
Journal and conversation publication sync capability-relative directories through
readable handles on Linux; reopening a handle never widens the admitted scope.
One physical writer lock owns each opaque vault's journal. Opening another
writer fails while that owner is live. Reads and writes verify the retained
directory and lock identities; paths, linked entries and malformed or unsupported
records cannot select another directory or be silently replaced.

Acceptance durably publishes an immutable request identity, target ID, authored
prompt and separate context before returning a fresh dispatch claim. An exact
duplicate returns its saved snapshot without a claim. Reusing the request ID
with different content refuses. Native callers must separately hold live vault
work and target authority; the claim is persistence evidence, not launch policy.

Only the fresh native claim can change Accepted to Running. That transition
must be durably published before calling ACP. The claim is not serializable or
cloneable and is bound to its current writer generation. The running writer
retains exact expected bytes; a changed record cannot be overwritten by a stale
progress or completion write. Terminal outcomes are immutable.

Reopening preserves completed, failed and confirmed-cancelled outcomes. Accepted
records become Interrupted; Running records become Unknown. Recovery writes
state only and produces no dispatch claim, provider call, prompt replay or
automatic retry. Partial response text remains retained. Restoring bytes never
authorizes execution.

Each request has at most 1 MiB authored text and 1 MiB separate context. Partial
or complete response text is bounded at 4 MiB, each journal record at 8 MiB,
and each vault at 4,096 retained records. Reaching a bound reports unavailable
capacity without truncating a request, deleting history or claiming completion.
Catalogue queries retain metadata summaries rather than every prompt/response body.
Installation/retention policy remains a later native-jobs gate.

Private dispatch records are authoritative work state, not derived AppDatabase
indexes. They do not replace `metadata.yaml`, `agents.jsonl` or
`transcript.jsonl`, and do not revive the deferred AgentStore/ThreadStore profile.
The native worker must publish those existing formats through the shared writer
before its turn is complete. Observer detach never cancels accepted work;
explicit vault close/Quit must fence admission and drain or cancel it.

Source acceptance covers exact-ID deduplication, changed-request rejection,
single-use/generation-bound claims, conditional progress, immutable completion,
exclusive ownership, retained unknown states, interrupted publication and real
process loss. Real ACP, both transports, existing chat, provider and native
application acceptance retain the original R2 completion gate.

## Vault-owned execution

Native admission retains the resolved launch before durable acceptance; view
configuration changes cannot replace an accepted launch. Binding/capture and
worker startup still require the fresh durable claim.
The selected native turn service uses `lapis-ai-service`'s execution port and
host backend. Native policy resolves opaque targets against an admitted scope
capability; browser data cannot select executables, environment, credentials or
host directories. Requested model, effort, mode and duration are frozen with
the authored input. A duplicate cannot replace those settings or launch again.

A native task retains the vault's Work lease through portable publication and
confirmed process cleanup. Dropping the submitting future, client or progress
observer does not own that task. Explicit vault close/Quit requests cancellation
and drains it. Uncertain cleanup or persistence retains the lease and reports a
close failure rather than declaring the vault drained.
Successful close retires the journal writer even while stale clients survive.

Native configuration must complete before the prompt is submitted. The runtime
continues to enforce negotiated modes, exact request identities and approval
options. The application acknowledges output only after its bounded progress
and portable transcript have been persisted. A quiescent terminal record and
confirmed cleanup are required before reporting completion.

The service creates the retained schema-three conversation files under the
selected scope and publishes through the shared conditional vault writer.
Authored user text and assistant text retain separate provenance; additional
context is not fabricated as authored dialogue. External changes or dirty
editors prevent replacement. The journal becomes terminal only after the
portable files have been published; recovery never starts another worker.

## Typed host commands

## LN-CORE-009 — Native target default mode authority

<a id="ln-core-009"></a>

**Requirement.** Native target metadata MUST declare a nonempty, bounded `default_mode` from trusted host installation configuration. Hosted startup MUST reject missing, whitespace-only, control-bearing or overlong values before exposing a target. Desktop MUST reuse an explicitly configured execution mode or its trusted runner default.

## LN-CORE-010 — Exact selected target mode submission

<a id="ln-core-010"></a>

**Requirement.** Native chat MUST submit the freshly declared default mode for the exact selected opaque target. It MUST refuse before submission when that target or valid mode metadata is unavailable, and MUST NOT infer modes from browser IDs or display names.

Low-level explicit mode requests retain LN-CORE-003's immutable input and native
negotiation boundaries. Metadata defaults do not rewrite an explicit request,
accepted input or idempotent read, bypass native negotiation, suppress
unsupported-mode errors, or widen provider permissions. Codex's trusted default is `read-only`; OpenCode's is `plan`.

`lapis-app-protocol::turns` owns strict portable input, options, phase, record,
summary, target and command/value DTOs. Core retains input normalization,
retained-record validation, private journal authority and executable policy.
Rust-generated schemas and TypeScript declarations must reject drift.

An admitted client may list native target labels, submit one fresh turn, read
retained state, list metadata summaries or request cancellation of an exact
retained request. Summary lists exclude authored/context/output bodies. No
command accepts launch paths, arguments, credentials, environment or resume
authority. Native hosts retain their opaque vault/client admission and version,
Origin and CSRF rules. Queries and replies never own the worker lifetime.

The hosted `/api/v3/clients/{client}/turns` route uses the same admitted owner
as file/database commands. Its separate 16 MiB JSON decoder bound permits
escaping without increasing the ordinary 2 MiB command limit; Core's existing
prompt, context, output and journal bounds still apply before publication.

Hosted agent installation is explicit operator configuration loaded through
`LAPIS_SERVER_AGENTS_CONFIG` with `LAPIS_SERVER_DATA_ROOT`. It maps opaque IDs
to physical executable helpers and sealed native environment. Configuration
never comes from HTTP. Helpers must stay outside admitted and managed vault
content. An unselected service reports Unsupported without fallback.

Cancellation requests are observed by the retained native task even when the
reply disconnects. Cancellation before prompt dispatch can be confirmed;
uncertain dispatched effects remain Unknown unless the runtime proves a
terminal outcome and process cleanup. A cancelled/unknown request is never
replayed. Explicit close/Quit retains the same fence-and-drain contract.

## Explicit conversation continuation

A continuation carries its opaque conversation ID and the exact last accepted
request ID. Native admission verifies both against its own journal, vault and
normalized scope; portable files alone never authorize dispatch. An exact
duplicate still returns its retained record. A changed request, stale head,
branch or unfinished predecessor refuses before another acceptance is written.
Accepted continuation timestamps remain strictly ordered even if the wall clock
moves backwards. A fresh explicit request is required after restart; recovery
does not create a follow-up, resend an earlier prompt or resume from browser
authority.

The service retains one conversation directory and the existing metadata,
binding and transcript formats across sequential turns. Prior transcript bytes
remain preserved; each accepted prompt adds its own authored user message and
separate assistant response. Native publication checks retained file revisions
and dirty-editor guards. Conversation history reaches a fresh worker as bounded
read-only evidence with its original roles, separately from the current authored
prompt and additional context. It does not become a new user instruction.
Unsupported history or capacity reports an explicit refusal without truncating
retained files. Queueing, participant switching, richer context/skills and
handoff summaries retain R4's separate gates.

## Native feature activation

An admitted host may explicitly enable or disable the selected turn service.
Disable fences fresh submissions under the same native lock as acceptance,
requests cancellation of every accepted worker and acknowledges only after
confirmed cleanup and journal publication. A previously retained client cannot
bypass that fence. Retained queries and exact duplicate reads remain available.
Cleanup failure keeps admission fenced and reports uncertainty rather than a
successful disable. Re-enable waits for any in-progress disable to settle and
never starts, resumes or replays an earlier request.

The native operation retains its work independently of its reply or invoking
view. Reload/detach does not disable the service. Availability is process-owned;
constructing a new runtime recovers records without executing them. Native
hosts retain their existing user/trust admission and operator launch selection.

## Existing chat observes native work

R2.2.3 composes the public Agent Chat and History screens through one private
Notes application-profile adapter. Its per-view port reads native summaries,
exact request outcomes and retained portable conversation files. Polling and
subscriptions only observe; closing a view stops observation without cancelling
accepted work. The selected profile never constructs the former renderer
transcript writer, queue owner, memory scheduler or maintenance loop.

Authored sends retain their exact UUID through acceptance and outcome checks.
A lost reply stays unknown until that same request is queried; the observer
never resubmits it. Explicit follow-ups carry the native conversation and exact
predecessor. Unsupported attachments, comments or multiple participants refuse
before submission rather than dropping content. Those capabilities retain R4.

Hosts supply the admitted command transport and read-only vault access. Native
feature disable fences/drains before host authority is released. Hosted session
detach/logout and Desktop reload detach clients while accepted work continues;
explicit Desktop close/Quit drains before dependent native services stop.
The standalone browser and separately selected serving baseline retain their
existing implementations. Staging selects one writer and never falls back.

History uses the retained public screen in an ungrouped right sidebar by
default. Its command reveals an existing instance wherever it was moved.
Selecting a saved conversation opens or reuses its exact scope/conversation
in a main chat tab while History remains mounted. Creating a chat from History
opens a new local draft in the selected scope; only explicit Send admits work.
Other drafts and conversations retain their state. Persisted chat leaves retain
both scope and saved conversation identity. A fresh History observer reads
portable metadata titles/status without loading every transcript or adding a
writer. Metadata publication may lag a newly accepted journal; that transient
state is observed without fabricating a saved title or replaying work.

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
thinking remains saved while its runtime effort field stays omitted.

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
