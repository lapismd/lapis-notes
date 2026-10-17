# Reviewed merged-text recovery

The desktop review requests an editable merge centre whose exact result is saved.
FileTextConflict now exposes `resolveMerged(contents)` through the owning generic
FileTextPersistence contract. Original whole-version methods remain compatible.
The new method rejects non-text values and requires the current conflict object,
readable disk snapshot, asynchronous owner protection and the same conditional
replacement. A stale write captures the new disk version and rejects.

After a successful replacement the original owner resets to merged text before
its conflict is cleared. A reset failure retains the conflict and rolls back its
internal baseline; disk may already contain the explicit result, requiring a
fresh snapshot before another decision. State owners retain their existing
outside-queue restoration and revalidation path. No native command, unconditional
write, global App or Deno-host change is added.

The public API build, publint and packed declaration compilation pass. Test
suites and native builds remain deferred under the user's shell/story review
instruction. Pending acceptance must cover manual/empty merged text, stale and
unreadable snapshots, failed writes/resets, retired editors, state-owner
restoration and independent leases. This record does not claim those gates.
Desktop E-CATALOG-004 records the prepared archive source/checksum and manual
catalog review. No package is published or visual baseline approved.
