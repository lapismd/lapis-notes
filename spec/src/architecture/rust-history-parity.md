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
| R3.2.3.6.2 | Backup capture selection, passive status and explicit pause/restart controls | Complete |
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

## LN-CORE-022 — Native backup selection and passive status

<a id="ln-core-022"></a>

**Requirement.** Native backup MUST read the saved `.lapis/app.json` automatic-history selection before initial capture. Explicit conditional selection MUST preserve unrelated configuration through the existing guarded writer and own accepted transitions independently of reply waiters. Status and observer disposal MUST NOT initialize, capture or stop backup. A lost setting acknowledgement MUST be reconciled through saved status without replaying the mutation.

The sole setting is `pluginData["repository-history"].automaticBackup`, with
existing true-default semantics. Native status returns the saved value, an opaque
configuration version and the existing backup phase/checkpoint/error. Selection
accepts that version, not roots, configuration contents or caller scope. Cold
false selection cannot initialize repository metadata. Invalid saved JSON and
stale/dirty configuration refuse publication.

Native selection and existing start/stop share the per-vault backup slot gate.
Manual capture reuses the selected engine. Host detach, view disposal and polling
cancellation only stop observation. Explicit disable drains the existing worker;
failed transitions retain honest saved selection and engine status for repair.
Only the caller's explicit setting action may retry a setting write.

Start, stop and controls reserve accepted turns synchronously before native
worker scheduling. The existing backup slot retains one ordered queue, so a
later Status cannot overtake a previously accepted selection whose worker has
not yet reached the mutex. Failed or abandoned reservations release their turn;
waiting turns use async notification instead of occupying the blocking pool.
The queue adds no repository, writer or persistent state.
