# Architecture / Durable native turn admission

R2 retains LN-CORE-003/006/007 and the existing conversation files. It first
qualifies private accepted-dispatch authority, then the native ACP owner and
existing chat adapters. This source boundary alone does not complete R2 or
authorize a provider, native tool, executable or host path.

The journal lives in host-selected private storage outside the admitted vault.
The private root and vault root must not contain one another.
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
