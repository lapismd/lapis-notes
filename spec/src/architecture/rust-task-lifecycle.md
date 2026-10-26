# Architecture / Native daily Task lifecycle

This chapter continues the [native indexing lifetime](rust-indexing-lifetime.md)
under LN-CORE-003/005/006. It preserves the qualified provider, ordered write,
recovery and tracked-today boundaries without selecting either host.

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

The next recovery stage MUST reuse the existing private turn journal's physical
record-store implementation for profile admission, exclusive writer locks,
bounded records, conditional publication and retirement. Shared IO MUST retain
the existing turn layout, serialized records and dispatch/recovery semantics.
Domain validation and workflow stages remain separately typed; Task records
MUST NOT masquerade as turns. Extracting IO grants no additional dispatch,
filesystem authority, retry, scheduling or host selection.

The separately typed native Task journal MUST bind to admitted vault authority.
Fresh submit consumes existing Work; duplicate identity lookup MUST precede fresh
original-version preflight. Inspect MUST NOT replay writes. Explicit retry MUST
reuse the accepted action/date, source plan and native daily policy. It MUST pin
ensure and observation stages separately before publication, preserve ensured
seeds after later validation failure, and classify physical before/desired/
divergent bytes. A view MUST NOT own journal or Task job lifetime. Source
qualification alone MUST NOT select either host or an unattended scheduler.
Known failed stages MUST retain a bounded code/message for cold inspection;
unrecorded process loss MUST NOT be presented as a recorded domain failure.

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

Selection MUST remain explicit and off by default. The same owner MUST retain
the selected default-provider policy or its unavailable-provider error, wake on
selection changes and stop admitting new materializations when deselected.
Per-pass status MUST retain source/provider/daily failures and readable daily
partials. Same-date refresh MUST preserve observation identity and unchanged
physical bytes; a date refresh MUST NOT advance the authored Task itself.

Acceptance MUST freeze complete retained provider and repository reference
outputs before native implementation, preserve existing fixture bytes and
compare exact Markdown, resolved paths, selected providers, errors, stage order
and retries. It includes non-creating reads, settings changes, duplicate dates,
occupied paths, configured safe filenames, day-part boundaries, all tracking
kinds, source preflight failure, first/second write failure, detach/close and
same-date retries across cold reopen. Source planner qualification and native
application qualification are recorded separately in
[the coordination intake](../../records/2026-10-26-native-task-coordination.md).
