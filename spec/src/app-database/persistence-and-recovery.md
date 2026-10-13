# App Database / Persistence and recovery

## LN-DB-028 — Change publication after commit

<a id="ln-db-028"></a>

**Requirement.** AppDatabase mutations MUST publish a typed change set only after commit. Change sets MUST carry a durable revision and bounded invalidation detail; a revision gap MUST invalidate the complete affected domain.

## LN-DB-046 — AppDatabase: persist a collision-resistant random file ID independently

<a id="ln-db-046"></a>

**Requirement.** AppDatabase MUST persist a collision-resistant random file ID independently from path, retain aliases and tombstones, preserve identity for host-observed renames, and assign a new identity when a deleted path is recreated. Content equality MUST NOT merge ambiguous files.

## LN-DB-047 — File identity reconciliation: preserve a unique recent tombstone by strong

<a id="ln-db-047"></a>

**Requirement.** File identity reconciliation MAY preserve a unique recent tombstone by strong content fingerprint, but size and mtime alone MUST NOT establish identity. A database rebuild MUST receive a new database-generation ID while vault content remains authoritative.

## LN-DB-048 — AppDatabase: expose a generation-scoped, monotonically increasing change cursor

<a id="ln-db-048"></a>

**Requirement.** AppDatabase MUST expose a generation-scoped, monotonically increasing change cursor and bounded pages of coalesced current or tombstoned file states. A cursor from another database generation MUST return a typed reset result rather than silently resume.

## LN-DB-049 — File identity changes: carry content generation, last-change sequence, current

<a id="ln-db-049"></a>

**Requirement.** File identity changes MUST carry content generation, last-change sequence, current and previous paths where applicable, and an optional opaque mutation origin. Realtime events remain hints; durable cursor queries MUST recover changes missed while a plugin was stopped.

## LN-DB-051 — API: expose plugin-generated state through a namespaced transactional

<a id="ln-db-051"></a>

**Requirement.** API MUST expose plugin-generated state through a namespaced transactional store with schema versions, compare-and-swap revisions, batched mutation, bounded prefix scans, migrations, and cleanup. It MUST NOT expose raw AppDatabase access.

## LN-DB-052 — Generated-state transactions: atomically commit outbox state and reconciliation cursors

<a id="ln-db-052"></a>

**Requirement.** Generated-state transactions MUST atomically commit outbox state and reconciliation cursors, publish changes only after commit, and remain disposable without losing vault content. An interrupted or rejected transaction MUST expose none of its writes.
