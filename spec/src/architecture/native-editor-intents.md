# Architecture / Native editor intents

The shared App editing registry remains the owner of document persistence.
Native services add an editing-intent fence before a host exposes editable
content. An intent is independent of a dirty buffer: even a clean, editable
document conservatively blocks foreign native mutations until its owner yields
under protection or retires it. Ordinary saves continue through the existing
conditional writer; this contract adds no save engine.

## LN-CORE-019 — Admitted native editing intent

<a id="ln-core-019"></a>

**Requirement.** A host selecting native editing intents MUST acquire an
App-owned, file-bound intent before exposing editable access. Native writers
MUST fence active intents as well as dirty claims, including descendants and
physical aliases. Intent ownership MUST use the admitted client and retained
physical vault root. Client retirement MUST retain unresolved intents separately
from dirty state until explicit recovery or discard.

### Acceptance details

Admission retains these boundaries:

- A client-minted nonnil identity acquires one native intent atomically. Same
  client, identity and path repeat the existing admission; foreign ownership or
  another path cannot replace it.
- The existing caller exemption applies only to its own attached editor saves.
  Service-owned Tasks, restore and tool writers retain their stricter guard.
- Clean content remains clean in status. An active intent is an independent
  blocker, including after the sole client-detach boundary.
- A replaced root, file alias or ancestor-directory alias cannot bypass the
  existing checked-writer admission.

## LN-CORE-020 — Protected native intent handoff

<a id="ln-core-020"></a>

**Requirement.** The App registry MUST protect and flush matching real writers
before yielding their native intents. Yield MUST validate the captured saved
generation and authoritative existing-file version or expected absence.
Protected native mutations MUST finish before retained writers rearm; editable
access MUST remain blocked until rearming succeeds. Clean retirement MUST
release the native intent before removing local ownership. Failed saves or
handoff MUST retain protection and observable recovery state.

### Acceptance details

Protected handoff retains these boundaries:

- Initial document loads, API text editors, mutable state writers and editable
  Markdown surfaces use the same admitted lifecycle. A detached failed writer
  remains registered and cannot be silently retired.
- A guarded Tasks call executes inside the existing registry guard, rather than
  after a separate flush. Independent files remain independently admitted.
- A saved acknowledgement for an earlier document or dirty revision cannot
  clear a later one. Expected absence is a first-class snapshot, never an empty
  file or an unconditional-write fallback.
- Rearming precedes every local protection release, including exceptional
  operation completion. A failed rearm blocks the next guarded admission.

## LN-CORE-021 — Bounded intent reconciliation

<a id="ln-core-021"></a>

**Requirement.** Native intent transitions MUST use monotonic generations and
bounded identity retention. Exact idempotent transitions and read-only status
MAY reconcile lost replies; stale transitions MUST NOT clear newer state.
Uncertain outcomes MUST remain observable and fail closed until reconciled or
explicitly recovered. Reconciliation MUST NOT replay content mutations, discard
buffers or silently create another persistence owner.

### Acceptance details

Reconciliation retains these boundaries:

- Acquire, resume, yield and clean retirement can be inspected by the same
  admitted client. Retired identities cannot be reacquired by delayed messages.
- Dirty and active-intent state remain distinct in recovery records. A new
  client explicitly recovers a detached claim before changing its state.
- Browser transport failure cannot enable editing. Neither a missing reply nor
  cancellation proves native retirement or successful persistence.
- Identity ledgers stay bounded per attachment and reset only when that client
  retires. Exhaustion rejects new intent admission without weakening live
  fences.

Host adoption and real two-client browser/native acceptance are separate from
source qualification. Existing Deno hosts remain frozen. Signing and final
distribution remain deferred.

## LN-CORE-025 — Captured-state explicit intent recovery

<a id="ln-core-025"></a>

**Requirement.** Explicit recovery and discard MUST match the retained intent's
captured generation and revision. Recovery MUST require detached ownership,
advance its generation and preserve dirty/active state. Discard MUST require
detached or caller-owned state and retire its identity; stale actions, foreign
live owners and retired clients MUST remain fenced. Both operations MUST NOT
write files, acknowledge unknown drafts or replay mutations.

Read-only inspection MAY reconcile lost acknowledgements. Exact terminal
discard repeats remain harmless because retired identities cannot be acquired
again. Recovery consumes the existing per-client identity budget. Both actions
retain physical-root validation and run under the vault's existing state lock.
Application-owned Problems actions remain a separate presentation gate.

### Acceptance details

Legacy compatibility retains these boundaries:

- ID-only legacy recovery/discard MUST reject managed intents. Existing
  unmanaged editor claims MUST retain their current behavior.
- Recovery and cross-owner discard MUST retain the existing per-client identity
  budget without removing another live client's protection.
- Explicit discard MUST preserve saved file bytes and leave detached draft
  content outside native recovery authority.
