# Native Sync journal migration and downgrade fence

The indexed receipt milestone moved completed operations outside the active
journal. Its earlier format remained readable by a kernel that did not consult
that index. This slice versions the active journal before allowing capture or
apply access; it does not activate the production plugin or Deno destination.

## Delivered boundary

- New native roots use authenticated domain `lapis-native-apply-v2` with
  `schemaVersion: 2`. Receipt envelopes retain their independent v1 domain and
  the existing `local-state`/tag-8 encryption. Nostr events, content envelopes,
  signatures and destination filters do not change.
- A supported domain-v1/schema-1 root is authenticated and durably upgraded
  under the captured endpoint authority before the kernel is returned. Completed
  legacy entries are compacted only after that upgrade; pending phases retain
  their original operations and disk evidence.
- Upgrading preserves the counter, file identities, generations and path index.
  It does not mutate working bytes. A completed operation still returns its
  original receipt even when the working file has since been edited or deleted.
- Unknown domains, schemas and mismatched domain/schema pairs fail without
  rewriting sealed state. Current writers cannot emit the earlier schema.
- Upgrade writes retain existing CAS uncertainty semantics. Reopen recovers
  both an uncommitted failure and a successful commit whose response was lost.
  Membership changes while sealing reject the stale upgrade before persistence.

## Exact regression evidence

```sh
pnpm exec vitest run src/sync-vault.test.ts -t 'upgrades legacy'
```

All four legacy phase cases initially failed because opening preserved format 1.
They now pass for prepared, claimed, installed and completed intent. The complete
migration family has ten passing cases, including incompatible formats,
before/after-commit response loss and the membership race.

```sh
pnpm --dir packages/deno-host-services test:sync-journal-upgrade /absolute/path/to/earlier/sync-vault.ts
```

The cold script imports the actual earlier kernel. A positive control first
creates and opens that kernel's own format using actual host crypto and native
storage. The current kernel then upgrades it, creates a file and removes it.
The older kernel must reject reopening that compacted state. The sealed state
must remain unchanged after rejection, and replaying the original create through
the current kernel must return its receipt without recreating the deleted file.

The initial functional run failed once because the older kernel accepted the
compacted root. The same target now passes in Node and a separate real Deno
process. This is current-format fencing, not permission to downgrade encrypted
state or to run two native writers at once.

The ignored earlier fixture consists of five unchanged native source modules
from change `olruptou` (`845a79c6` at capture), under the owning package's
`.release/legacy-v1-olruptou` directory. An initial fixture placement at repository
root could not resolve its private native dependency; placement beneath the
owning package supplies normal installed-package resolution. No dependency
implementation, manifest range, lockfile or runtime resolver was changed.

## Final qualification

- All 77 native service tests and its Deno check pass. The ten migration cases
  are part of the 48-case repository/vault/lease family.
- Root check/test/build pass with 18/18/10 successful Turbo tasks. Unchanged API
  and package tasks reuse tracked caches; the API's 829 tests remain passing.
- The full host Storybook interaction/accessibility lane passes all 243 stories
  across 54 files: shard counts 84/65/40/54, with zero failures. This is separate
  from the plugin repository's previously recorded wider-catalog release gaps.
- Packed-engine/native-file acceptance passes in Node and a separate real Deno
  process with independent paired identities, bidirectional history, a 20 MiB
  attachment, interrupted apply, reopen, key lock/unlock and plaintext absence
  from the ciphertext databases. Its fault hook recognizes both journal formats
  and retains the interrupted-apply assertion.
- The earlier-kernel script passes in Node and Deno, including a second reopen
  of the earlier kernel's own persisted format before the upgrade. Host and
  plugin specification, ownership, formatting and metadata gates pass.
- The fresh host audit retains 8 low, 39 moderate, 31 high and 3 critical
  advisories. The plugin audit retains its three recorded findings with unchanged
  exceptions. No dependency ranges, committed lockfiles or advisory exceptions
  changed; this does not qualify those dependencies for release.

Production host/key lifecycle, host-delivered pairing, bounded metadata/history
qualification and Deno event/object/server work remain open in the saved plan.
No visual baselines, package publication, registry activation, signing or
deployment changed.
