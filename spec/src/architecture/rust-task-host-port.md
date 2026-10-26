# Architecture / Admitted native Tasks port

This is the R3 shared-port intake after source-qualified recovery `8e09a5de`
and tracked-today scheduling `ad968536`. Notes keeps application authority;
Tasks keeps transformations and its existing planner presentation. Host adapters
keep the established vault client, connection, physical-root and generation
admission. This source gate does not select either application by default.

## LN-CORE-013 — Admitted Task service lifetime

<a id="ln-core-013"></a>

**Requirement.** Selected Task commands MUST use the existing admitted vault client, native writer and service-owned journal. Installation-owned storage MUST stay outside vault content and absent from requests. Accepted operations MUST outlive response cancellation and detach, participate in vault drain, and release journal locks after close. Missing selection, replaced roots and foreign clients MUST fail without a renderer fallback.

## LN-CORE-014 — Bounded typed Task commands and outcomes

<a id="ln-core-014"></a>

**Requirement.** The generated Task protocol MUST bound inputs and preserve typed transformation errors and readable lifecycle outcomes. Complete and skip MUST use the existing ordered journal; inspect MUST remain read-only and retry MUST remain explicit with the accepted action, date and policy. Requests MUST NOT select native paths, caller authority, raw Markdown replacements or executable callbacks. Unknown outcomes MUST NOT trigger replay or fallback.

## LN-CORE-015 — App-owned Task declaration and observation

<a id="ln-core-015"></a>

**Requirement.** An explicitly supplied native Task port MUST be owned by its App. Startup MUST reconcile absent, disabled or failed Task declarations, while passive detach drains observation without disabling native work. Explicit plugin disable MUST fence new admissions and tracked-today materialization on the existing owner. Selected native mode MUST retire renderer Task projection repair and proactive materialization while retaining the existing views and standalone browser implementation.

## Commands and retained engines

The public `@lapis-notes/api/native-tasks` entry exports Rust-generated DTOs and
an already admitted port. `VaultSession.nativeTasks` or an explicit App option
supplies it; the session wins. Plugin startup awaits declaration reconciliation before reporting `plugins-loaded`; earlier passive metadata reads do not select Task policy. A disposable App observer marks itself detached
before plugins tear down. It introduces no timer, writer or durable authority.

Configuration declares bounded logical daily settings, day-part settings,
qualified date-format context and default-provider availability. These are vault
domain preferences, never a profile or filesystem root. Unavailable custom or
ambiguous providers remain explicit; no TypeScript callback executes in native
work. Existing accepted lifecycle policy remains pinned for explicit retry.

Eleven one-file actions reuse `Work::mutate_task`. Complete and skip use the
existing `TaskLifecycleJournal::submit`; they cannot bypass daily-before-Task
publication through the one-file route. Journal identity lookup retains its
existing precedence over fresh source preflight. Daily observation operations
reuse the existing guarded default-daily and occurrence transformations.

Inspection reports the original snapshot, proposed Task/daily replacement,
current readable daily snapshot, typed known failure and cold disposition.
Inspection never schedules writes. The port does not introduce a new journal
format or a generic action engine. Closed storage, unknown request IDs and
transport loss remain distinguishable from acknowledged domain failures.

The HTTP adapter uses `/api/v3/clients/{client}/tasks` and the existing bearer or
browser session, protocol header, Origin, CSRF and attachment-expiry policies.
Only the native application profile selects storage. File-only profiles retain
an unavailable service; merely opening a selected profile starts no Task job.

The Tasks plugin selects this port only when provided by its owning App. Its
existing repository delegates supported transformations, ordered lifecycle and
observation operations. It continues reading through the public database/vault
contracts, but never publishes a competing native Task projection. The existing
planner/editor surfaces remain unchanged; installed-bundle and actual native
application acceptance remain separate from this source prerequisite.
