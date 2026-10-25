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
