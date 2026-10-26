# Architecture / Native indexing lifetime

R3.2.1 moves reconciliation into the admitted vault service under LN-CORE-003,
LN-CORE-005 and LN-CORE-006. Notes coordinates the existing native database
writers. Markdown parsing remains in private `lapis-plugin-services`, owned by
the sibling first-party plugin repository. Occurrence parsing remains in
`lapis-task-services`, owned by the sibling Tasks repository.

## Initial Markdown intake

Native indexed-file facade intake composes the retained core/task stages and
atomic rename/delete effects under LN-DB-061/062/063. It reuses existing native
writers and committed rename notifications across metadata, Search, notebook,
task and projection relationships. Host adoption and unattended indexing remain
separate gates.

An explicitly selected native Markdown owner watches the admitted physical
vault independently of clients. Startup and external filesystem changes trigger
a bounded reconciliation of Markdown files and stored manifests. The owner
uses the retained parser's MD5 source identity and UTF-16 metadata positions.
Unchanged records do not publish database changes. Deletions remove the existing
indexed-file relationships through the native database mutation path.

The initial processor retains frontmatter, headings, wiki/Markdown links and
tags. Normalized tag/property/link rows are application policy, while parsing
belongs to the plugin crate. No JavaScript processor executes in the service.
Property inference retains the application types and `.lapis/types.json`
declarations; changes to that file trigger reconciliation without modifying
note content. A separate native parser-version identity fences this selected
processor rather than pretending it is a renderer processor registration.
Unsupported plugin processors and richer projections remain explicitly waiting;
this selection cannot be used as the full default metadata owner until their
conformance and both host-adoption gates pass.

Parser identity participates in metadata and Search cache signatures. Adopting a
qualified parser revision reparses prior derived records even when source bytes,
stat and normalized properties stay unchanged. This repair preserves saved
files and their source hashes; it does not import Deno state or select a host.

## Optional Tasks occurrences

Under LN-CORE-003/005/006, explicit host selection MAY enable Tasks occurrence
publication on the existing Markdown owner. Markdown-only selection MUST remain
unchanged. Enabling after startup MUST wake that owner; disabling MUST fence new
Tasks source admissions without stopping Markdown. Already accepted source
publication retains its database drain contract. Both host/plugin selections
remain unqualified.

The source-owned Tasks parser MUST derive retained occurrence records from
canonical daily notes. Notes MUST register the existing public
`tasks/occurrence` schema and publish its exact observation IDs, scanner order,
UTF-16 ranges and source hash. Native parsing MUST NOT introduce task-document,
recurrence, materialization or date policy.

Reconciliation MUST repair missing or stale occurrence sources independently
of unchanged Markdown metadata. Unchanged definitions/sources MUST NOT create
database revisions. Noncanonical and deleted sources MUST lose their ready
rows. Duplicate identities within a source and more than 64 rows MUST publish
observable source errors with no partial ready rows; truncation and
deduplication are forbidden.

## Optional complete Task documents

Under LN-CORE-003/005/006, a separate native-only selection MAY enable complete
Task, List and navigation projection publication on the existing owner. Existing
Markdown-only and occurrence selections MUST retain their behavior and defaults.
No HTTP, Tauri or renderer configuration selects this source intake yet.

Notes MUST reuse the qualified Tasks crate for parsing, recurrence, row and
structure resolution, whole-vault graph validation and source envelopes. Target
lookup MUST use the existing admitted physical-vault link policy and a bounded,
read-only snapshot. Hidden resources, symlinks and replaced roots MUST remain
unavailable. A changing snapshot MUST remain pending before publication.

Native publication MUST retain the existing public `tasks/task` schema, row data,
relationship ordinals and diagnostics. Physical source hashes MUST come from the
admitted Markdown snapshot; compatibility placeholder metadata MUST NOT replace
core metadata. Native Task path/child reads MUST observe the selected projection
without falling back to stale renderer caches. Ordinary metadata links MUST
remain reference records.

