# App Database / Context

`AppDatabase` is the stable generated-state boundary. Providers choose a local
engine and transport without exposing either choice to Search, Markdown, or the
workspace shell. `deno-desktop` sessions select a native Turso database owned
by the Deno host and expose only the typed AppDatabase method catalogue to the
renderer.

The direct-SQL runtime implements row-scoped normalized Turso writes, typed
metadata indexes, durable revisions, native/browser change relays, bounded
warm reconciliation, and the native plus WASM/OPFS large-vault gates.

## Runtime topology

```text
App / plugins
     ↓ AppDatabase
AppDatabaseProvider
     ├─ Deno desktop renderer → bounded bridge → native Turso
     ├─ Deno server client → typed tRPC bridge → native Turso
     ├─ browser owner worker → Turso WASM + OPFS
     └─ browser proxy → BroadcastChannel RPC → owner
```

Server ZIP import and export transfer authoritative managed content only. They
exclude the derived per-vault database, which is opened or rebuilt through the
same remote contract after an imported vault opens.

`ServerAppDatabaseProvider` implements the public provider interface by
dispatching only catalogue methods to their generated domain procedures. It
shares the vault event subscription with the remote vault adapter and projects
database change sets through the ordinary `subscribeToChanges` contract.
The server Web composition passes that provider explicitly to
`createVaultSession` with runtime `deno-server`; it never opens browser Turso or
participates in browser-owner election.
Container packaging retains native Turso in the server process and scopes FFI
to the cached dependency tree; database paths remain under the managed data
volume and never enter the browser image or static bundle.
Remote database procedures resolve the same authenticated server session before
membership checks whether production uses the secure `__Host-` cookie or the
explicit localhost-only development cookie; the latter does not weaken CSRF or
vault authorization.

The API-owned `REMOTE_APP_DATABASE_CONTRACT` supplies the single method
catalogue, typed argument and result schemas, message bounds, and domain
classification used by both native hosts. Desktop compatibility names alias
that catalogue rather than retaining another list.

The reusable Deno host-services worker protocol and runtime own bounded native
database dispatch and change forwarding. Each concrete host owns its database
path, provider descriptor, worker entry point, and lifecycle trigger.

The server generates domain routers and viewer/editor procedure roles from the
same contract. It validates arguments and results on both sides of its dedicated
native Turso worker and publishes committed database changes into the vault
event sequence without exposing SQL or database paths.

`storeFileHistoryRevision` MAY replace the latest same-path revision when the
caller sets `replaceLatest`. History uses that option for the modify merge
window so rapid edits do not append a new snapshot.

The provider persists application and generated state outside the user-visible
vault. Memory is an explicitly injected test and Storybook double; production
Turso implements the same contract through direct SQL and does not materialize
the Memory provider's maps. Markdown remains authoritative for rebuildable note
metadata, Search documents, tasks, and plugin projections. Migration must retain
database-only History and other non-rebuildable application state.

Memory-derived state follows that same provider contract. The in-memory and
direct-Turso implementations expose source checkpoints, normalized candidates
with exact origins, salted daily recall aggregates, and renewable jobs through
typed methods. Browser proxies and the Deno renderer forward only those methods
through their fixed allowlists. Every mutation emits the `memory` change domain;
clearing the memory tables is an explicit derived-state operation and does not
touch transcripts, curated Markdown, Search documents owned by other providers,
History, metadata, tasks, notifications, or plugin projections.

Vault filename and path glob discovery does not read or populate the app
database. It evaluates the API-owned in-memory vault tree; indexed metadata and
property evaluation remain separate database-backed contracts.
Search path-prefix filtering uses exact directory boundaries and runs on the
shared candidate set before score calculation, ranking, and limiting. Turso
applies provider and exact-or-descendant path predicates in SQL before its
candidate limit, then uses the shared evaluator for ranking; native and browser
proxies forward the same typed option. A completed memory job is terminal and
cannot be reclaimed as a new lease, while expired running jobs remain eligible
for owner takeover.

The Deno desktop renderer selects the same provider contract over a host-owned
native Turso handle. The host executes that handle in a dedicated worker so
native driver steps cannot block window, ACP, or renderer-event work
(LN-DENO-059). The bridge materializes the AppDatabase method surface in
the renderer, forwards only allowlisted calls and typed arguments, and relays
post-commit change sets without exposing raw storage. The WASM provider remains
the browser-compatible path and imports the driver's host-bundler entry so web
builds serve driver-owned worker and WASM assets without inlining the package's
prebuilt worker module. Session disposal drains metadata-cache work and cancels
delayed writes before closing the owning Turso handle.

The browser coordinator opens that WASM provider only in the elected owner.
Proxy tabs obtain the owner's probed descriptor and delegate through a bounded
method catalogue that excludes lifecycle and raw-storage operations. Requests
validate vault, owner, method, argument count, identifiers, and payload size;
responses validate the expected responder. A promoted proxy replays pending
work against its newly opened Turso handle rather than selecting a fallback.
The owner broadcasts committed change sets. A proxy that observes a revision
gap or becomes owner invalidates the affected domain before serving new reads.

`MetadataCache` opens this provider and publishes `loaded` as soon as the
persisted metadata tables are queryable. A matching versioned checkpoint skips
the full manifest scan; otherwise it reports determinate
processable-file counts while merge-comparing the vault file manifest with paged
indexed file rows. Matching stat and parser-signature rows do not hydrate
metadata JSON or read Markdown; only missing or stale paths enter the parse and
row-scoped upsert path. Snapshot import and export are explicit, deprecated
compatibility operations and are absent from this startup flow.
Search remains queryable from persisted rows while its reconciliation waits for
the MetadataCache load promise. A matching Search checkpoint skips the scan;
otherwise reconciliation reads only lightweight Search and metadata manifests,
yields between bounded batches, and advances the checkpoint after successful
completion. Structured facets, nested property paths, and batched incoming-link
lookups execute against their named normalized indexes.

Metadata reconciliation fingerprints accept an optional file predicate for
indexed consumers. The default includes every processable metadata file.
A filtered fingerprint retains the selected files' path, mtime, size and parser
signature; excluded files and processors do not invalidate it. Search selects
only files accepted by its registered document providers.

Projection-aware metadata pages always include the indexed file record, while
omitted metadata domains retain their neutral empty values. The unprojected
call remains source compatible and returns the complete row. Turso resolves a
page with one bounded read per selected table and chunks path parameters below
SQLite's bind ceiling. Path-only Search applies the same query, provider, path,
mode, ranking, and limit semantics as document Search, but returns only ordered
vault-relative paths through direct, browser-proxy, and desktop-native
transports.
Structured tag evaluation receives decoded query literal values from the API
parser. Slash-bearing tags remain bare query words, quoted tags preserve spaces
and escaped delimiters, and leading slash literals continue to reach regex
evaluation. Indexed metadata accepts an explicit space-containing tag from a
frontmatter array so its facet and Search projection retain the same value.

Optional Task priority is `low`, `medium`, or `high`. The public task projection
indexes it as a nullable, sortable string; absence is not an implicit priority.
Version 4 rebuilds derived rows without modifying authored Task Markdown.
