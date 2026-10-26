# Architecture / Remaining native History parity

This R3.2.3.6 work reuses the existing native backup and History engines and
retained Repository screens. Reader qualification does not imply restore,
selection controls or original-source acceptance.

## Scope audit and order

Current Desktop's native application profile bundles Source Editor, Markdown,
File Explorer and Search, then explicitly selects the native Repository plugin.
It does not bundle the optional database-only `HistoryPlugin`. That plugin is
still installable in both hosts: it observes client file events, debounces
revision capture and uses the existing AppDatabase revision CRUD. Native
AppDatabase storage qualifies persistence, not unattended plugin execution.
Older wording that describes History as bundled does not expand the current
four-plugin profile.

| Child      | Work                                                                         | Gate     |
| ---------- | ---------------------------------------------------------------------------- | -------- |
| R3.2.3.6.1 | Guarded file/vault restore through native backup and retained dialog         | Complete |
| R3.2.3.6.2 | Backup capture selection, passive status and explicit pause/restart controls | Waiting  |
| R3.2.3.6.3 | Original repository detection and immutable source selection                 | Waiting  |
| R3.2.3.6.4 | Native ownership of optional legacy AppDatabase History capture              | Deferred |

The deferred legacy scheduler is additional functionality rather than a blocker
for parity with current Desktop. It requires a separately governed capture and
retention policy; this migration does not add a competing scheduler. Original
repository reads remain mandatory parity work and cannot initialize or mutate
that repository. Both-host combined R3 acceptance remains separate.

## LN-CORE-023 — Guarded native Repository restore

<a id="ln-core-023"></a>

**Requirement.** Native file and vault restore MUST borrow the selected vault's existing backup engine through admitted service work. Preview and apply MUST retain checkpoint, expected saved bytes and stable request identity, native safety checkpoints and exact-retry receipts. Writes MUST share physical-root, file-order and unresolved-editor guards. Abandoned replies MUST NOT abandon accepted writes or cause automatic replay.

The existing `jj-vault` engine owns restore algorithms, conditional publication,
receipts and recovery. Native adapters cannot supply a filesystem root, alternate
engine, generation or caller scope. Explicit keep-current captures behind older
accepted operations before clearing uncertain recovery. Vault drain retains
accepted work; passive reader/client disposal cannot close the backup owner.

Qualification covers exact retry after uncertain acknowledgement, stale saved
bytes, unresolved detached editor claims, different vaults, malformed authority,
file/vault preview and apply, and cancellation of an accepted reply. Shared
source, authenticated transport, retained review UI and both-host intake remain
separate evidence.