Changes to targets or other structural parents MUST refresh dependent unchanged
sources. Non-Task and deleted sources MUST be pruned. Missing/stale sources MUST
repair independently of unchanged metadata, and unchanged source values MUST
remain revision-idempotent across warm passes and cold reopen. Native local-date
refresh MUST derive effective recurrence fields without materializing notes.

Disabling MUST fence new Task source admissions while accepted database writes
drain and Markdown continues. Vault close MUST retire this same watcher/worker,
fence new work and release the database after accepted effects drain. This
private source selection MUST NOT change either host default or public wire API.
Host/plugin admission, unattended application acceptance and all mutations remain
separate gates. The bounded [Notes intake](../../records/2026-10-25-native-task-documents-intake.md)
records source progress and exact acceptance.

## Guarded native Task transformations

Under LN-CORE-003/005/006, an already admitted `Work` MAY explicitly mutate an
existing Task document, materialize an observation in an existing daily note,
or complete an existing observation. These Rust-only operations MUST consume
the qualified Tasks transformation functions directly. They MUST NOT add a
writer, timer, database publisher, transport operation or host selection.

The existing native writer boundary MUST verify the physical root, requested
content revision and dirty/aliased editor claims before persistence. Unchanged
replacement text MUST still pass these checks without rewriting the file.
Accepted work MAY drain during close; new work MUST remain fenced. Task source
errors MUST retain their complete name, code, message and recurrence parts,
distinct from existing native service admission failures.

Task reader adoption MUST advance only the private native projection config
identity. Same-byte sources seeded with an old derived row MUST refresh after
cold reopen. Public Task projection version 4, occurrence version 1 and retained
compatibility envelopes MUST remain unchanged.

Daily document provider selection/creation, tracked-today scheduling, ordered
daily/rolling-Task writes and accepted-operation recovery remain application
coordination. This one-file intake does not qualify those gates or either host's
default selection. Its source and acceptance are recorded separately in
[the guarded Tasks intake](../../records/2026-10-25-native-task-writes.md).

## Native daily Task application coordination

R3.2.1.2.10.3 stages LN-CORE-003/005/006 application policy above qualified
source-owned lifecycle plans. Tasks owns explicit complete/skip intent and
readable observation transformations. Notes owns daily providers, revisions,
both writes, accepted work and recovery. No renderer scheduler or second native
indexing worker may gain authority through this slice.

The native daily-provider boundary MUST retain stable trimmed IDs, finite
priorities, duplicate-ID refusal, one highest-priority selection and visible
priority ambiguity. The default `lapis:daily-notes` policy MUST locate existing
canonical frontmatter by exact local date independently of filename/settings.
Locate MUST NOT create a note; duplicate canonical dates MUST fail visibly.
Renderer-only providers MUST remain explicitly unavailable to native jobs until
their native implementation qualifies; they cannot be invoked after detach.

Default ensure MUST prefer an existing canonical target. Otherwise it MUST
normalize `dailyNotes.folder`, apply the retained `dailyNotes.dateFormat`,
reject unsafe output and refuse an occupied unrelated path. Creation MUST use
the existing admitted missing-file writer and the retained canonical seed;
parent-directory writes retain physical-root and dirty/alias admission. A
native provider returns a checked plan rather than receiving a second writer.
Config and day-part policy remain owned by the admitted service, with explicit
replacement/disposal rather than references to a renderer App or component.
Formatting MUST retain an explicit effective locale and local-week settings.
Native policy MUST reject an unqualified formatting context before creating a
write intent; source capture cannot imply parity for another runtime's Intl
defaults. The initial source parity gate uses its captured en-US Gregorian
context and does not select application hosts.

