# Indexed encrypted native Sync receipts

This slice removes completed-operation growth from the native apply journal.
It continues the Deno-first Sync plan; production host bridges, key custody,
Deno network services and server participation remain separate work.

## Storage and recovery

- The API adds the optional `SyncIndexedRepository` extension. Existing
  `SyncRepository` consumers retain their existing contract. Records contain
  only an epoch and opaque ciphertext, addressed by a lowercase SHA-256 key.
- Native SQLite stores records under a composite namespace/key primary key.
  Insertion is immutable and concurrent contenders cannot replace a winner.
  A bounded busy timeout handles short cross-connection write contention.
- Every completed native mutation gets its own `local-state`/tag-8 envelope,
  authenticated to its operation key, epoch, vault, device and physical root.
  Filenames, operations, results and staging descriptors remain encrypted.
- The completed phase remains in the active journal until the indexed receipt
  is durably inserted, read back and authenticated. Only then does a guarded
  journal commit remove that entry. A pre-existing conflicting receipt stops
  compaction rather than replacing either history.
- An uncertain indexed write or journal commit poisons the instance until
  reopen. Both committed and uncommitted response-loss cases recover without
  repeating working-file mutation, even if the user edits afterward.
- Opening migrates completed entries from the earlier journal format. Pending
  operations retain their existing recovery phases. Receipt lookup and repeated
  mutation IDs continue to work after compaction and process restart.
- After reliable compaction, cleanup removes only unchanged download staging
  matching the completed descriptor and current host authority. Every working
  preimage remains retained until the deferred retention policy is supplied.
  Receipt lookup can retry staging cleanup after an interrupted close.

The active root still contains the current file-identity index. This change
bounds growth from completed operations; it does not establish unlimited vault
metadata size or historical receipt garbage collection. Advanced retention
remains deferred, and the headless engine's sealed history map has a related
metadata-size concern to resolve during production integration.
The subsequent [journal migration milestone](2026-10-14-sync-journal-migration.md)
versions indexed roots and rejects the earlier kernel after migration. Neither
slice authorizes older-writer coexistence or production activation.

## Regression evidence

The exact new targets were run before implementation:

```sh
pnpm exec vitest run src/sync-repository.test.ts -t 'indexed ciphertext'
pnpm exec vitest run src/sync-vault.test.ts -t 'bounded active journal'
```

Each reproduced one failure: the missing record port and accumulated completed
entries exceeding an 8 KiB fixture journal budget. Both now pass. The bounded
case performs 24 real mutations, reopens every receipt and checks that normal
completed download staging is removed while all 23 working preimages remain.

The actual two-connection insertion target then reproduced one database lock;
it passes with the unchanged winner/immutability assertion after bounded lock
waiting. The readback target reproduced one false acknowledgement from a faulty
record adapter; it now retains completed journal work until a readable durable
receipt exists. Its reopen preserves the subsequent user edit.
The explicit preimage-retention target also reproduced one failure before
cleanup was limited to download staging; it now passes. This keeps metadata
compaction separate from the plan's deferred working-preimage retention policy.

The complete repository/vault/lease family has 38 passing tests. Additional
cases cover missing/committed receipt writes, a lost compaction response,
namespace isolation, immutable records, receipt substitution and membership
change during receipt lookup.

Final qualification passes:

- All 67 native service tests and its Deno check pass; all 829 API tests,
  package checks, public build and publint pass.
- Root check/test/build pass with 18/18/10 successful Turbo tasks. Changed native
  tasks run directly; unchanged package results reuse tracked caches.
- Host specification, ownership and metadata-query gates pass. Plugin ledger
  formatting, specification, ownership and package metadata gates pass.
- Packed-engine/native-file acceptance passes in Node and a separate real Deno
  process after the final functional change: independently paired devices,
  bidirectional ancestry, 20 MiB attachment, interrupted apply, reopen,
  lock/unlock and known-plaintext absence from the ciphertext databases.
- The host audit still reports 8 low, 39 moderate, 31 high and 3 critical
  existing dependency advisories. The plugin audit retains its three recorded
  findings with unchanged exceptions. This is not release qualification for
  those dependencies or the previously failing wider plugin catalog.

No package versions, dependency ranges, committed lockfiles, registry activation,
visual baselines, publication or deployment change in this slice.
