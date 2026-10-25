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

Folder and ZIP intake reuse the existing chooser controls and their browser
ZIP encoding. The authenticated import route accepts a display name and at most
512 MiB compressed, 2 GiB expanded and 100,000 entries. Native extraction first
validates all entry paths and declared limits, normalizes Windows separators,
and rejects absolute/traversal paths, links, special entries and collisions.
Content streams into a new, empty, unpublished UUID directory; ordinary writes
retain their separate file limit. Empty directories need not be retained.

Interrupted uploads never publish. Completed uploads enter accepted management
work, which survives response cancellation and drains before shutdown. Known
extraction failures clean only that new unpublished directory. After uncertain
catalogue publication, preserve bytes and report an unavailable outcome without
automatic replay. Durable operation recovery remains R6.

Export snapshots regular content under the shared native writer, applies the
same limits and rejects links/special files. The completed private ZIP snapshot
releases native work before streaming to a slow download client. Include `.lapis`
content, excluding service/profile data already outside content. Downloads use
attachment, length, no-store and nosniff headers. Only the exact readonly cookie
export route may omit the protocol header; supplied stale versions still fail.

Acceptance covers creation through real HTTP and the retained chooser, name-only
rename, archive refusal with dirty editors, stale-client fencing, byte-preserving
restore and cold catalogue recovery. Transfer checks cover browser-produced
archives, binary/Unicode/state bytes, rejected archives without publication,
export roundtrip, authenticated downloads and cold import recovery. Installed
plugin delivery retains R1.3.9.3/R6. The Node serving baseline remains until R7;
this intake does not claim the final cutover.

R1.3.11 retains the ordinary Explorer and file-manager actions through both
shells. Hosted UI acceptance checks exclusive creation, collision-preserving
rename/move, saved editor identity, cold layout and byte-preserving local trash.
Desktop native acceptance and its pending consumer commit remain separate.

R1.3.9.3 retains the current signed installer and Plugins presentation. The
shared native asset verifier is extracted from Desktop; hosts retain URL and
caller admission. Each asset read verifies the current installed record,
version, complete installation fingerprint, declared path/size and byte SHA-256
under the admitted vault writer. Paths remain capability-confined to the plugin;
unsafe paths, unsupported MIME, stale metadata and replaced storage fail closed.
Closing/logout/archive fences future asset requests. Relative chunks, workers
and WASM retain the same installation identity without a service worker.

Rust serves GET/HEAD assets at the existing fingerprinted public route, using
opaque client admissions bound to the authenticated owner/session. Cookie module
requests may omit the version header only on that readonly route; supplied stale
versions and foreign origins remain rejected. Revalidate before conditional/range
responses; network delivery retains no vault lock or work lease.

The same-origin release-download adapter admits only the current first-party
HTTPS registry mirror and GitHub release sources, bounds bytes at 64 MiB, forwards no owner credentials and
retains client-side signature/digest verification. It cannot select native roots
or an alternate execution runtime. The existing browser manual-install path,
trust, enable/disable/uninstall and restart semantics remain. Native installation
transactions and retained job recovery remain R6, and final static delivery R7.