Before provider-owner selection, native `Work` MAY qualify explicit default
lookup/ensure operations. Those operations MUST use the existing visible
manifest and physical-root admission, bound retained snapshots to 32 MiB and
recheck their inventory and exact bytes before creation. Existing canonical
targets remain read-only lookup results. New targets MUST use the admitted
missing-file writer and existing dirty/alias guards. These helpers grant no
renderer-selected provider, scheduler or host default. Creation outside the
visible native inventory contract MUST remain unavailable. The
[default IO record](../../records/2026-10-26-native-daily-document-io.md) tracks
this physical boundary separately from provider-owner and host selection.

A separate native-only stage MAY process an explicit daily occurrence before
ordered lifecycle admission is selected. It MUST compose the existing Tasks
materialization and optional completion transforms within one existing-file
write, returning that published snapshot and exactly one matching observation.
Default processing MUST reuse qualified ensure followed by this guarded stage;
provider and transform/service failures remain typed. Processing failures MAY
leave an ensured seed, as the retained source does, but MUST NOT publish partial
observation content or advance a Task. The [daily processing
record](../../records/2026-10-26-native-daily-task-observations.md) keeps this
source boundary separate from ordered persistence, recovery and host selection.

Before durable recovery selection, an explicit native-only ordered stage MAY
consume one opaque prepared operation. Preparation MUST pin the checked original
Task snapshot, source plan and action. Execution MUST serialize lifecycle
operations and recheck the original before any daily mutation. Partial outcomes
MUST retain that snapshot, replacement intent, action and published observation.
This stage grants no retry API, unattended scheduling or application selection;
durable recovery remains a separate gate.

An admitted Task operation MUST verify its original Task version and source
plan before the first daily mutation. It MUST resolve the plan's occurrence
date, combine daily materialization and optional completion within one guarded
existing-file operation, then persist the original Task replacement. Daily
persistence precedes rolling Task advancement. Current-Task plan/tracking fields
supply the observation; next-occurrence metadata cannot replace those inputs.
No-op daily content retains all writer checks without rewriting unchanged bytes.

Both paths MUST retain existing dirty/detached editor, alias, revision and
physical-root guards at their persistence boundaries. A daily failure MUST NOT
advance the Task. A later Task failure MUST retain the readable daily result
and expose a partial outcome with the original pinned action/date and versions.
Retries MUST reuse the same task/date observation identity. They MUST NOT
advance twice after an uncertain Task write or silently fall back to TypeScript.

Accepted work MAY finish after client detach or while close drains. New work
remains fenced. Cold recovery MUST reconcile recorded stages against physical
bytes before reporting completion or requesting explicit retry; it cannot
blindly replay an uncertain write. Native default selection and host adapters
remain gated until that application acceptance is complete.

Tracked-today materialization MUST reuse the existing admitted indexing owner
and explicit local-date refresh. Only tracked Tasks whose effective state is
current and effective date is today are proactively materialized. It MUST NOT
add a timer, renderer authority or separate database publisher. Native source
errors, unavailable providers, dirty conflicts and retained partial outcomes
remain observable through the owning service.

Acceptance MUST freeze complete retained provider and repository reference
outputs before native implementation, preserve existing fixture bytes and
compare exact Markdown, resolved paths, selected providers, errors, stage order
and retries. It includes non-creating reads, settings changes, duplicate dates,
occupied paths, configured safe filenames, day-part boundaries, all tracking
kinds, source preflight failure, first/second write failure, detach/close and
same-date retries across cold reopen. Source planner qualification and native
application qualification are recorded separately in
[the coordination intake](../../records/2026-10-26-native-task-coordination.md).

## Native Markdown Search preparation

R3.2.2 first stages a Markdown source gate under LN-CORE-003/005/006. Explicit
native start/stop selection MUST use the existing admitted indexing owner after
its Markdown publication. Starting after Markdown startup MUST wake that same
owner. Transport fields and host defaults MUST remain unchanged until their
separate contract and acceptance gates pass. Closing clients MUST NOT stop
selected reconciliation. Disable MUST fence new Search admissions while already
accepted database work retains its drain.

