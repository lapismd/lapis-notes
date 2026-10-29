# App Database / Database integration

Remote AppDatabase schemas use the patched Zod package through its public
`zod/v3` entry, retaining the existing method DTOs and validation semantics.
Plugin icon artwork and resolver caches remain App presentation resources;
LN-PLUG-123 introduces no database column, durable writer or schema migration.

H02's private history companion is independent of AppDatabase. History source identity, operation pins and repository objects are
not SQL projections. Existing database providers, remote method contracts,
transaction policy and disposable-index lifetimes remain unchanged.

Editor conflict baselines remain document-owned under LN-ARCH-142, separate from
metadata reads and the vault cache. Conditional Vault projections under
LN-PKG-169 update only after successful native persistence; database ownership
and transaction authority do not expand.

The conditional text-write port under
[LN-PKG-167](../packages/vault-and-storage.md#ln-pkg-167) is a vault capability.
Its native advertisement does not grant SQL or database connection authority;
database providers and their owned lifetimes remain independent.

Metadata checks, mutations and transaction results have one shared definition
in the headless `@lapis-notes/api/metadata-store` contract (LN-ARCH-116).
AppDatabase retains its existing type exports and inherits that contract;
credential repositories can implement it independently of indexes (LN-ARCH-114).

The in-memory vault adapter implements conditional text snapshots without database
IO. This protects demo/plugin configuration just as admitted native adapters do;
conflicts leave the existing memory bytes and modification count unchanged.

## LN-DB-050 — External file identity bindings: namespaced by the authenticated plugin context. One

<a id="ln-db-050"></a>

**Requirement.** External file identity bindings MUST be namespaced by the authenticated plugin context. One plugin MUST NOT read, write, replace, or delete another plugin's bindings, and conflicting external IDs MUST fail closed.

The optional App/session native History index port is separate from
AppDatabase file-history persistence. It changes neither the 68-method database
allowlist nor file-revision capture, retention or restore semantics. Its
immutable queries reuse host admission without adding a database writer.
