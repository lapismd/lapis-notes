# Architecture / Durable native turn admission

R2 retains LN-CORE-003/006/007 and the existing conversation files. It first
qualifies private accepted-dispatch authority, then the native ACP owner and
existing chat adapters. This source boundary alone does not complete R2 or
authorize a provider, native tool, executable or host path.

The journal lives in host-selected private storage outside the admitted vault.
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
