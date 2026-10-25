# Architecture / Backup service lifetime

This is the R1.3.10 application of
[LN-CORE-003](rust-application-services.md#ln-core-003),
[LN-CORE-004](rust-application-services.md#ln-core-004) and
[LN-CORE-006](rust-application-services.md#ln-core-006). It reuses `jj-vault`;
capture, formats, exclusions, restore and repository algorithms remain there.

Native installation policy selects external history/control storage. Opaque
vault identity and the admitted physical root determine the existing `Storage`
binding. Neither a renderer nor an HTTP request supplies those paths. The
existing layout/recovery contract is retained, including explicitly selected
root storage. File-only profiles report unavailable backup rather than silently
creating another history owner.

The Rust hosted application profile selects `vault-history` alongside its
database/model directories, with private directory permissions. Its existing
authenticated attach waits for initial native reconciliation; a failed start
retires that attachment without replacing the native service. File-only host
fixtures retain their explicitly unselected backup profile. Detach and logout
remain client operations and do not close the vault's backup worker.

One vault service owns one coordinator and its native watch. The first selected
start reconciles before reporting readiness. Concurrent or cancelled attachment
requests cannot create duplicate workers or abandon accepted initialization.
Watch notifications use the existing backup path classifier. The engine retains
its quiet period, maximum delay and periodic reconciliation; observers do not
own scheduling. Client detach, expiry, logout and receiver disposal do not stop
capture. Immutable history access still cannot initialize a writer.

Native host commands borrow the existing engine through an admitted client;
they cannot take ownership or close it by dropping a view. Accepted commands
continue independently of cancelled or unpolled reply receivers. Explicit backup
disable drains that coordinator and permits a later explicit restart against the
same retained history. Repeated or concurrent disable is idempotent; a failed
drain retains the same engine for repair and retry. Saved-file restore/undo also
respect unresolved editors.
Native hosts may supply their existing external file gate; the coordinator takes
that gate before its own vault gate, matching host file-publication order.

Capture and file publication share the admitted vault's file gate and physical
root checks. Explicit close fences new file work and drains accepted writers
before the final capture. A failed final capture retains the original worker,
failure status and retry authority. It does not silently close the database or
replace the coordinator. A retry reconciles repaired saved files before success.
Dirty-editor refusal happens before any owner is fenced. Controlled Quit applies
the same barrier before database drain; an interrupted Quit remains explicit and
retryable. No accepted or uncertain effect is replayed from an observer.

The shared source proof includes real saved bytes after client detach, native
watch capture without subscribers, final capture and cold retained history,
failed-close repair/retry and storage/root admission. Tauri intake, hosted
intake and their original application acceptance remain separate evidence.