The stage MUST reuse the existing native preparation, embedding and retrieval
engine and the source-owned Markdown metadata. It MUST retain SearchManager's
Markdown document envelope, filename, historical code-unit MD5 checksum,
UTF-16 source positions and chunking defaults. Native metadata hashes MUST use
the existing source parser's UTF-8 identity; a private projection signature MUST
fence parser upgrades. These cache identities MUST remain distinct from the
retained JavaScript metadata hash rather than claiming byte-identical identity.
Matching body-free manifests MUST skip Search body hydration, preparation and
inference; missing or stale Search rows MUST repair independently of unchanged
metadata. Derived publication MUST NOT rewrite authoritative note content.

Only `search:markdown` rows belong to this source. Reconciliation MUST preserve
other provider and unowned rows, including rows whose paths are absent from the
current vault manifest. Reads MUST retain bounded pages, visible physical-file
admission and same-byte validation before publication. Failures MUST remain
observable without a JavaScript fallback. Complete provider registration,
configuration, checkpoint/progress parity, host activation, semantic-provider
journeys and broader R3.2.2 acceptance remain separate gates.

## Optional Docs note projection

Under LN-CORE-003/005/006, explicit native-only Docs selection MAY publish
`docs/note` on the existing metadata owner. It MUST reuse the qualified
Docs-owned crate for registration and parsing, while Notes retains root/suffix
admission, exact-byte snapshots and database publication. Existing Markdown,
Tasks and Search defaults and public wire contracts MUST remain unchanged.

The stage MUST retain all seven row fields, source errors and configured-root
matching. It MUST repair missing/stale sources, prune former-root/orphan sources
through bounded reads, and preserve other namespaces. Unchanged ready/error
sources and definitions MUST remain revision-idempotent. Changed snapshots stay
pending; hidden, symlinked and replaced-root resources remain unavailable.
Disable and close fence new work while accepted database effects drain.

The [bounded Docs intake](../../records/2026-10-25-native-docs-projection-intake.md)
records the confirmed native-only selection and qualified plugin revision.
Source qualification does not select either application host or migrate Docs UI,
editing, FSRS, custom processors or Tasks mutations.

## Lifetime and failure

Only one native owner starts for a vault. File watchers are hints; startup and
periodic full reconciliation repair missed or coalesced changes. Reads use the
existing vault capability, ignore hidden application/repository directories,
and never follow symlinks. A replaced root fails closed. Source changes during
processing remain pending for a later pass rather than publishing stale bytes.
The owner compares bytes again after parsing, including identical-size and
identical-mtime rewrites. An external edit can still race the final database
publication: watcher hints queue another pass, and a 30-second periodic scan
repairs a missed hint. Convergence is therefore eventual after that next
complete pass, rather than an atomic transaction with external filesystem IO.

Closing clients does not stop the owner. Vault close and Quit stop intake,
complete or cancel the current derived pass, retire the watcher and drain the
database. Failure is observable in native owner status; there is no renderer
fallback or automatic replay of effects. Derived-index reconciliation may run
again after a cold reopen without changing authoritative note content.

## Qualification

The source gate covers real-file startup, external edit/create/delete after
client detach, idempotence, hidden/symlink boundaries, cold reopen and close.
The plugin gate compares shared retained-renderer metadata fixtures, including
Unicode/CRLF positions and invalid YAML. Search scheduling, task/custom plugin
projection conformance, history scheduling and host default cutover retain
their separate R3 gates.

The application reference also compares 18 inferred-type cases and three full
normalized records: declared types, nulls/arrays, tag hierarchy/deduplication,
relative links, same basenames, fragment-only links and external targets. Both
implementations preserve fragment-only links as unresolved under the retained
resolver. The fixtures adapt only the deliberately distinct parser-version
identity; all remaining stored metadata fields are compared.
