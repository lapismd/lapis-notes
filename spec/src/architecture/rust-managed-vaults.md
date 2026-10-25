# Architecture / Rust managed vaults

R1.3.9 connects the existing hosted chooser to Rust under LN-CORE-004 and
LN-CORE-007. This retains the agreed single installation owner and multiple
vaults; all admitted vaults belong to that owner. Multi-user membership remains
outside this migration.

The private control Turso database owns vault names, identities and archive
state. Configured vaults retain their operator-selected roots and identities;
renaming changes the catalogue name only. Created vaults use host-generated UUIDs
under the installation profile's `vaults/<id>/content`. Requests supply a bounded
display name, never a native path, storage root or executable. Names may contain
Unicode and are not interpreted as directory names. Private service databases,
models and history remain outside vault content.

Profile-backed startup may begin with no configured vault. Operator-only
file-service staging retains its existing configured-vault requirement. Startup
restores the catalogue before serving requests and reports missing or changed
physical storage instead of selecting another directory. Configured entries are
seeded once; restart does not overwrite renamed or archived metadata.

Create, Rename, Archive and Restore use the same authenticated, versioned,
Origin/CSRF-protected boundary as existing commands. Unknown fields and invalid
names fail. The host serializes catalogue mutations. Accepted management work
outlives a disconnected response waiter and drains before server shutdown.
An uncertain create response is not automatically retried; refreshing the
catalogue discovers completed work.

Archive preserves bytes and refuses unresolved editor claims. It fences new
attachments, drains the shared native database/backup/file owner, then publishes
archive state. A failed preflight keeps the original owner usable. An uncertain
catalogue publication remains unavailable until retry or restart reconciles it.
Restore re-admits the same retained physical root and history identity before
publishing the active state. Archived entries cannot attach or write through old
clients. Repeated Archive/Restore requests retain the same identity and state.

Acceptance covers creation through real HTTP and the retained chooser, name-only
rename, archive refusal with dirty editors, stale-client fencing, byte-preserving
restore and cold catalogue recovery. Transfer/import/export and installed-plugin
delivery retain their existing R1.3.9/R6 gates. The Node serving baseline remains
until R7; this intake does not claim the final cutover.
