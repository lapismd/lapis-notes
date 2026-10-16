# App Database / Database integration

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

## LN-DB-050 — External file identity bindings: namespaced by the authenticated plugin context. One

<a id="ln-db-050"></a>

**Requirement.** External file identity bindings MUST be namespaced by the authenticated plugin context. One plugin MUST NOT read, write, replace, or delete another plugin's bindings, and conflicting external IDs MUST fail closed.
