# Migration Status

Last updated **2026-10-25 21:34:52 UTC**.

This is the **master tracker for the shared Rust migration**, in the main
`lapis-notes` Jujutsu `default` workspace. The
[saved implementation plan](RUST_CORE_MIGRATION_PLAN.md) defines the scope;
[Desktop's tracker](../lapis-desktop/MIGRATION.md) owns its separate M-series gates.
Historical Node/Deno intake is collapsed below and is not additional work.
[Scope refresh and workspace audit](spec/records/2026-10-25-migration-scope-refresh.md)
record the latest validation and ancestry check.

## What is still left

**The foundation is complete; feature ownership and final cutover remain.**
Both hosts can use shared native files/database/backup. The staged Rust server
already presents the existing login, multi-vault chooser, workspace and plugin
installation. Node remains the hosted default until R7; Desktop's native AI
owner is staged, with renderer AI still the default.

| Stage                       | Current gate                                             | Concrete work still required                                                                                                                                                                                                                                                                       |
| --------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `R2` Conversations          | Working                                                  | Hosted actual-provider screen acceptance is complete. Finish matching Desktop mode/package intake and its real-provider retained-screen detach/cold restart without prompt replay; direct native provider preflights already pass.                                                                 |
| `R3` Indexed vault          | Working                                                  | Finish Tasks/Docs and supported custom processor engines; select one native metadata writer in both hosts; move Search and History scheduling out of clients. Native database, Search, Markdown reconciliation and Tasks occurrence publication are source-qualified; host selection is still off. |
| `R4` AI workflows and tools | Waiting on R2/R3                                         | Move queues, participants, context/skills/handoff, approvals, first-party app tools, Changes and guarded undo to the service; retain existing screens and extension limits.                                                                                                                        |
| `R5` Memory                 | Waiting on R4                                            | Move capture/recall, claims, scheduled maintenance, forget and relocation into native jobs; prove handwritten-edit preservation and restart recovery. Storage alone is already implemented.                                                                                                        |
| `R6` Durable operations     | Waiting; independent source work can run alongside R3–R5 | Adapt retained imports/capture, Forge/transfer, Compute, installation transactions and desktop terminal lifetime to accepted service jobs with progress/cancel/recovery. Reuse existing engines.                                                                                                   |
| `R7` Hosted cutover         | Waiting on feature gates                                 | Run complete hosted/desktop parity and Linux delivery checks; switch the hosted default to Rust; remove Node, the companion and obsolete orchestration. Preserve standalone offline Web.                                                                                                           |

These are **six remaining delivery stages**, not six equally sized changes.
The detailed ledger includes parent stages, child slices and source-only
checkpoints; its row count is not a count of independent unfinished jobs.

## Current work and next handoff

**Immediate prerequisite: finish the Docker tooling and dependency intake.**
The referenced Docker changes are already ancestors of the active Notes, Plugins
and jj-store workspaces; no rebase is needed. Docker checks use isolated Linux
snapshots. Actual OS/WebView/provider checks retain their separate gates.

| Repository                                                                    | Current state                                  | Passed                                                                                                                               | Work still required for this intake                                                                                                     |
| ----------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| [Notes](spec/records/2026-10-25-validation-cache-families.md)                 | Committed `8fba7f2b`                           | Base `04ce1f88`; final 65 tooling, 25 editor/Backlinks, 344 Rust and 2,209 package cases; full check/test/build                      | Portable intake is qualified at 8fba7f2b; publication and actual native/provider gates remain separate                                  |
| [Desktop](../lapis-desktop/spec/src/history/E-VALIDATION-002.md)              | Working in main `default`                      | 77 tooling, 497 governance/renderer, 744 AI, 238 Linux native; strict normal/e2e Clippy; first catalog shard 456/0 across four modes | Remaining three catalog shards, final build/spec and commit; separately adopt the repaired signed Bases bundle                          |
| [Tasks](../lapis-plugin-tasks/spec/records/2026-10-25-docker-final-intake.md) | Committed `3b6cada3`                           | 29 tooling, 275 unit, two native, 62 catalog and all portable source/static/spec gates                                               | None for portable tooling; native algorithm and host adoption gates are separate                                                        |
| [Agent UI](../agent-ui/PLAN.md)                                               | Working in isolated `agent-ui-docker-20261025` | 234 unit, 192 readiness, 20 exact / 56 affected Catalog and all 1,944 theme/viewport cases                                           | All five browser regressions have exact passes; finish the complete owner run on the repaired Design Core cohort and commit             |
| [Bases](spec/records/2026-10-25-bits-runtime-intake.md)                       | Committed in isolated source workspace         | Seven exact source cases cover all nine Select triggers; all 284 source catalog cases pass                                           | Committed `1faa35a1` on CSV ordering `aa71d8fc`; accepted unchanged source baselines recorded; signed Desktop adoption remains separate |

Lapis AI tooling is committed at `b4a5f747` and
[Terminal tooling](../lapis-terminal/spec/src/history/2026-10-25-docker-validation.md)
at `aa8fc3a8`. No portable tooling work remains there. Docs has independent,
overlapping manifest/lock edits; those are preserved and its tooling intake waits.

The dependency cohort uses released Mira 0.1.1 and companion 0.0.3 packages plus
explicit, checksummed source archives where publication is still pending.
[Design Core's source intake](spec/records/2026-10-25-bits-runtime-intake.md)
is committed at `4af345c4`: 922 units, 983 stories and all browser/build/check/spec
gates pass. Its archive matches committed public source. Mira's Bits 2.20.2 intake
is committed at `fd2bcd15`; the source-owned Bits timer repair at `a27be819`
passes six exact, 42 browser and 151 unit cases. No consumer patch is forwarded.
Consumer qualification, package publication and installed delivery are distinct.

The earlier Notes catalog's four failures are closed: the API Select role is
corrected and the source Bases repair covers all nine selectors. Final Notes
qualification passes all five focused cases, 261 catalog cases, eight development
and six static specification-browser cases, plus all 65 tooling and final
specification checks. Bases is committed at `1faa35a1` on the independent CSV
ordering prerequisite `aa71d8fc`; its narrowly accepted unchanged source baselines
remain documented. Publication and other hosts' adoption are separate gates.
Desktop loads Bases as an independently signed installed bundle, which contains
its own UI dependencies. Its 26-package catalog cohort does not load Bases and
cannot prove that bundle's adoption. Fresh bundle persistence/restart and control
accessibility remain a separate host gate.

**Feature lane R2.3: declared modes, then actual-provider screens.**
The [declared-mode source](spec/records/2026-10-25-native-target-modes.md) is
qualified in this slice. The approved `default_mode`
metadata/operator contract and exact-target observer pass all 11 focused / 23
observer cases, eight native installation/operator/transport cases, and the
complete check/test/build lane: 346 Rust and 2,220 package cases. The refreshed
cohort passes all 261 catalog, eight development and six static specification-browser cases;
all eight fixture-provider hosted journeys and final source/specification checks
also pass with that refreshed cohort. Matching API/application-profile archives
are prepared for Desktop intake. Desktop's
prepared-launch metadata is committed separately at `f289874c`: three focused
and all 240 native cases pass. The [hosted actual-provider screen](spec/records/2026-10-25-hosted-provider-screen.md)
now passes: explicit running detach, completion without its browser, cold History
recovery, one Submit/journal and an unchanged transcript. Desktop package intake
and its actual-provider retained-screen journey remain. The [direct-provider preflight](spec/records/2026-10-25-rust-provider-preflight.md)
is already qualified; it does not replace these screen journeys.

**Feature lane R3: pure Tasks parsing, then projections and host selection.**
The main source occurrence service is committed at `16977050`. The complete
Tasks document parser is Source complete at isolated `lapis-task-documents`
`f06b79b4`: 75 shared document fixtures, 27 occurrence fixtures, 89 exact / 304
full TypeScript and three native cases pass. The Docker/parser intake is committed at isolated `5695cc11`, preserving the
qualified parser and tooling parents. The unchanged TypeScript oracle has now
captured 32 date sets with 166 queries and 18 effective-occurrence cases. Native
recurrence/effective resolution is now Source complete at `c725d58b`: 63 focused,
402 full TypeScript and six native cases plus strict check/build/publint/spec
pass. Two separately captured ordinal cases add 16 queries while preserving the
original corpus. Version-4 Task row normalization is Source complete at
`030cb061`: 106 complete oracle outcomes, 108 focused/508 full TypeScript and
seven native cases plus all source/package gates pass. Per-document
structure/target/run resolution is Source complete at `34ef8bf8`: 96 structure
scenarios, three direct parser outcomes, 110 focused TypeScript, nine native,
607 full unit and 62 cold catalog cases plus full check/build/publint/spec pass.
Whole-vault parent/cycle validation and projection envelopes are next. Notes
adoption, full Tasks/Docs/custom projections and
one selected native writer in both hosts remain. No second writer is enabled.

**Next handoff order:** finish and commit the tooling/source prerequisites;
adopt the declared-mode packages in Desktop; close actual-provider screen
recovery; continue Tasks algorithms and projection adoption. Independent source
work runs in parallel, within four heavy workers / 16 CPU / 48 GiB total.

## Completed foundation

`R0`, `R1.1`, `R1.2` and `R1.3` are Complete: saved plan, shared file engine,
vault/service admission and writer lifetime, both transport adapters and their
retained-shell intake. Native database/Search/model source and turn protocol/
continuation source are also committed, with host gates listed separately below.
Source evidence does not imply host selection or final product acceptance.

## Deferred and excluded

Signing/distribution `M11`, Docker **agent execution**, multi-user hosting,
hosted terminals, an independent daemon and the AgentStore/ThreadStore experiment
remain deferred or outside this migration. Docker **local testing** is active
work. Deno is frozen and superseded. No Deno-era data import is required.

## Detailed task ledger

Open the ledger for exact slice status, specification links and evidence.
**Complete** means the original gate passed and was committed; **Source complete**
means implementation is qualified but host/product acceptance is still separate.
**Working** means underway; **Waiting** means not started or prerequisite-bound;
**Deferred** means outside current scope. Tables are grouped by gate status and
sorted by task ID, rather than execution order.

<details>
<summary>Show every task gate and its evidence</summary>

<!-- migration-tasks:start -->

<!-- Generated by pnpm progress:generate from spec/migration-progress.json. Do not edit these tables. -->

[Task source ledger](spec/migration-progress.json) · Regenerate with
`pnpm progress:generate`; verify with `pnpm check:progress`.

Task IDs link to their owning canonical specification. Tables group gates, not
execution order; the [full plan](RUST_CORE_MIGRATION_PLAN.md#ordered-implementation)
retains the dependencies. Source complete qualifies shared Rust source only,
not host adoption or native/hosted application acceptance.

### Gate status: Working

| Task ID                                                                    | Area                 | Work                                               | Evidence or next gate                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------------------------------------------------- | -------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [R2](spec/src/architecture/rust-application-services.md#ln-core-003)       | Roadmap              | Durable conversation                               | Native execution, typed transports and existing-screen application adoption are qualified. Hosted actual-provider composer/detach/cold History recovery now passes with one native turn and unchanged transcript. R2.3 remains Working for matching Desktop mode/package intake and its actual-provider retained-screen journey; defaults stay staged.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| [R2.3](spec/src/architecture/rust-application-services.md#ln-core-007)     | Durable conversation | Real-provider detach and cold application recovery | [Actual-provider preflight](spec/records/2026-10-25-rust-provider-preflight.md) passes native Tauri/Core and Rust HTTP detach/cold/idempotent checks. [Declared-mode source](spec/records/2026-10-25-native-target-modes.md) is qualified in the enclosing change: 11 focused/23 observer, eight native, full check/test/build (346 Rust/2,220 package cases), 261 cold catalog, eight development/six static specification-browser and all eight refreshed fixture-provider hosted journeys. Final spec/package checks pass; API/app-profile archives are prepared. Desktop adapter f289874c separately passes three focused/all 240 native cases. [Hosted actual-provider screen](spec/records/2026-10-25-hosted-provider-screen.md) passes one case: running detach, no-browser completion and cold History/reload with one Submit/journal and unchanged transcript. Matching Desktop package intake and its actual-provider screen remain; AI defaults stay staged.                                                  |
| [R3](spec/src/architecture/rust-application-services.md#ln-core-003)       | Roadmap              | Indexed vault                                      | Native database/Search/model/cache and vault lifetime are source-qualified; HTTP and Desktop database facade adoption are complete. Markdown reconciliation and Tasks occurrence publication are integrated at 16977050. Source-owned Tasks document parsing and recurrence/effective resolution are qualified at isolated c725d58b: original 32 date sets/166 queries, 18 effective cases plus two additional ordinal cases/16 queries. Private version-4 Task row normalization is Source complete at 030cb061 (106 complete oracle outcomes, 108 focused/508 full TypeScript and seven native cases). Per-document structure/target/run resolution is Source complete at 34ef8bf8: 96 complete structure scenarios, three direct parser outputs, 110 focused TypeScript, nine native, 607 full unit and 62 cold catalog cases plus all source/package/specification gates pass. Full Tasks/Docs/supported custom projections, both unattended indexing selections and service-owned Search/History scheduling remain. |
| [R3.2.1](spec/src/architecture/rust-application-services.md#ln-core-003)   | Service ownership    | Unattended metadata and projection reconciliation  | Native Markdown reconciliation, Tasks occurrence publication (main Notes 16977050) and the source-owned Tasks document parser (f06b79b4) are Source complete. Full Tasks/Docs/custom processors and both host selections remain separate gates; aggregate R3.2.1 stays Working.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| [R3.2.1.2](spec/src/architecture/rust-application-services.md#ln-core-005) | Unattended metadata  | Remaining native plugin projection processors      | Tasks occurrence parsing and publication are integrated into Notes 16977050. Private Tasks document parsing and recurrence/effective resolution are Source complete at c725d58b. Private version-4 projectTask normalization is Source complete at 030cb061. Structure/target/run parity is Source complete at 34ef8bf8. Whole-vault graph parity, projection envelopes/materialization, Docs/custom processors and both host selections remain; source qualification does not select a writer.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

### Gate status: Waiting

| Task ID                                                                    | Area                | Work                                        | Evidence or next gate                                                                                                                                  |
| -------------------------------------------------------------------------- | ------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [R3.2.1.3](spec/src/architecture/rust-application-services.md#ln-core-004) | Unattended metadata | Tauri and HTTP unattended metadata adoption | Select one native metadata writer through both hosts and prove external changes after client detach without a renderer scheduler.                      |
| [R3.2.2](spec/src/architecture/rust-application-services.md#ln-core-003)   | Service ownership   | Search index reconciliation and scheduling  | Native preparation/retrieval and service-owned lifetime; qualify equivalent results and derived-cache rebuilds.                                        |
| [R3.2.3](spec/src/architecture/rust-application-services.md#ln-core-003)   | Service ownership   | History-index scheduling                    | Reuse the existing history engine and move its scheduler into the vault service.                                                                       |
| [R4](spec/src/architecture/rust-application-services.md#ln-core-005)       | Roadmap             | AI/tools/Changes                            | After R2/R3: existing queues, participants/context, approvals, native tools and guarded undo through both hosts.                                       |
| [R5](spec/src/architecture/rust-application-services.md#ln-core-007)       | Roadmap             | Memory                                      | After R4: native capture/recall, Markdown authority, maintenance, relocation and cold recovery. Derived database storage alone does not complete this. |
| [R6](spec/src/architecture/rust-application-services.md#ln-core-003)       | Roadmap             | Native jobs                                 | After R5: imports/capture, existing Forge/transfer/Compute, installation transactions and terminal lifetime.                                           |
| [R7](spec/src/architecture/rust-application-services.md#ln-core-008)       | Roadmap             | Rust cutover                                | After the feature slices: full hosted/desktop journeys, HTTP/SSE, Linux packaging, standalone-browser regression checks and Node/companion retirement. |

### Gate status: Source complete

| Task ID                                                                      | Area                      | Work                                                                | Evidence or next gate                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [R1.3.1](spec/src/architecture/rust-application-services.md#ln-core-004)     | Host adapters             | Shared portable file operations                                     | [File action service](spec/records/2026-10-23-rust-core-file-actions.md).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| [R1.3.3](spec/src/architecture/rust-application-services.md#ln-core-004)     | Host adapters             | Rust HTTP command adapter                                           | [Owner authentication, protocol version and admitted clients](spec/records/2026-10-24-rust-core-http.md).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| [R1.3.4](spec/src/architecture/rust-application-services.md#ln-core-004)     | Host adapters             | Hosted client leases and expiry                                     | [Heartbeat, expiry and retained dirty claims](spec/records/2026-10-24-rust-core-attachments.md).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| [R1.3.5](spec/src/architecture/rust-application-services.md#ln-core-004)     | Host adapters             | File/resource streaming                                             | [Conditional uploads, snapshots and ranges](spec/records/2026-10-24-rust-core-streams.md); [rejected upload connection handling](spec/records/2026-10-24-rust-http-upload-connections.md).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| [R1.3.6](spec/src/architecture/rust-application-services.md#ln-core-004)     | Host adapters             | Browser owner login and sessions                                    | [Bootstrap, cookies, Origin/CSRF, expiry and revocation](spec/records/2026-10-24-rust-core-auth.md).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| [R1.3.7](spec/src/architecture/rust-application-services.md#ln-core-004)     | Host adapters             | Database facade bound to admitted vault lifetime                    | [Vault/database lifetime](spec/records/2026-10-24-rust-core-vault-database.md): eleven lifetime cases, 227 ordinary Rust cases, five actual-model parent cases with cold offline children and full source check/test/build pass. Desktop df16e136 passes both file-service cases and strict normal/e2e checks; application adoption remains R1.3.8.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| [R2.1](spec/src/architecture/rust-application-services.md#ln-core-003)       | Durable conversation      | Native admission and supervised execution                           | [Qualified native execution](spec/records/2026-10-25-rust-native-turn.md): ten execution plus ten journal cases, all 303 ordinary Rust cases/doctests, strict/full source check/test/build and all specification lanes pass. Lifecycle journal release and private-root overlap regressions each move from one failure to zero. Six intentional ignores retain their separate scope. The unchanged AI backend uses an isolated protocol peer; host/chat/provider acceptance remains R2.2/R2.3. [Desktop compatibility](spec/records/2026-10-25-rust-native-turn-desktop.md) is committed at 6c9e55f7: six native file/database/backup cases and strict normal/e2e checks pass without selecting the new execution owner.                                                       |
| [R2.2.1](spec/src/architecture/rust-application-services.md#ln-core-004)     | Durable conversation      | Typed turn protocol, HTTP and public client port                    | [Qualified typed host source](spec/records/2026-10-25-rust-turn-hosts.md): wire, 21 native execution/journal, HTTP/installation, configured-binary cold restart and public SDK/client contracts pass. Full source checks/tests/build/specification pass with all 311 ordinary Rust cases/doctests, 261 cold catalog, seven hosted and twelve PWA journeys. Prepared native launch retention is fixed; Lapis AI is unchanged. Actual chat/Tauri/provider acceptance remains separate.                                                                                                                                                                                                                                                                                           |
| [R2.2.2](spec/src/architecture/rust-application-services.md#ln-core-004)     | Durable conversation      | Service-owned conversation creation and continuation                | [Qualified native continuation](spec/records/2026-10-25-rust-conversation-continuation.md): four journal/four native cases, all four HTTP and three wire cases pass. One conversation retains transcript/binding prefixes and metadata through detach/cold recovery, with pinned history, bounded Unicode evidence and 409/BUSY stale-head refusal. All 321 Rust cases/doctests, 2,157 package Vitest cases, complete source check/test/build/specification lanes pass. The earlier three journal/two native failures and strict enum finding are fixed. Generated SDK runtime is unchanged; actual chat/Tauri/provider gates remain separate.                                                                                                                                 |
| [R3.1.1](spec/src/architecture/rust-application-services.md#ln-core-003)     | Database catalogue        | Metadata get/set, scans, conditional transactions and revisions     | [Native database foundation](spec/records/2026-10-24-rust-core-database.md).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| [R3.1.2](spec/src/architecture/rust-application-services.md#ln-core-003)     | Database catalogue        | Notebook state, notifications and committed change events           | [Saved state and events](spec/records/2026-10-24-rust-core-database-state.md).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| [R3.1.3](spec/src/architecture/rust-application-services.md#ln-core-003)     | Database catalogue        | Database-only file history                                          | [Revisions, lineage, retention and rollback](spec/records/2026-10-24-rust-core-database-history.md).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| [R3.1.4](spec/src/architecture/rust-application-services.md#ln-core-003)     | Database catalogue        | Core indexed metadata storage, reads, manifests, filters and facets | [Independent indexed publication and queries](spec/records/2026-10-24-rust-core-database-indexed.md).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| [R3.1.5](spec/src/architecture/rust-application-services.md#ln-core-003)     | Database catalogue        | Projection definitions and atomic source writes                     | [Projection storage](spec/records/2026-10-24-rust-core-projection-storage.md).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| [R3.1.6](spec/src/architecture/rust-application-services.md#ln-core-003)     | Database catalogue        | Projection single-row reads                                         | [Aliases, privacy, freshness and cold reads](spec/records/2026-10-24-rust-core-projection-rows.md).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| [R3.1.7](spec/src/architecture/rust-application-services.md#ln-core-003)     | Database catalogue        | Projection AST and relationship queries                             | [Retained reference conformance](spec/records/2026-10-24-projection-query-reference.md); [native query intake](spec/records/2026-10-24-rust-core-projection-queries.md).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| [R3.1.8](spec/src/architecture/rust-application-services.md#ln-core-003)     | Database catalogue        | Task facade                                                         | [Six task methods and ordered staged commits](spec/records/2026-10-24-rust-core-tasks.md).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| [R3.1.9](spec/src/architecture/rust-application-services.md#ln-core-003)     | Database catalogue        | Derived memory records and job leases                               | [Thirteen storage/lease methods](spec/records/2026-10-24-rust-core-memory-storage.md). Capture and maintenance remain R5.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| [R3.1.12](spec/src/architecture/rust-application-services.md#ln-core-003)    | Database catalogue        | Native prepared Search storage                                      | [Native Search storage](spec/records/2026-10-24-rust-core-search-storage.md): prepared rows, vectors, manifests and statistics. [Desktop dependency compatibility](spec/records/2026-10-24-rust-core-search-desktop.md) passes; host adoption remains waiting.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| [R3.1.13](spec/src/architecture/rust-application-services.md#ln-core-003)    | Database catalogue        | Native Search document preparation and chunking                     | [Native preparation](spec/records/2026-10-24-rust-core-search-preparation.md): shared 17-record reference, scored chunks, tags/frontmatter and UTF-16-safe cutoffs. Semantic inference and host intake remain separate.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| [R3.1.14](spec/src/architecture/rust-application-services.md#ln-core-003)    | Database catalogue        | Native lexical/structured Search retrieval                          | [Native retrieval intake](spec/records/2026-10-24-rust-core-search-retrieval.md): 76 full-result/path queries, retained FTS weights, complete table ranking, UTF-16 snippets, bounded selection and cold reopen. Full source check/test/build/spec and 261 catalog cases pass; semantic inference and host adoption remain separate.                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| [R3.1.15](spec/src/architecture/rust-application-services.md#ln-core-003)    | Database catalogue        | Native ONNX encoder                                                 | [Real MiniLM inference](spec/records/2026-10-24-rust-core-onnx.md) at 6e56d581 and [Desktop compatibility](spec/records/2026-10-24-rust-core-onnx-desktop.md) at a9ce8d9a are qualified. Runtime/model-cache source is now R3.1.18; HTTP intake is R1.3.8, with retained application acceptance separate.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| [R3.1.16](spec/src/architecture/rust-application-services.md#ln-core-003)    | Database catalogue        | Native Search provider control and embedding publication            | [Native provider intake](spec/records/2026-10-24-rust-core-search-provider.md): lazy configuration/status, atomic invalidation, actual model inference after detach and cold reopen. Full source and serving-baseline acceptance passes; Desktop intake remains separate.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| [R3.1.18](spec/src/architecture/rust-application-services.md#ln-core-003)    | Database catalogue        | Native model/cache installation and runtime admission               | [Native model/cache source](spec/records/2026-10-24-rust-core-model-cache.md) plus [installer lease repair and HTTP factory selection](spec/records/2026-10-24-rust-http-database.md): eight fresh contention rounds, all five real-model cases and full source/consumer qualification pass. Tauri and retained Web intake remain.                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| [R3.1.19](spec/src/architecture/rust-application-services.md#ln-core-003)    | Database catalogue        | Native vector/hybrid Search retrieval                               | [Native semantic intake](spec/records/2026-10-24-rust-core-search-semantic.md): all 16 retained query envelopes/path results, five edge cases (111/300 records), bounded candidate buffers and three real-model cases pass. Full source check/test/build/spec pass. [Retained reference](spec/records/2026-10-24-search-semantic-reference.md) stays separate; HTTP facade intake is R1.3.8; Tauri and retained Web acceptance remain separate.                                                                                                                                                                                                                                                                                                                                |
| [R3.1.20](spec/src/architecture/rust-application-services.md#ln-core-003)    | Database catalogue        | Native Search batch and rebuild controls                            | [Batch/rebuild controls](spec/records/2026-10-24-rust-core-search-rebuild.md): admitted barriers, bounded 100-record pages, selected inference, detach/drain, ordered committed changes and rollback. Five exact / 185 full Rust cases pass; source check/test/build pass. Host adoption remains waiting.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| [R3.1.21](spec/src/architecture/rust-application-services.md#ln-core-003)    | Database catalogue        | Complete indexed-file upsert, rename and delete                     | [Native indexed-file intake](spec/records/2026-10-24-rust-core-indexed-mutations.md): ten-case retained reference, staged task commits, atomic rename/delete and persisted rename notifications; seven exact native cases, 169 full Rust cases, 1,489 API cases and all source check/test/build/spec lanes pass.                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| [R3.1.22](spec/src/architecture/rust-application-services.md#ln-core-003)    | Database catalogue        | Complete native AppDatabase facade                                  | [Native call conformance](spec/records/2026-10-24-rust-core-database-calls.md): all 68 methods / 85 retained calls, explicit undefined/null/void, optional defaults, conditional transaction results and query-enhancement diagnostics pass. Eight exact native / 39 retained API cases and complete source check/test/build/model/spec lanes pass. Host adoption is separate.                                                                                                                                                                                                                                                                                                                                                                                                 |
| [R3.2.1.1](spec/src/architecture/rust-application-services.md#ln-core-003)   | Unattended metadata       | Native Markdown parsing and reconciliation lifetime                 | [Native Markdown source](spec/records/2026-10-25-native-markdown-indexing.md): parser 6af2420f and Notes selected-source intake pass ten lifetime/two normalization/21 retained reference cases, 338 complete ordinary Rust cases, five unique real-model cases, all 2209 package cases/33 forced tasks, 261 cold catalog and spec lanes. Npm exception is limited to the plugin parser slice. Both host selections and other processors remain pending; Notes source intake is committed at 7161a447ef365df498371d7bad491df5f5da431c.                                                                                                                                                                                                                                         |
| [R3.2.1.2.1](spec/src/architecture/rust-application-services.md#ln-core-005) | Native plugin projections | Source-owned Tasks occurrence parser                                | [Source receipt](../lapis-plugin-tasks/spec/records/2026-10-25-native-task-occurrences.md), Tasks commit 569d7e30ed86bd4514365e50befb908b2a8400e2. Private parser retains version-1 rows, tracking values, URI/path handling, duplicates and UTF-16 source ranges. All 229 unit cases, 27 shared fixtures and native/check/build/spec lanes pass. Notes publication is integrated at 16977050; both host selections remain pending.                                                                                                                                                                                                                                                                                                                                            |
| [R3.2.1.2.2](spec/src/architecture/rust-application-services.md#ln-core-005) | Native plugin projections | Native Tasks occurrence publication                                 | [Opt-in occurrence publication source](spec/records/2026-10-25-native-task-occurrences.md), isolated commit 23f0e8c6, is integrated into main at 16977050. [Main intake](spec/records/2026-10-25-native-task-occurrences-intake.md) requalifies five exact/all 344 native cases, strict checks/build/spec on 04ce1f88 with unchanged production bytes and exact parser pins. Both host/plugin selections remain waiting.                                                                                                                                                                                                                                                                                                                                                       |
| [R3.2.1.2.3](spec/src/architecture/rust-application-services.md#ln-core-005) | Native plugin projections | Source-owned Tasks document parser                                  | [Source receipt](../lapis-task-documents/spec/records/2026-10-25-native-task-documents.md), isolated Tasks commit f06b79b4. All 75 complete shared JSON document fixtures match the unchanged TypeScript oracle; 89 exact TypeScript, 304 full unit and three native cases pass with strict check/build/package/spec lanes. Recurrence/effective resolution and Task row normalization are separately qualified at c725d58b/030cb061. Notes adoption, full structure/envelope projection, mutations and both host selections remain pending. Isolated Docker-tooling intake 5695cc11 preserves f06 and 3b6cada3 as parents, verifies all 22 native/parser inputs unchanged, and passes fresh canonical Docker specification gates. Recurrence implementation is separate.      |
| [R3.2.1.2.4](spec/src/architecture/rust-application-services.md#ln-core-005) | Native plugin projections | Source-owned Tasks recurrence and effective resolution              | [Source receipt](../.workspaces/lapis-task-recurrence-intake-20261025/spec/records/2026-10-25-native-task-recurrence.md), isolated Tasks commit c725d58b04b8c0a370ad020c38357462ac98650a. Original unchanged-TypeScript oracle retains 32 date sets/166 queries and 18 effective cases; two separate ordinal scenarios add 16 query envelopes. All 63 focused/402 full TypeScript cases, six native tests and strict check/build/publint/spec pass. Version-4 normalization is separately qualified at 030cb061; structure/envelope projection, Notes adoption and both host selections remain pending.                                                                                                                                                                        |
| [R3.2.1.2.5](spec/src/architecture/rust-application-services.md#ln-core-005) | Native plugin projections | Source-owned version-4 Task row normalization                       | [Source receipt](../.workspaces/lapis-task-recurrence-intake-20261025/spec/records/2026-10-25-native-task-projection.md), isolated Tasks commit 030cb061bd7f945c4aaa5cb2dc274b9c4afe719b. All 106 complete unchanged-TypeScript oracle outcomes match: 92 Tasks, five Lists, one navigation, seven absent documents and one retained invalid-date error. All 108 focused/508 full TypeScript cases, seven native tests and strict check/build/publint/spec pass. Per-document structure is separately qualified at 34ef8bf8. Whole-vault graph resolution, projection envelopes and both host selections remain.                                                                                                                                                               |
| [R3.2.1.2.6](spec/src/architecture/rust-application-services.md#ln-core-005) | Native plugin projections | Source-owned Tasks per-document structure and run resolution        | [Source receipt](../.workspaces/lapis-task-recurrence-intake-20261025/spec/records/2026-10-25-native-task-structure.md), isolated Tasks commit 34ef8bf8af0415531083f3cdd2884c45ddda6b36. All 96 unchanged-TypeScript structure outcomes match (93 resolved/projection pairs, two scan-only navigation cases and one callback error), plus three separately captured complete CRLF/tab/empty-heading parser outcomes. All 110 focused TypeScript, nine native, 607 full unit and 62 fresh catalog cases plus full check/build/publint/specification pass. All six prior corpora, Cargo graph and runtime models are unchanged. Whole-vault parent/cycle validation, target policy/href and edge/indexed-file envelopes, Notes processor intake and both host selections remain. |

### Gate status: Complete

| Task ID                                                                    | Area                 | Work                                                       | Evidence or next gate                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------------------------------------------------- | -------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [R0](spec/src/architecture/rust-application-services.md#ln-core-001)       | Roadmap              | Plan and review                                            | [Saved plan and reviewed Desktop baseline](spec/records/2026-10-23-rust-core-plan.md).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| [R1.1](spec/src/architecture/rust-application-services.md#ln-core-002)     | Roadmap              | Shared vault engine                                        | [Extracted engine and qualified Desktop intake](spec/records/2026-10-23-rust-core-vault.md).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| [R1.2](spec/src/architecture/rust-application-services.md#ln-core-003)     | Roadmap              | Vault/service ownership                                    | [Qualified ownership, detach, dirty claims, serialization and drain](spec/records/2026-10-23-rust-core-ownership.md).                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| [R1.3](spec/src/architecture/rust-application-services.md#ln-core-004)     | Roadmap              | Both host adapters                                         | [Both-host intake](spec/records/2026-10-25-rust-desktop-intake.md): HTTP and retained hosted shell gates plus committed Desktop efa44bb0 database, backup detach/Quit and native file-action qualification. The separate existing Markdown attachment defect has explicit user acceptance; R2-R7 and final cutover remain open.                                                                                                                                                                                                                                                                     |
| [R1.3.2](spec/src/architecture/rust-application-services.md#ln-core-004)   | Host adapters        | Desktop file adapter intake                                | Desktop M16.2/E-CORE-003/004 qualifies the original native file/admission gate. Later database additions are separate.                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| [R1.3.8](spec/src/architecture/rust-application-services.md#ln-core-004)   | Host adapters        | Tauri and HTTP database adapters                           | [Committed Desktop efa44bb0 intake](spec/records/2026-10-25-rust-desktop-intake.md) and the separately qualified HTTP database adapter pass admission, native channels, persistence and the retained provider. All 2000 catalog cases pass. The native UI result stays 27 pass / one pre-existing Markdown image failure, explicitly accepted as non-blocking for this commit; its source repair remains pending.                                                                                                                                                                                   |
| [R1.3.9](spec/src/architecture/rust-application-services.md#ln-core-004)   | Host adapters        | Existing browser login/vault/workspace UI on Rust          | [Configured shell](spec/records/2026-10-25-rust-hosted-shell.md), [managed vaults](spec/records/2026-10-25-rust-managed-vaults.md), [folder/ZIP transfers](spec/records/2026-10-25-rust-vault-transfers.md) and [signed plugin lifecycle](spec/records/2026-10-25-rust-installed-assets.md) qualify the retained Rust-hosted login/chooser/Notes UI. All five cold browser journeys pass, including actual server restarts. This staged shell gate does not claim R2-R7 feature parity or replace Node; final SSE/static delivery remains R7.                                                       |
| [R1.3.9.1](spec/src/architecture/rust-application-services.md#ln-core-004) | Hosted shell         | Retained chooser managed-vault lifecycle                   | [Managed-vault intake](spec/records/2026-10-25-rust-managed-vaults.md) qualifies all seven native management cases, accepted-work cancellation/drain, both adapter cases, all 52 Web unit cases and both final cold Rust UI journeys (15.7s), including real process restart. Full source check/test/build/spec, all 261 catalog cases, retained Node acceptance and both Desktop library compatibility cases pass in this slice. Transfers/installation remain separate.                                                                                                                           |
| [R1.3.9.2](spec/src/architecture/rust-application-services.md#ln-core-004) | Hosted shell         | Existing folder/ZIP import and vault export                | [Vault transfers](spec/records/2026-10-25-rust-vault-transfers.md): bounded native folder/ZIP intake and export reuse the retained chooser. Nine archive and twelve managed-vault cases, all 273 ordinary Rust cases/doctests, all 20 package check/test tasks, eleven builds, 53 Web unit cases, all 261 catalog cases and all three final cold Rust UI/restart journeys (18.9s) pass. Both Desktop library compatibility cases pass on the separately recorded uncommitted snapshot. R6 durable recovery and the pending Desktop consumer commit retain their own gates.                          |
| [R1.3.9.3](spec/src/architecture/rust-application-services.md#ln-core-004) | Hosted shell         | Existing installed-plugin delivery and lifecycle           | [Installed delivery](spec/records/2026-10-25-rust-installed-assets.md): signed install/restart/disable/re-enable/uninstall and all five cold Rust browser journeys (34.6s) pass. Final qualification passes 283 ordinary Rust cases/doctests, twenty package check/test tasks, eleven builds, 60 Web cases, all 261 catalog cases and specification/format gates. One macOS ENOBUFS attempt is retained; the exact case and bounded complete rerun pass unchanged. Desktop native compatibility passes separately; its pending application commit, R6 transactions and R7 delivery remain separate. |
| [R1.3.10](spec/src/architecture/rust-application-services.md#ln-core-004)  | Host adapters        | Automatic backup after client detach and controlled Quit   | [Shared native/HTTP backup](spec/records/2026-10-25-rust-backup-commands.md) and [Desktop efa44bb0](spec/records/2026-10-25-rust-desktop-intake.md) qualify capture after detach, final Quit, explicit disable/restart and failure preflight. All 235 native, 416 renderer/governance, 744 AI, 2000 catalog, six hidden API and eleven original lifecycle cases pass. Separate pre-existing Markdown exception explicitly accepted; provider/platform gates remain separate.                                                                                                                        |
| [R1.3.11](spec/src/architecture/rust-application-services.md#ln-core-004)  | Host adapters        | Same existing file actions through both application shells | [Both-shell file actions](spec/records/2026-10-25-rust-native-file-actions.md) and [committed Desktop efa44bb0](spec/records/2026-10-25-rust-desktop-intake.md): seven Rust-hosted browser, twelve PWA and one Node24 journey pass; both native file-action journeys, seven asset cases, strict normal/e2e checks, both bundles and ordinary audit pass. The separate existing Markdown failure is explicitly accepted for this intake.                                                                                                                                                             |
| [R2.2](spec/src/architecture/rust-application-services.md#ln-core-004)     | Durable conversation | Typed host adapters and existing chat adoption             | Typed transport and continuation source plus both existing production chat screens are qualified. [Actual-host receipt](spec/records/2026-10-25-rust-chat-native-acceptance.md) records Desktop 5f165fc9 and Rust-hosted application adoption. Protocol-peer fixtures do not qualify the separate R2.3 actual-provider gate; defaults remain staged.                                                                                                                                                                                                                                                |
| [R2.2.3](spec/src/architecture/rust-application-services.md#ln-core-004)   | Durable conversation | Tauri selection and existing chat adoption                 | [Committed actual-host intake](spec/records/2026-10-25-rust-chat-native-acceptance.md): Desktop 5f165fc9 against Notes 7161a447. Native composer, right-sidebar History, exact main-tab reuse and cold restart retain one prompt/reply. All 2016 catalog, 420 renderer/governance, 744 AI, 242 native service and seven hidden IPC cases pass; strict checks/builds/spec pass. Existing E-AI-109 format exception stays explicitly accepted; R2.3/default cutover remain open.                                                                                                                      |
| [R3.1.10](spec/src/architecture/rust-application-services.md#ln-core-003)  | Database catalogue   | Retained Search storage reference                          | [Prepared documents, manifests and corrected Memory statistics](spec/records/2026-10-24-search-storage-reference.md), committed as `89acf34f`.                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| [R3.1.11](spec/src/architecture/rust-application-services.md#ln-core-003)  | Database catalogue   | Retained Search retrieval candidate reference              | [Complete table evaluation](spec/records/2026-10-24-search-candidate-reference.md): 22 exact regression cases pass after repairing 15 failures; full source check/test/build, 261 catalog cases and specification lanes pass. Native retrieval remains separate.                                                                                                                                                                                                                                                                                                                                    |
| [R3.1.17](spec/src/architecture/rust-application-services.md#ln-core-003)  | Database catalogue   | Desktop provider/archive/SQL intake                        | [Desktop `074dee3a` / E-CORE-014](spec/records/2026-10-24-rust-core-search-provider-desktop.md): five archives and four rebuilt hidden API cases; fresh 411 renderer/governance, 744 AI, 230 native service and all 2,000 catalog cases pass. Strict native/type checks and both builds pass; unchanged E-AI-109 format exception remains explicitly accepted. Latest core `8fd7b926` passes separate service/normal/e2e compatibility.                                                                                                                                                             |

<!-- migration-tasks:end -->

</details>

<details>
<summary>Historical intake and earlier qualification — reference only</summary>

### Consumer qualification already recorded

These are separate evidence levels; a dependency compile is not native UI or
hosted application acceptance.

| Qualification                               | Latest recorded evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cold Desktop native WebView gate            | Desktop `f043d1b9` with Notes `67a57aa9`: three rebuilt cold hidden-native cases; [E-CORE-005 intake](spec/records/2026-10-24-rust-core-database-desktop.md).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Complete Desktop Rust suite                 | Latest fresh intake at Desktop `074dee3a`: all 230 native service cases pass with Notes `cfb369f7`; [provider/SQL/catalog receipt](spec/records/2026-10-24-rust-core-search-provider-desktop.md) retains its artifact scope. Later `8fd7b926` library compatibility is separate.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Latest native core dependency compatibility | Desktop `df16e136` passes both exact file-service cases and strict normal/e2e all-target Clippy against [the latest core including the installer repair](spec/records/2026-10-24-rust-http-database.md). This is shared-library compatibility; Tauri database adoption remains pending. Earlier [vault lifetime](spec/records/2026-10-24-rust-core-vault-database.md) and [model/cache](spec/records/2026-10-24-rust-core-model-cache-desktop.md) receipts retain their source and archive scope.                                                                                                                                                                                                                                                   |
| Earlier database compatibility              | [State/history](spec/records/2026-10-24-rust-core-database-catalogue-desktop.md), [indexed metadata](spec/records/2026-10-24-rust-core-database-indexed-desktop.md), [projection writes](spec/records/2026-10-24-rust-core-projection-desktop.md), [single-row reads](spec/records/2026-10-24-rust-core-projection-row-desktop.md), [projection queries](spec/records/2026-10-24-rust-core-projection-query-desktop.md), [memory storage](spec/records/2026-10-24-rust-core-memory-storage-desktop.md), [Search storage/preparation](spec/records/2026-10-24-rust-core-search-desktop.md) and [Search retrieval](spec/records/2026-10-24-rust-core-search-retrieval-desktop.md) retain their exact source/consumer revisions in the linked records. |

The [desktop review](docs/rust-core-desktop-review.md) retains existing public
Agent/Repository screens and teardown barriers. Desktop M15.1 remains In progress
under E-SHARED-007; its matrix/bundle/catalog and original M10/provider gates have
not been completed by the Rust source work.

Desktop [M11 distribution is Deferred](spec/records/2026-10-24-desktop-distribution-deferral.md)
until explicitly resumed, recorded in Desktop `24057694` / E-PLAN-006. Its original
distribution/platform gate and M10 prerequisite remain; M12 stays Planned and
depends on M11. The shared Rust R0–R7 plan remains active, including its separate
hosted acceptance and Linux packaging gates.

Committed hosted branch `593abc65` contains additional H03/H04 and H05 foundation
evidence not integrated in this default. Its unfinished accepted-work change
`vlvosxvo` remains preserved in the `hosted-services` workspace. It is not a
production prerequisite or qualified implementation of R2.

The [Problems quick-fix writer source repair](spec/records/2026-10-24-problems-quick-fix-persistence.md)
also passes its source suites and 261 Storybook cases; native consumer adoption
remains separate.

**Deferred/outside this plan:** Docker execution, multi-user collaboration,
hosted terminals, an OS daemon and the deferred AgentStore/ThreadStore experiment.
Publication, deployment, signing and installed-app replacement retain their
separate authorization/distribution gates.

## Hosted AI and history parity (2026-10-21)

This retained Node roadmap is superseded for future implementation by R0–R7.
Its qualified serving baseline and reusable contracts remain retained evidence.

The agreed [implementation plan](AI_HISTORY_PARITY_PLAN.md) targets one owner,
multiple managed vaults and host agent execution first. All memory is
vault-visible. Docker execution is deferred behind a shared execution port.
This is the historical Node ledger; current completion is tracked by R0–R7
above. Records distinguish source, native, browser, real-provider and platform
qualification.

| Slice                             | Status   | Next gate / evidence                                                                                                                                                                                |
| --------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H00 Plan and ledger               | Complete | Saved full scope, architecture, invariants and ordered gates; [document evidence](spec/records/2026-10-21-hosted-ai-history-plan.md).                                                               |
| H01 Current Node baseline         | Complete | [H01 evidence](spec/records/2026-10-21-node-current-integration.md): 20 check/test tasks, 11 build tasks, 261 catalog cases, 12 Web/PWA cases, Node24 hosted browser and native worker smoke pass.  |
| H02 Shared history service / IPC  | Complete | [H02 evidence](spec/records/2026-10-21-private-history-companion.md): neutral service f58b9363; 5 native IPC cases, 4 supervisor cases and Node24 smoke pass. Desktop intake f8f3446e is qualified. |
| H03 Hosted history / restore      | Pending  | H03.1 authenticated read transport; H03.2 shared presentation and backup; H03.3 guarded restore and two-browser recovery.                                                                           |
| H04 Shared ACP / host backend     | Pending  | Extract native service and qualify execution lifecycle without Tauri.                                                                                                                               |
| H05 Headless hosted conversations | Pending  | Real read-only turn survives disconnect; reconnect/restart never replay.                                                                                                                            |
| H06 AI changes / mutation tools   | Pending  | Baselines, Changes, native receipts and guarded undo precede writes.                                                                                                                                |
| H07 Markdown memory               | Pending  | Share dated vault notes, provenance, forget, recall and move recovery.                                                                                                                              |
| H08 Progressive imports           | Pending  | Codex/Cursor/OpenCode final fences, cancellation and dedup.                                                                                                                                         |
| H09 Forge / transfer / Compute    | Pending  | Explicit upstream and model lifecycles with independent native gates.                                                                                                                               |
| H10 Parity qualification          | Pending  | Full affected desktop/hosted, accessibility and real-provider lanes.                                                                                                                                |
| H11 Docker execution              | Deferred | Add an adapter later; no initial container dependency.                                                                                                                                              |

The qualified Node port remains the serving baseline. The Deno desktop remains
superseded and frozen. Remaining hosted history and AI work follows R0–R7 above;
the H03–H10 rows retain the earlier roadmap rather than a second active sequence.
The implementation request does not authorize release, signing or deployment.

Unified history Search: the App-owned result-provider API is implemented and source-qualified (LN-SRCH-051). Search UI federation, native indexing and Desktop integration remain in progress; this does not complete the Desktop M14.6 native gate.

Shared dark search-highlight contrast is source-qualified with 1,734 unit cases
and 261 catalog cases (LN-UI-020); see [source evidence](spec/records/2026-10-17-search-highlight-contrast.md).

Desktop M9/M9.1 signed plugin lifecycle is complete (LN-PLUG-116–121).
Source safety and the real retained Plugins/Settings flow pass all qualification:
1,734 source tests, 259 source catalog cases, 13 Web/server cases, 113 cold native
cases and 84 desktop catalog cases. The ordinary ARM64 app excludes acceptance
trust/hooks and bundled Node/Deno. See [native evidence](spec/records/2026-10-17-native-plugin-lifecycle.md).
Desktop continues with M10 native ACP/AI; signing and publication remain deferred.

Public plugin Settings now retains App Shell source controls alongside Lapis
static plugins (LN-PLUG-008). The exact regression, full source lanes, 259
catalog cases and 13 cold Web/server cases pass; native archive acceptance
remains separate. See
[source evidence](spec/records/2026-10-17-managed-plugin-settings.md).

Session popup workspace support (Desktop M7.2) is qualified. Live projection
preserves leaves and editors, the shell accepts a host policy, and all 10
workspace pointer cases plus 258 interaction/accessibility cases pass. Native
admission remains M7.3; see
[the source record](spec/records/2026-10-16-popup-workspace.md).

Explorer attachment dropping now uses admitted FileManager new-file creation with bounded sequential binary reads, filename validation and existing App notices. Six exact and 37 package cases pass; native consumer and end-of-M7 full lanes remain pending. See `spec/records/2026-10-16-existing-explorer-imports.md`.

Internal file-view projection now queues after FileManager editing guards, preserving clean editor rebinding through rename/move. Seventeen exact and 207 affected API cases qualify the source; native archive acceptance and end-of-M7 full lanes remain pending. See `spec/records/2026-10-16-internal-view-mutation-order.md`.

Living checklist for the minimal Lapis Notes monorepo. Update this file when
intake or UI swap status changes.

## Tauri source support (2026-10-16)

- [ ] Complete deferred imperative-attachment qualification (LN-WS-006/064).
      The exact regression and all 131 workspace / 1,160 API cases pass;
      public API build passes. Consumer and wider source lanes remain pending;
      see `spec/records/2026-10-17-deferred-imperative-attachment.md`.

- [ ] Complete consumer qualification of ordered sync-host initialization
      (LN-DB-047). The exact regression and all 74 affected cases pass;
      [source evidence](spec/records/2026-10-16-sync-host-startup-ordering.md).
      End-of-M7 full qualification remains pending.

- [ ] Complete native system-trash and owned Explorer-action qualification
      (LN-PKG-184, LN-EXP-009); 35 affected API and 31 Explorer cases plus public
      checks/builds pass. [Source evidence](spec/records/2026-10-16-native-system-trash-and-actions.md)
      retains unsupported fallback and separates source checks from actual OS UI.
- [ ] Complete stable tree and App-owned watch qualification (LN-PKG-180 through
      LN-PKG-183, LN-WS-097); [tree](spec/records/2026-10-16-stable-vault-reconciliation.md)
      and [ingestion](spec/records/2026-10-16-app-owned-vault-ingestion.md) records
      retain source cases and public builds. Tauri E-INGESTION-001 separately
      qualifies 17 cold native cases; end-of-M7 full lanes remain pending.
- [ ] Complete exclusive creation/import qualification (LN-PKG-178/179);
      [source creation evidence](spec/records/2026-10-16-exclusive-file-creation.md)
      and Tauri E-CREATE-001 retain successful components. Attachment integration
      and aggregate qualification remain pending.

- [ ] Complete owned notice delivery qualification (LN-WS-096);
      135 affected API and 28 Explorer cases plus public checks/builds pass.
      [Source evidence](spec/records/2026-10-16-owned-notice-projection.md)
      separates this from native OS notifications and deferred full lanes.

- [ ] Qualify protected managed deletion (LN-ARCH-145, LN-EXP-008);
      38 API and 28 Explorer cases plus public checks/builds pass in the
      [source record](spec/records/2026-10-16-managed-file-deletion.md).
      Cold Tauri and end-of-M7 aggregate lanes remain pending.

- [ ] Qualify owned native watcher retirement and App ingestion (LN-PKG-176);
      retirement and registration readiness (LN-PKG-177) have targeted source
      evidence; full lanes remain deferred until
      M7 implementation completes.

- [x] Qualify document-owned API editor baselines, retained text conflicts and
      protected explicit recovery (LN-ARCH-142 through LN-ARCH-144, LN-PKG-169);
      [source acceptance](spec/records/2026-10-16-editor-file-conflicts.md).
- [x] Bind editable Markdown preview writers to the public source-owned
      persistence/recovery contract; final host acceptance is recorded with the
      current slice.
- [x] Qualify Properties/metadata writers (LN-PKG-172);
      [source acceptance](spec/records/2026-10-16-managed-file-mutations.md).
- [x] Qualify serialized configuration changes (LN-PKG-173) and the settings/
      hotkey component of App-owned state writers (LN-PKG-174 remains Partial);
      [component evidence](spec/records/2026-10-16-app-state-writers.md).
- [ ] Finish the complete M4 writer audit, including core/plugin enablement,
      App Shell plugin state and compatibility plugin-data files.
- [ ] Share the existing Deno chooser and branded startup through Workspace,
      qualify the Tauri consumer, and consume verified local archives. Deno
      desktop is superseded and frozen; no further host changes or packaged
      reruns are required. Publication remains deferred to migration completion
      (LN-PKG-171).

## Specification readability and navigation (2026-10-13)

- [x] Split the specification into 172 bounded topic and verification pages,
      preserving all 1,365 original requirements, statuses, and evidence.
- [x] Add SUMMARY-derived Storybook navigation, stable requirement anchors,
      canonical chapter routing, populated outlines, and strict coverage checks.
- [x] Preserve the latest main CI-image snapshots and repair registry-consumer
      pnpm selection and approved dependency builds;
      [published npm acceptance](spec/records/2026-10-13-registry-consumer-toolchain.md) passes.
- [ ] Complete final combined verification in PR CI, including cold development
      and static navigation plus full package and Storybook interaction/axe lanes.
      The [acceptance record](spec/records/2026-10-13-specification-navigation.md)
      distinguishes earlier full passes from final local navigation timeouts.

## Local test caching (2026-10-13)

- [x] Route repository-level test commands and Storybook builds through the bounded
      Turbo runner; package unit tests already use that graph.
- [x] Cover successful cache reuse, source/argument invalidation, failed-result
      reruns, forced execution, and live-configuration cache bypass with small
      fixtures. Keep external-state and mutation tasks uncached.
- [ ] Complete the full suites in PR CI; see the
      [focused acceptance record](spec/records/2026-10-13-local-test-caching.md).

## Portable specification acceptance (2026-10-13)

- [x] Repair PR CI startup after 243 Storybook interaction/axe tests passed:
      development Docs acceptance uses installed packages without requiring
      sibling plugin release artifacts. The exact startup regression passes.
- [ ] Complete development Docs navigation in updated PR CI; see the
      [startup evidence](spec/records/2026-10-13-portable-specification-startup.md).

## Application ownership intake and integration (2026-08-16)

- [x] Review the latest Lapis API, Workspace, Electron, web/PWA, Bases, AI,
      root Storybook, and external CV Roles histories before implementation.
- [x] Rebase the isolated Lapis implementation onto `aee0cc25`, preserving its
      newer AI host, Bases query/editor, embedded Markdown, workspace-history, and
      external Roles integration changes while resolving specification and story
      conflicts against the current contracts.
- [x] Rebase external CV Roles onto `fef50854`; the ownership slice applies
      without content conflicts.
- [x] Inventory ambient App access in core views, editors, command scopes,
      hosts, PWA integration, Storybook harnesses, and CV Roles public surfaces.
- [x] Publish a compatibility bridge while making explicit or owned App state
      authoritative throughout first-party runtime code.
- [x] Migrate Electron, web/PWA, Bases, AI, root Storybook, and the external CV
      Roles runtime/catalog; retain compatibility only for legacy consumers.
- [x] Add fail-closed ambient-App source audits to root check and spec-check,
      plus tracked repository and shared sibling guidance.
- [x] Re-run focused and broad non-visual acceptance after integration into the
      original repositories: Lapis package/root gates, 43 Storybook files / 107
      scenarios, five real pointer tests, four web E2E cases, eight Electron
      smokes, Mira 59 files / 334 tests, and CV Roles package/Storybook/static
      lanes pass. Visual baselines remain unchanged by explicit user request.

## Bootstrap

| Area                                      | Status      | Notes                                                                                                                                                                                                                                               |
| ----------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| pnpm + Turbo scaffold                     | Done        | No multi-script import-resolution gates                                                                                                                                                                                                             |
| Spec governance + validation              | Done        | Modular validation covers canonical Markdown, verification, mdBook output, Storybook consumer source, database ownership, and web-host intake; local QMD discovery remains disposable                                                               |
| Storybook host (port 7010)                | Done        | `API/` verification stories + catalog                                                                                                                                                                                                               |
| Storybook consumer Show Code              | In progress | Panels use layout-derived examples; API and workspace demos expose explicit implementation/consumer source instead of demo invocation; Date Setting still needs a public-boundary example                                                           |
| API Storybook verification + Visual Delta | Done        | Plays green; `visual-pending` PNG baselines generated (review → `visual-approved` later)                                                                                                                                                            |
| Sibling dependency normalization          | Done        | Five root `link:` dependencies + overrides; package exports are authoritative; CodeMirror/Lezer peers are host-owned; focused editor capture restored all links and removed `.deps/` (4 baseline matches, 3 current-sibling mismatches; no updates) |
| `@lapismd/design-core` sibling            | Done        | Root `link:../design-core` + pnpm override; its package-declared source exports remain live; package manifests use portable `*` contracts                                                                                                           |
| `@lapismd/mira` siblings                  | Done        | Root `link:../mira-mde/packages/*` deps + overrides; rebuild Mira to refresh its linked `dist` exports without reinstalling Lapis                                                                                                                   |
| Storybook a11y in Vitest                  | Done        | `vitest.setup.ts` + `a11y.test: "error"`; filled action tokens AA-tuned                                                                                                                                                                             |
| Storybook style authority                 | Done        | design-core styles + lapis theme; ui `theme.css` only (avoid dual Tailwind)                                                                                                                                                                         |
| Storybook Vite config layout              | Done        | `.storybook/vite-final.ts` holds aliases; slim `main.ts` avoids Storybook CJS-scan ReDoS hang on large configs                                                                                                                                      |
| Editor settings parity                    | Done        | Legacy `editor.alwaysFocusNewTabs` defaults off and drives Design Core's created-tab policy; canonical descriptors keep every Editor field description aligned with its schema                                                                      |

## Packages

| Package / area                             | Status       | Notes                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------ | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@lapis-notes/api`                         | Copied       | Kernel from full lapis-notes; scripts slimmed                                                                                                                                                                                                                                                                                           |
| `@lapis-notes/ui`                          | Pruned       | Kept compounds only: modal, confirm-dialog, search, sidebar-custom, table-dnd + helpers                                                                                                                                                                                                                                                 |
| `@lapis-notes/workspace` shell integration | Done         | Public thin design-core host; portable api compatibility + persistence façade                                                                                                                                                                                                                                                           |
| `@lapis-notes/web`                         | Done         | Legacy `8ec68e18` PWA intake; browser-owned vault/session boot and cross-tab Turso coordination pass focused browser acceptance                                                                                                                                                                                                         |
| `@lapis-notes/desktop-electron`            | Removed      | Retired on 2026-08-23; no Electron package, runtime target, native database provider, root script, or distribution dependency remains.                                                                                                                                                                                                  |
| `@lapis-notes/desktop-deno`                | Done         | Sole native desktop host: Deno 2.9.5+, WASM Turso, canonical plugins, native Markdown diagnostics, file watching, verified assets, agents, Sigma PTY terminals, lifecycle, and macOS/Linux distribution.                                                                                                                                |
| `@lapis-notes/markdown`                    | Done (slice) | Authorized plugin; Mira document render + public app-only panels including Tags; Obsidian-compatible panel IDs retain load aliases for prior Lapis layouts                                                                                                                                                                              |
| `@lapis-notes/language-service`            | Done         | Provider-neutral Markdown client/worker supplies open-document diagnostics and cached actions                                                                                                                                                                                                                                           |
| `@lapis-notes/markdown-lint`               | Done         | Enabled core plugin selects the probed native service or worker fallback and preserves configured rules, fixes, and ignores                                                                                                                                                                                                             |
| `@lapis-notes/lapis-plugin-cv-roles`       | Done         | Clean rename and vault workflows plus the legacy Applications, Activity, Actions, ticket-card, and role-detail component/CSS presentation are complete. Lapis owns the shell and vault/Mira adapters; Tasks and AI remain excluded. Fixed-profile browser review passed, with visual baseline work deferred at user request.            |
| `@lapis-notes/ai`                          | In progress  | Bundled provider-agnostic AgentRuntime, host-gated live adapters on `./runtimes`, Codex and Cursor via ACP, Fake without a host, a Design Core chat panel, folder Agent Skills, and composer slash commands; CV-domain MCP tools remain outside this package                                                                            |
| `@lapismd/ai-host`                         | Done         | Sibling process host at `../ai-host`: acpx executor, `lapis-ai-host serve`, required WebSocket token handshake; Deno desktop uses the library in-process; Development Storybook `Plugins/AI/Live Host` uses URL and token; PWA attachment is retired by the native desktop migration. Host-owned requirements live in the sibling spec. |
| `@lapismd/terminal-host`                   | Done         | Sibling Deno PTY host at `../terminal-host`: Sigma FFI interactive shells, `lapis-terminal-host serve`, token handshake; Deno desktop embeds the shared service and web attaches with URL and token.                                                                                                                                    |
| `@lapis-notes/lapis-plugin-terminal`       | In progress  | Sibling plugin with `terminal` view, Open/New Terminal, bottom-panel default, Fake sessions. Package Storybook placements remain planned.                                                                                                                                                                                               |
| `@lapis-notes/lapis-plugin-tasks`          | In progress  | Sibling plugin, planner view, and Design Core catalog. Desktop and web hosts register the plugin class.                                                                                                                                                                                                                                 |
| `@lapis-notes/lapis-plugin-docs`           | In progress  | Sibling Core Docs plugin with exclusive `*.doc.md` file views, ported rich display/forms/cards/review, and library leaf. Desktop and web hosts register the plugin class. Coding practice deferred.                                                                                                                                     |
| Notebook / remaining unlisted plugins      | Not started  | Remain blocked by LN-PKG-004 until separately specified                                                                                                                                                                                                                                                                                 |
| `@lapis-notes/file-explorer`               | Done         | Reusable File Explorer plugin shared by Storybook and Deno desktop; single-click current/reuse, double-click reuse-or-create, and Command-click forced creation map to API workspace leaves; source-editor remains a Storybook-local fixture                                                                                            |
| `@lapis-notes/bookmarks`                   | In progress  | Enabled-by-default bundled Bookmarks panel persists application-local `.lapis/bookmarks.json` for file, folder, group, search, url, and graph items; default left sidebar after Search. Visual baselines remain `visual-pending`.                                                                                                       |
| `@lapis-notes/search`                      | Done         | Grouped-tree Search, settings, semantic retrieval, and cross-tab execution are shared by Storybook, Deno desktop, and web hosts                                                                                                                                                                                                         |
| `@lapis-notes/graph`                       | In progress  | Bundled default-enabled global and local Graph preserves the legacy component topology and renderer while using indexed metadata, Design Core controls, scoped graph tokens, and governed App-backed Storybook panels; it creates no default leaf.                                                                                      |
| `@lapis-notes/history`                     | In progress  | Enabled-by-default file-history plugin captures vault revisions through AppDatabase, exposes a movable History panel, and compares through Design Core FileDiff / MergeEditor. Visual baselines remain `visual-pending`.                                                                                                                |
| `@lapis-notes/wordcount`                   | Done         | Enabled-by-default status-bar word and character count over the API status-bar contract. Design Core F-Mode is included on the default shell and disabled until the user enables it.                                                                                                                                                    |
| `@lapis-notes/spellcheck`                  | Done         | Enabled-by-default Harper diagnostics through the language-service and Problems path, Lucide status item, and Settings for dialect, rules, and file types. The editor-demo misspelling story stays `visual-pending` without a captured baseline.                                                                                        |
| `@lapis-notes/pdf`                         | In progress  | Authorized by LN-PKG-004. The Storybook file view, note embed, and dark-page inversion setting live in `lapis-plugins/spec/src/plugins/pdf/index.md`. Host profiles and native resource URLs stay deferred.                                                                                                                             |
| `@lapis-notes/csv`                         | In progress  | Authorized by LN-PKG-004. The Storybook table view and note embed live in `lapis-plugins/spec/src/plugins/csv/index.md`. Source highlighting, lint, drag, undo, settings, registry screenshots, host profiles, and native viewing stay deferred.                                                                                        |
| `@lapis-notes/source-editor`               | Done         | Enabled-by-default production source editor shared by desktop, web, and Storybook for text, JSON, YAML, and YML; Markdown remains owned by `@lapis-notes/markdown`.                                                                                                                                                                     |
| `@lapis-notes/bases`                       | Done         | Legacy revision `8ec68e18` runtime and native presentation pass 20 test files / 161 tests, focused Storybook and pointer coverage, desktop and web persistence acceptance, and root check/test/build. Visual baselines remain deferred by request.                                                                                      |
| design-core workspace engine               | Done         | Consumes public workspace APIs; shared stacked-pane width fixed at the design-core source                                                                                                                                                                                                                                               |

### App database replacement progress

- [x] Canonical provider, Turso, capability, and cross-tab requirements
- [x] Provider-neutral descriptor, capability, factory, and vault-session contracts
- [x] Turso native and WASM drivers with normalized generated-state persistence
- [x] Turso full-text, vector, hybrid, and local embedding execution
- [x] Remove legacy SQLite, sqlite-vec, and IndexedDB app-database implementations and dependencies
- [x] Retire the native desktop database proxy; Deno desktop uses the WASM provider
- [x] Generic Web Locks and BroadcastChannel owner/proxy coordination
- [x] Block unsupported production runtimes instead of opening a non-Turso database
- [x] Replace production `app_state` hydration and whole-database rewrites with direct row-scoped Turso SQL
- [x] Serve metadata, tags, properties, and links through paginated indexed queries and revisioned change sets
- [x] Retain synchronous metadata maps only under bounded legacy-plugin compatibility leases
- [ ] Pass the 50,000-note native/WASM warm-start and query performance gate

### Archived Electron desktop host intake

This historical intake was retired on 2026-08-23. The package and its runtime,
storage, build, and distribution paths are removed; the checklist below records
superseded acceptance rather than current architecture.

Source: `/Users/stevejuma/code/lapis-notes/packages/desktop-electron` at
legacy commit `8ec68e18`.

- [x] Canonical desktop-host requirements, package authorization, verification mapping, and source provenance
- [x] Private `@lapis-notes/desktop-electron` package scaffold at version `2026.31.5`
- [x] Electron lifecycle, context-isolated preload, native menus, app URLs, window chrome, and bounded IPC
- [x] Native folder/profile bootstrap, filesystem/resource access, database/search, watches, notifications, and file actions
- [x] Markdown-only native language-service sidecar
- [x] Community-plugin sidecar, capability broker, and verified plugin asset protocol
- [x] Empty native-vault `WorkspaceShell` boot, persisted layout, reopen, fallback, switching, and teardown
- [x] macOS arm64/x64 local packaging, icons, entitlements, credential-safe signing/notarization hooks, and packaged smoke
- [x] Local-only macOS artifact manifest with sizes, SHA-256 checksums, and blockmap metadata
- [ ] Linux x64 AppImage/tar production and smoke on a Linux builder
- [x] Focused package, Electron, and macOS distribution validation
- [x] Root specification, check, test, and build validation
- [x] Focused `Workspace/Shell / PersistedDesktop` Storybook interaction and accessibility validation
- [x] Replace the temporary handwritten landing page with the branded `8ec68e18` native launcher while keeping demo seeding pruned
- [x] Load the production Design Core stylesheet pipeline and Lapis aliases in Electron
- [x] Match the default empty-vault shell: File Explorer then Search on the left, Outline / File Properties / Tags on the right, bottom closed
- [x] Route native “Open Vault…” through the launcher after orderly session teardown
- [x] Restore the legacy footer vault switcher with recent selection and “Manage Vaults” launcher return
- [x] Center native loading, restore compact launcher overlays, and reserve macOS traffic-light space through desktop CSS classes
- [x] Replace the session-boot stub with Design Core `WorkspaceStartup` and restore Design Core window-drag regions
- [x] Serve variable-font assets from the resolved linked Design Core package during desktop development
- [x] Load Markdown (including Tags), Markdownlint, and File Explorer before layout restoration; recover previously unavailable view placeholders when their implementation now exists
- [x] Load Search before layout restoration; restore canonical `search` leaves and execute queries through the native app database
- [x] Preserve a larger macOS traffic-light inset for the expanded left sidebar without changing the collapsed control geometry
- [x] Replace renderer database mirrors with window/vault-owned native Turso handles behind a bounded typed RPC allowlist
- [x] Serve packaged renderer assets from isolated `lapis-app://app/` with COOP/COEP and retain Turso WASM assets for Intel macOS
- [x] Full Storybook suite: 43 files / 107 interaction and accessibility scenarios pass, including Bases, CV Roles, application ownership, Markdown authoring/problems/frontmatter, and Outgoing Links geometry.
- [ ] `PersistedDesktop` Visual Delta comparison: blocked because Docker Desktop cannot start; no baseline was updated

Intentionally pruned: notebook/DuckDB, TypeScript-only language-service paths,
demo-vault seeding, bundled-plugin startup/build steps, the legacy full app
bootstrap, Windows targets, and remote release publication.

### Deno desktop host progress

Deno `deno desktop` is the sole native desktop host; web remains the browser
production host.

- [x] Canonical desktop-deno-host requirements, package authorization, verification mapping, and MIGRATION intake
- [x] Limit `NativeDesktopRuntime` to `deno-desktop` and route the app database to WASM Turso
- [x] Private `@lapis-notes/desktop-deno` package at version `2026.31.5`
- [x] Deno window, `win.bind()` bridge, vault-root FS, bootstrap KV, and path-prompt vault open
- [x] WorkspaceStartup then WorkspaceShell with initial Markdown and File Explorer
- [x] macOS full-bleed `transparentTitlebar` window with native traffic lights and Design Core drag markers
- [x] Register the complete canonical first-party plugin inventory and ordering
- [x] Add database/search, native language, verified plugin assets, watch, and agent capability parity
- [x] Keep community plugin sidecars explicitly unsupported until a public Deno host exists
- [x] Add Deno terminal capability parity through the shared Sigma PTY host
- [x] Add platform-exact macOS notifications and macOS/Linux file open/reveal actions
- [x] Add full native menus, bounded renderer close handshake, and system-browser external-link policy
- [x] Add single-instance app URL registration, authenticated handoff, queued renderer delivery, and later-launch focus
- [x] Keep real workspace popouts explicitly unsupported
- [x] Add versioned macOS app/ZIP and Linux arm64/x64 AppImage/tar artifacts, stable icons, verified PTY libraries, and credential-safe signing hooks
- [x] Complete three-target native Homebrew qualification and first desktop release; Intel macOS deferred (Turso native addon unavailable) (LN-DENO-079–083)
- [x] Run Linux packaged acceptance on Ubuntu 24.04 ARM64 and x86-64 builders
- [x] Focused package checks, production Vite build, macOS app packaging, and full saved-vault/plugin boot smoke

Intentionally out of scope: community plugin sidecars, real workspace popouts,
Windows distribution.

### History plugin intake progress

Source: `/Users/stevejuma/code/lapis-notes/packages/plugins/plugin-history`
adapted for the current App, Design Core diff surfaces, and VS Code-like caps.

- [x] Canonical `LN-HIST-001` through `LN-HIST-011`, host/catalog requirements, verification mappings, and spec-first routing
- [x] Reusable `@lapis-notes/history` package with `history` command view and internal `history-compare`
- [x] Vault-event capture with 256 KiB / 50-revision caps, 10s merge window, and glob excludes including `.jj`
- [x] Design Core History settings section for exclude/include globs, tracked extensions, and capture caps
- [x] Design Core FileDiff for previous and selected-pair compares; MergeEditor one-way for the live file
- [x] Select for compare / Compare with selected timeline actions
- [x] Deno desktop, web, and Storybook host registration enabled by default
- [x] Six governed Storybook placements, compare story, and History Shell Desktop/Mobile
- [ ] History panel Visual Delta capture/review; stories remain `visual-pending` and no baseline is updated in this slice

### Application-tool MCP bridge progress

Transport-neutral app tools on the owning App, with AI policy snapshots and an
AI Host-owned `lapis-tools` MCP bridge. Canonical IDs: `LN-AI-086`–`LN-AI-095`,
`LN-SRCH-039`, `LN-DENO-027`, `LN-CAT-081`, `LN-PKG-080`. Delivery evidence:
[`spec/records/app-tool-mcp-bridge.md`](spec/records/app-tool-mcp-bridge.md).

- [x] Canonical requirements, ownership chapters, verification mappings, and spec-first routing
- [x] API registry, trusted scopes, and plugin lifecycle
- [x] AI snapshots, master enablement, per-tool opt-ins, approvals, and transcript projection
- [x] Search `notes_search`, Markdown `notes_list`, and API `read` / `write` / `edit` / `apply_patch` over `@lapismd/ai-host/file-tools`
- [x] AI Host stdio MCP shim, loopback broker, protocol v3, ACP, Codex Native, and authenticated remote WebSocket
- [x] Five governed app-tool Storybook scenarios with approved canonical baselines
- [x] Rebased onto History settings so Workspace Shell asserts the seven bundled plugins from `LN-CAT-077`
- [x] Full Electron `package:dir` lane: renderer Vite includes the Turso WASM bundle; unpacked app ships an executable `mcp-shim.mjs`
- [ ] Live paid-agent probes (`pnpm ai:smoke:probe:*`, Live Host, desktop smoke): 2026-08-17 rerun — harness 3/3; Codex ACP catalog (7) then Internal error on `notes_search`; Cursor ACP catalog (35) then `notes_read` omitted; Codex Native catalog (7) then usage limit. Storybook/desktop UI checklists not completed. Automated Live Host ReloadResume play covers restore-before-resume without a live prompt.

### Native app-owned AI memory

Canonical IDs: `LN-AI-179`–`LN-AI-190`, `LN-DB-040`–`LN-DB-044`,
`LN-ARCH-083`.

- [x] Canonical ownership, evidence, scope, retrieval, consolidation, and migration requirements
- [x] Typed disposable AppDatabase memory state and provider parity
- [x] Message-granular episodic projection and scoped memory tools
- [x] Human-readable curated records, preimages, review, and supersession
- [x] Background candidate ingestion, consolidation, and scheduling
- [x] Bounded automatic recall, provider-neutral context projection, and
      restricted processor isolation
- [ ] Configured-host Codex and Cursor memory-tool/recall smoke plus warmed
      50,000-message performance acceptance

### Agent skills and composer slash commands

Canonical IDs: `LN-AI-110`–`LN-AI-119`, `LN-AI-126`–`LN-AI-130`,
`LN-AI-134`–`LN-AI-146`, `LN-SRCH-040`, `LN-PLUG-022`, `LN-PLUG-023`,
`LN-ARCH-064`, `LN-PKG-096`, `LN-CAT-087`, `LN-CAT-089`.

- [x] Canonical requirements and verification mappings
- [x] Folder skills, compact manifests, `skills_read` / `skills_resource`, and Fake activation
- [x] Composer slash router, reserved commands, and AppToolHost tool dispatch
- [x] Plugin skill-root and slash-command registration
- [x] Native ACP command catalog and explicit skill refresh
- [x] Live ACP session setup for a path-free `available_skills` manifest
- [x] Reserved `/agent` and Storybook extension `/open-daily-note` unload
- [x] First-slice host commands `/help`, `/scope`, and `/context`, Search-owned `/search`, and bundled `/research`
- [x] Session bootstrap, bundled `lapis-notes`, folder `AGENTS.md`, richer `/context`, and the AI catalog panel

### Search plugin intake progress

Source: `/Users/stevejuma/code/lapis-notes/packages/plugins/plugin-search` at
legacy commit `8ec68e18`.

- [x] Reusable `@lapis-notes/search` package with canonical `search` view and commands
- [x] API `AppDatabase` indexing for Markdown/Canvas, stale pruning, and reactive refresh
- [x] Public lifecycle-managed search-document providers with built-in Markdown/Canvas and external Roles CV projection
- [x] Design Core `SearchFilterBar` with the API CodeMirror query language, diagnostics, completions, help, and facets
- [x] Collapsible file/match result tree with highlighted ranges, sorting, bounded recent searches, and workspace navigation
- [x] Persisted Match case, Collapse results, Show more context, Explain search terms, and structured-semantic toggles inside the single Search Filter Bar disclosure
- [x] Retrieval-mode facet, result badges, copy, semantic provider settings, status, and rebuild
- [x] Disabled-by-default Transformers.js activation with real model download/cache smoke and Electron-main CPU adaptation
- [x] Owner/proxy semantic configuration, rebuild, status, vector query, promotion, and reload acceptance
- [x] Compact Design Core command-picker facets for file type and retrieval mode
- [x] Legacy-aligned inset result geometry with transparent top-right counts, bottom-left metadata, and unindented bordered child surfaces
- [x] Surface-aware Search summary controls and metadata badges, with the redundant panel semantic-status tag removed
- [x] Stable incremental before/after match context, primary and contrasting secondary Search result surfaces, public yellow highlight tokens, faint sans-serif counts, and body-hosted Search preservation during result navigation
- [x] Compact regular-weight Search result filenames with full path and retrieval metadata inside expanded bodies
- [x] Recent searches use the standard result inset so labels and interactive row paint remain clear of panel edges
- [x] Six governed Storybook placements over the indexed in-memory vault
- [x] Tags and All Properties command-only query handoffs
- [x] Electron registration before metadata/layout load plus native persisted-view/result acceptance

### Graph plugin intake progress

Source: `/Users/stevejuma/code/lapis-notes/packages/plugins/plugin-graph`.

- [x] Preserve `@lapis-notes/graph`, `lapis-graph`, `graph`, `graph-local`, commands, and persisted settings identity
- [x] Copy the legacy component topology, controls, canvas renderer, navigation, and settings without redesign
- [x] Replace legacy utilities with Design Core controls, semantic CSS, data markers, and scoped `--ui-graph-*` tokens
- [x] Build global and local graphs from paged indexed metadata and bounded link queries
- [x] Open Search with the normalized tag query through `search:open-search`
- [x] Register Graph after Search and before Bookmarks without a fresh-layout leaf
- [x] Add governed global and local Graph panel families in all six placements
- [ ] Record human-reviewed Visual Delta baselines
- [ ] Search panel Visual Delta capture/review; stories remain `visual-pending` and no baseline is updated in this slice

### Bases plugin intake progress

Source: `/Users/stevejuma/code/lapis-notes/packages/plugins/plugin-bases` at
legacy revision `8ec68e18`.

- [x] Canonical `LN-BASE-001` through `LN-BASE-012`, host/catalog requirements, verification mappings, and spec-first routing
- [x] Buildable `@lapis-notes/bases` package scaffold with explicit root and stylesheet exports
- [x] Port 14 legacy test files and retain the 142-test behavioral baseline (20 files / 161 tests with current regressions)
- [x] Replace pruned UI imports with public Design Core primitives and Bases-owned compounds
- [x] Replace Tailwind utility markup with semantic native CSS and `--ui-bases-*` tokens
- [x] Inject `App` through the surface/controller hierarchy; serialize writes and flush on teardown
- [x] Register optional bundled Bases in Electron, web, and root Storybook before metadata/layout restoration
- [x] Verify persisted missing-view recovery without changing plugin data or `.base` content
- [x] Add focused public view/workflow stories and real-App file, embed, and disable/restore stories
- [x] Run package, focused Storybook, pointer, Electron, web, specification, and root check/test/build acceptance; keep visual capture and approval deferred by request

Pending parity gaps intentionally retained by this port: a real map capability;
complete Obsidian value wrappers and method-style formula semantics; `this`
binding and richer file/link behavior; deeper grouped and summary semantics;
the duplicated compatibility/runtime model and stub formula evaluation; and
name-level parity reporting that does not prove behavior. Tasks-owned layouts,
notebook integration, community installation, and broader Obsidian parity are
outside this intake.

### Web host intake progress

Source: `/Users/stevejuma/code/lapis-notes/packages/web` at legacy commit
`8ec68e18`.

- [x] Canonical web-host requirements, package authorization, and provenance
- [x] Private `@lapis-notes/web` package at version `2026.6.3`
- [x] Branded OPFS and File System Access vault launcher and session host
- [x] Current core plugin boot before metadata and layout restoration
- [x] PWA manifest, icons, prompt updates, isolation, and verified asset cache
- [x] Real owner/proxy database status, delegation, and promotion
- [x] Two-tab Playwright acceptance and root web scripts

### Markdown plugin intake progress

Canonical Markdown requirements span `spec/src/plugins/markdown/index.md`, its nested
`spec/src/plugins/markdown/panels/` pages, and the shared movable-panel contract
in `spec/src/workspace-shell/panels.md` (LN-MD-001 through LN-MD-035). Parity
detail lives in `packages/plugins/plugin-markdown/PARITY.md`.

- [x] Package scaffold + workspace wiring (`@lapis-notes/markdown`)
- [x] Canonical panel documentation split into one page per panel beneath Markdown Plugin / Panels, with reusable surface and catalog guidance owned by Workspace Shell / Panels
- [x] Mira-owned markdown document modes (`source` / `live-preview` / `preview`)
- [x] Path A / Path B editor extension reload + host editor events preserved
- [x] Markdown settings section (Mira features, mermaid, AI stub)
- [x] Side panels: All Properties, File Properties, Outline, Backlinks, Outgoing Links, Media; Outline and link panels carry the full observable interaction/data slice
- [x] Declarative panel-command registry covers All Properties, Outline, File Properties, Backlinks, Outgoing Links, and Tags; commands reveal moved leaves or create the canonical right-side view, while file-backed views retain editor associations and aliases reuse canonical commands
- [x] Shared `MarkdownSidebarPanel` recipe (LN-MD-018, LN-MD-032 through LN-MD-035) + Markdown-owned Tags view; all movable panels are full-width/titleless with workspace-family 0.75rem list/result controls, and design-core `WorkspaceViewHost` resolves public view paint tokens with a white body/bottom/group default and sidebar paint only for ungrouped top-level side panels; Lapis contains no placement selectors
- [x] Metadata write contract + type widgets + `trackChanges` / `types.json` demo seeds
- [x] File Properties → Mira `FrontmatterEditor` + Lapis `MetadataTypeManager` adapter, no-overflow narrow single-column rows with label-aligned values, native focus geometry with view-token contrast fill, hash Tags icon, and surface-contrasting native pills (LN-MD-017/019)
- [x] Markdown frontmatter integration → public Mira source decorations, Source Code Pro YAML source, Mira-only inline fold controls, working rendered disclosure, and unpadded content-aligned embedded preview (LN-MD-025)
- [x] Complete Mira authoring composition → public base-free factory inside the API editor shell, selection tools, draggable block handles, slash commands, tables, images, completions, smart paste, extension lifecycles, truthful typed settings, optional edit-only top toolbar, and opt-in Doodle Dividers (LN-MD-071 through LN-MD-075)
- [x] Compact Mira feature settings → the 20 capability descriptors retain flat dotted keys/defaults/runtime gates while design-core renders their explicit labels and descriptions in a presentation-only Features toggle table (LN-MD-082/083, LN-ED-042)
- [x] Markdown mode chrome → API-to-design-core projection of compatibility view actions and pane menus; full-repo book-open/pencil mode actions, modifier split behavior, Reading/Source menu toggles, and registered Markdown provider items (LN-MD-076/077, LN-ED-038/039)
- [x] Reusable embedded editor → public API surface composes registered language/view extensions with flushable host-owned persistence and a source-only fallback; Markdown consumes the same surface used by external plugin pages (LN-ED-050/051, LN-MD-090)
- [x] Domain-file Markdown delegation → public serialized return targets let external previews hand a leaf to bundled Markdown Live Preview and restore the originating view; the external Roles package owns rich source and Description acceptance (LN-ED-052, LN-MD-091)
- [x] Markdown view-menu and Reading polish → borderless Mira Reading shell, View-first mode and toolbar controls, plus persisted toolbar indentation settings (LN-MD-078 through LN-MD-081, LN-ED-040/041)
- [x] Mira-backed embed framework → app-bound `MiraFileAdapter`, public `FileEmbed` / `MarkdownEmbed` / `NoteLink` plus `./embed`, shared document and Design Core Hover Card link-panel previews, vault-relative resolution, refresh/navigation, image and registered custom-embed lifecycle (LN-MD-026)
- [x] Ordinary Mira internal-link previews → linked source-owned Bits UI `LinkPreview`, owner-document portal, collision-aware viewport geometry, active appearance, and topmost cross-pane paint without a Lapis wrapper (LN-MD-027)
- [x] Editable note hover previews → Lapis vault-backed `writeMarkdown`, automatic ordinary-link editing, opted-in Backlinks/Outgoing `FileEmbed` editing, 500ms serialized autosave, dirty-error retention, and read-only direct embeds (LN-MD-028)
- [x] Minimal editable preview cards → no resolved filename/path chrome or panel embed guide, disclosure-safe all-round padding, sticky top-right open action, two-pixel editing border, CodeMirror-owned edit scrolling, hover/focus pinning, and persistence-safe outside-click dismissal (LN-MD-029)
- [x] Unified editable preview appearance → inherited Mira portal theme, explicit panel FileEmbed theme, Lapis-aligned Mira accent aliases, and preview padding isolated from live-edit frontmatter (LN-MD-030)
- [x] Focused `Plugins/Markdown/Panels/<Panel>/*` interaction stories: six movable surfaces for All Properties, File Properties, Outline, Backlinks, Outgoing Links, and Tags; file-scoped stories keep one minimal active note and vault-wide stories stay document-free
- [x] Real app-only component metadata with no kind/layout harness controls; real bottom/sidebar groups, stable ViewHost paint assertions, isolated 700px padding-free Docs previews, and explicit persisted-layout Show Code
- [x] Linked Mira package exports + CodeMirror/Lezer dedupe; ignored `.deps/*` staging remains Docker-only
- [ ] Markdown panel Visual Delta capture/review; all placement stories declare independent pending paths, but this slice intentionally generates or updates no PNGs
- [x] File Properties vault-wide value suggestions and wikilink pills through Mira `valueSuggestions` plus the Lapis file adapter
- [x] Metadata parse worker plus status-bar progress projection for cache load, rebuild, and vault reconcile
- [ ] Heavy type widgets remain deferred

### Workspace shell integration progress

- [x] Generic Problems integration → design-core diagnostics façade, plugin-owned collections, open-document language-service bridge, diagnostics-only Markdown composition, Markdownlint provider, navigation/actions with open-editor/vault parity, aligned severity gutter glyphs, compact hover cards with stable origin handoff, styled inline problem expansion with clean hover recovery, transient tree/table presentation with shadcn two-axis scrolling, a live count in the owning leaf badge, an inline severity-filter menu, a leaf-owned title with right-aligned toolbar controls, and runnable editor acceptance (LN-WS-025 through LN-WS-048)
- [x] Problems reload restores only persisted leaves; Show Problems and a status-bar count chip reveal or create the default bottom tab (LN-WS-030, LN-WS-069)
- [x] Editor-demo Markdownlint loft-boarding story seeds the long-form note, reveals Problems, and asserts unique code-and-range diagnostics (LN-ED-057)
- [x] Markdownlint editor defaults disable MD013/line-length to match vscode-markdownlint (LN-WS-066)
- [x] Markdownlint Settings seed disabled rules and include/exclude globs for open documents (LN-MDL-001 through LN-MDL-003, LN-ED-058)
- [x] Markdownlint Problems listings use vscode-style rule-path messages, publish rule documentation URLs, and copy tree items or groups as JSON (LN-MDL-004, LN-WS-029, LN-WS-067)
- [x] Diagnostic hover cards keep unique action keys when titles repeat, and cached language-service actions stay scoped to the originating diagnostic with one action per title (LN-PKG-082, LN-WS-056)
- [x] Editor-demo runtime teardown synchronously unloads and destroys retained editors before asynchronous plugin/controller disposal, preventing HMR from accumulating Mira portal hosts (LN-WS-019, LN-ED-009)
- [x] API editor note-column ownership neutralizes linked Mira's inherited outer-sizer constraint before applying file margins, preserving the 700px readable body when sidebars close (LN-ARCH-037, LN-PKG-048, LN-ED-046)
- [x] Full-shell `Workspace/Shell`, `Workspace/Lapis Editor Demo`, and panel Autodocs share an isolated 700px padding-free application viewport; authored shell pages render every canonical story description
- [x] Canonical requirements and governance mapping
- [x] Api-owned design-core controller and compatibility projection
- [x] Host-only `@lapis-notes/api/workspace-host` export
- [x] `@lapis-notes/workspace` package
- [x] Persisted desktop and mobile Storybook stories
- [x] Interaction, accessibility, build, and visual verification
- [x] Full-viewport desktop/mobile parity, Lapis About/version chrome, and notifications presentation
- [x] Empty-view stacked-tab overflow parity with design-core
- [x] Floating-window controls use design-core panel-action hover tokens and consumer Storybook verification
- [x] Top/stacked pane maximize toggles, compact reserved top-tab actions, and conforming floating-window maximize/minimize icons from design-core
- [x] Design-core V3 bottom panel preserved through the api compatibility façade and workspace writer
- [x] Focused bottom-panel/settings Storybook scenario with live shell-setting verification
- [x] API-registered story views visibly consume the live inline-title appearance setting

## UI → design-core

Styling target: native CSS, `--ui-*` tokens, `data-ui-theme="lapis"`.

**Policy:** any shadcn family that exists in `@lapismd/design-core` MUST come
from design-core. Keep only Lapis-unique compounds and primitives design-core
does not ship yet; prefer upstreaming missing shadcn primitives over long-term
forks.

### From design-core (swap — clear shadcn overlap)

| Family        | design-core target                   | api usage         | Status                        |
| ------------- | ------------------------------------ | ----------------- | ----------------------------- |
| button        | `@lapismd/design-core/shadcn/button` | direct            | Done (api imports)            |
| input         | `…/shadcn/input`                     | direct            | Done (api imports)            |
| textarea      | `…/shadcn/textarea`                  | direct            | Done (api imports)            |
| switch        | `…/shadcn/switch`                    | direct            | Done (api imports)            |
| table         | `…/shadcn/table`                     | direct            | Done (api imports)            |
| select        | `…/shadcn/select`                    | direct            | Done (api imports)            |
| command       | `…/shadcn/command`                   | direct            | Done (api imports)            |
| popover       | `…/shadcn/popover`                   | direct            | Done (api imports)            |
| hover-card    | `…/shadcn/hover-card`                | direct            | Done (Markdown link previews) |
| dropdown-menu | `…/shadcn/dropdown-menu`             | direct            | Done (api imports)            |
| tooltip       | `…/shadcn/tooltip`                   | direct            | Done (api imports)            |
| scroll-area   | `…/shadcn/scroll-area`               | direct            | Done (api imports)            |
| toggle-group  | `…/shadcn/toggle-group`              | direct            | Done (api imports)            |
| toggle        | `…/shadcn/toggle`                    | transitive        | Done (api imports)            |
| dialog        | `…/shadcn/dialog`                    | transitive        | Done (api imports)            |
| sheet         | `…/shadcn/sheet`                     | type + transitive | Done (api imports)            |
| separator     | `…/shadcn/separator`                 | transitive        | Done (api imports)            |
| skeleton      | `…/shadcn/skeleton`                  | transitive        | Done (api imports)            |
| progress      | `…/shadcn/progress`                  | direct            | Done (api imports)            |
| slider        | `…/shadcn/slider`                    | direct            | Done (api imports)            |
| context-menu  | `…/shadcn/context-menu`              | direct            | Done (api imports)            |
| drawer        | `…/shadcn/drawer`                    | direct            | Done (api imports)            |

### Keep in `@lapis-notes/ui` (not in shadcn-svelte registry)

Verified against `https://shadcn-svelte.com/registry/index.json` — these names
are **not** registry UI items. Maintain here (or compose from design-core
primitives) until a deliberate Lapis compound lands in design-core.

| Family         | Why keep                                      | Near-miss                               | Status                                               |
| -------------- | --------------------------------------------- | --------------------------------------- | ---------------------------------------------------- |
| modal          | Imperative DocumentFragment / plugin host API | `shadcn/dialog`                         | Kept; colocated `modal.css` + `--ui-modal-*` (no TW) |
| confirm-dialog | `promptConfirm` → Promise\<boolean\>          | registry `alert-dialog` (different API) | Kept; colocated CSS + `--ui-confirm-dialog-*`        |
| search         | Input + icon + clear compound                 | `filter/SearchFilterBar`, `input-group` | Kept; colocated `search.css` + `--ui-search-*`       |
| sidebar-custom | NestedProvider, resize, `SidebarState`        | registry/design-core `sidebar` (stock)  | Kept; native CSS/tokens + portable wrapper props     |
| table-dnd      | dnd-kit grips/sensors for settings arrays     | forms `SortableArrayItem`               | Kept; grip chrome via `--ui-table-dnd-*`             |

Also keep local: root `cn` / fuzzy helpers. Trigger-overlay portal ownership is
now centralized in Design Core; the retired Lapis `overlay-portal-context`
export and API source alias MUST NOT be restored.

**Retired:** `date-time-picker-dialog` — removed from `@lapis-notes/ui`. Date/time
settings use api `date-setting` → `@lapismd/design-core/forms` `DatePicker` /
`TimePicker` (Storybook: `API/Date Setting`, catalog id `api-date-setting`).

### Add to design-core from shadcn-svelte registry (then swap)

These were on the keep list but **are** upstream registry UI items. Do **not**
maintain separate forks in `@lapis-notes/ui`. In design-core:
`pnpm ui:add <name>` → consume `@lapismd/design-core/shadcn/<name>`.

| Family       | Registry             | design-core today | Action                     |
| ------------ | -------------------- | ----------------- | -------------------------- |
| progress     | yes (`progress`)     | present           | Done — api imports swapped |
| slider       | yes (`slider`)       | present           | Done — api imports swapped |
| context-menu | yes (`context-menu`) | present           | Done — api imports swapped |
| drawer       | yes (`drawer`)       | present           | Done — api imports swapped |

### Prune from local ui

| Family                                                                                                                                                                                                                      | Note                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| All swap families (button, input, textarea, switch, table, select, command, popover, dropdown-menu, tooltip, scroll-area, toggle-group, toggle, dialog, sheet, separator, skeleton, progress, slider, context-menu, drawer) | Done — pruned from local ui; api + stories consume `@lapismd/design-core/shadcn/<family>` |
| date-time-picker-dialog                                                                                                                                                                                                     | Done — retired; date/time via `forms` DatePicker/TimePicker                               |
| label                                                                                                                                                                                                                       | Done — deleted (orphan)                                                                   |
| sidebar (stock)                                                                                                                                                                                                             | Done — deleted; `SIDEBAR_WIDTH_ICON` lives in sidebar-custom constants                    |

All api-consumed families also have `API/` plays and `visual-pending` baselines
(helpers are `skip-visual`). Promote tags to `visual-approved` after human review.

### Theme / CSS

| Item                            | Status          | Notes                                                          |
| ------------------------------- | --------------- | -------------------------------------------------------------- |
| Brand (`themes/lapis.css`)      | Source of truth | design-core Lapis semantic + `--ui-workspace-*`                |
| Local `theme.css`               | Alias-only      | Obsidian-era → design-core map (below); no palette / `@theme`  |
| Local `styles.css`              | Alias re-export | Imports `theme.css` only (no Tailwind)                         |
| design-core styles in Storybook | Done            | `.storybook/preview.ts`; production host cutover still pending |
| `pnpm check:no-tailwind`        | Done            | Scans ui + api components; stories excluded                    |

#### Obsidian / Lapis alias map (`ui/theme.css`)

| Lapis / Obsidian-era                  | design-core target                                               |
| ------------------------------------- | ---------------------------------------------------------------- |
| `--text-normal`                       | `--foreground`                                                   |
| `--text-muted` / `--text-faint`       | `--muted-foreground`                                             |
| `--text-accent`                       | `--ring` / `--primary`                                           |
| `--interactive-accent*`               | `--primary` / `--ring` / `--lapis-accent*`                       |
| `--background-primary` / `-secondary` | `--background` / `--muted`                                       |
| `--background-modifier-border*`       | `--border` / `--input` / `--ring`                                |
| `--input-height`                      | `--ui-control-height` → `--ui-workspace-settings-control-height` |
| `--color-base-*` ramp                 | Dropped from component paint                                     |

### Compound / api chrome conversion

| Surface                                                        | Status                                |
| -------------------------------------------------------------- | ------------------------------------- |
| ui: modal, confirm-dialog, search, table-dnd                   | Done — colocated CSS + tokens         |
| ui: sidebar-custom                                             | Done — native CSS family              |
| api: menu, configuration, editor layout, empty-view, icon-list | Done — colocated CSS; no TW utilities |

## Out of scope (do not copy yet)

- Full-app `scripts/check-first-party-*.mjs` matrix
- Docker / e2e vault / plugin-host generation
- Changesets / npm publication gates

### Default Plugins browser

Registry app links now open the selected release in the owning Plugins leaf.
Version selection persists, unavailable releases fail closed, and historical
installation retains its requested version and confirmation. Native secondary
launch and cold Web acceptance pass. Successful app links dismiss the owning
Settings dialog; inherited object properties cannot select a release. The
native renderer retains early URLs until a vault host subscribes. The
[app-link record](spec/records/2026-10-13-registry-app-links.md) tracks full-suite
and CI qualification; the Workspace patch remains unpublished.

The default app owns a Plugins workspace browser with a category homepage,
searchable directory and inline verified details. Settings shares its App-scoped
catalog, installed/update state and verified actions. Community runtime remains
parked and relay discovery remains deferred.

The user resumed integration and acceptance after Storybook presentation review.
Changed stories remain visual-pending; no baselines were approved or updated.
Community-derived presentation includes typography, chips, media gallery/viewer,
responsive layouts and linked authors, without reviews or comments. Native view
breadcrumbs and Refresh remain available; the curved content shell is retained.
Landing Updates and its removable directory filter represent eligible installed
upgrades, excluding bundled entries.

Settings Browse, Updates and registry search result selection now reuse and
activate the shared Plugins leaf on the selected plugin, then close Settings.
The old detail dialog, its content and orphan styles are removed. Details retain
verified Markdown, themed media and approximate 30-day/lifetime download counts.
A left-aligned Back icon with circular hover and tooltip returns to the originating
homepage or filtered directory. Its left inset is 8px.

The real signed catalog snapshot contains 12 plugins and 168 verified image
references, with provenance recorded beside the fixtures. Community is excluded.
Body navigation stays outside the scrolling content on the homepage, directory
and details. Verified images reserve their dimensions and show a Skeleton until
browser decoding finishes, followed by an empty state on retrieval or decoding
failure. The About description has 16px of space before its category chips.

Current acceptance passes all 54 affected browser/Settings/snapshot stories and
all 243 Storybook interaction/accessibility stories. Root check and test pass
18/18 tasks, build passes 10/10, and specification validation and static Storybook
build pass. The full web-host suite passes 10/10 with Docker available.
Navigation units pass 5/5. Updates navigation and fixed-detail-header regressions
each moved from one failure to passing; verified-image regressions moved from
three failures to three passing.

The native bootstrap fix is committed separately. Its fresh macOS arm64 package
passes the first packaged smoke, including startup and application URL handoff
without refreshing (see `spec/records/desktop-bootstrap-renderer-acceptance.md`).
The broader Plugins slice remains uncommitted pending Design Core acceptance.
No production signing or notarization was attempted. Design Core's
centre-drop pointer regression passes, but its secondary-toast story readiness
still fails from a fresh Storybook process while the exact warm target passes.
The trace shows delayed module loading. Remaining shared-package browser lanes
have not yet completed. Keep these as functional acceptance blockers; visual
comparison and baseline approval remain separate and deferred.

## Lapis Sync runtime continuation

- Editor document loading now registers/protects the target before reading,
  cancels obsolete publication and preserves original drafts. Managed file/folder
  rename flushes protected writers before movement and link rewrites
  (LN-ARCH-137 through LN-ARCH-139). Workspace navigation event ordering remains
  pending; the governed loading/rename story stays visual-pending.

- API editor documents now register their original persistence context, retain
  failed/closing drafts and expose protection plus an asynchronous external
  writer hook (LN-ARCH-132 through LN-ARCH-135). Navigation coordination, independent
  Mira registration, host shutdown and complete apply-guard selection remain open.

- The App-owned file editing-session registry (LN-ARCH-129 through LN-ARCH-131)
  supplies path-bound protection, detached dirty-writer retention and drained
  shutdown. Mira adapter registration, external-owner barriers,
  production apply selection and exclusive old/new writer ownership remain open.

- Isolated implementation now qualifies the durable encrypted repository and
  local-state crypto (LN-ARCH-104/LN-ARCH-105), guarded native files and indexed
  encrypted receipts (LN-ARCH-106 through LN-ARCH-109).
- Indexed journal format 2 upgrades supported legacy roots before access
  (LN-ARCH-110). Ten migration cases and actual earlier-kernel rejection pass in
  Node and Deno; all 77 native service tests and 243 host Storybook stories pass.
- Client reconciliation, Deno event/object routes, endpoint enrollment, server
  participation, host bridges and real multi-device acceptance remain pending.
- Explicit host-delivery pairing, actual installed-epoch listing and the public
  headless security export are qualified under LN-ARCH-111 through LN-ARCH-113.
  The [pairing record](spec/records/2026-10-14-sync-host-pairing.md) separates
  this host boundary from pending rendezvous, custody and runtime integration.
- Dedicated wrapped-key storage and the shared headless metadata contract are
  qualified under LN-ARCH-114 through LN-ARCH-116. Independent Node/Deno process
  readback preserves identities and encrypted state. The
  [security-store record](spec/records/2026-10-14-sync-security-store.md) retains
  production profile/secret/bridge wiring and legacy custody as pending work.
- The existing private Sync UI/protocol preview is owned by `lapis-plugins`;
  this host work does not activate or publish it.

## Tauri shared-host intake

- [x] Shared `.lapis` state defaults across desktop, web, server and Storybook,
      public `tauri-desktop` classification, and explicit native-provider admission.
- [x] Source qualification: 1,555 unit tests passed (1 existing skip), 249 catalog
      stories passed, full build/check lanes, web/server and packaged host acceptance.
      See [the qualification record](spec/records/2026-10-16-tauri-shared-state.md).
- Packages are built and packed locally for Lapis Desktop; npm publication remains
  deferred to the final release gate. Native vault/session work is tracked there.

- [x] API-owned `Workspace.flushLayout()` and its packed public declaration,
      qualified through native save/close/reload/restore and all affected consumers.
      Desktop M4 still requires external-edit conflict protection before its full
      everyday-use gate can complete.

The Terminal handover also tracks API legacy-data adoption (LN-PLUG-112); see
[the source record](spec/records/2026-10-17-plugin-legacy-data.md). Desktop
qualification remains in its separate migration ledger.

### Native desktop migration: Web service retirement

- [x] M8.2: Web rejects retained `ai`/`terminal` identities through host-owned
      API restrictions, removes dedicated connection tokens and connection UI, and
      preserves plugin data and saved layout. Source checks, 1,702 unique tests, 259 catalog cases and
      all 13 cold Web cases pass with the documented public-archive cohort. Deno desktop
      remains frozen. See the sibling `lapis-desktop/PLUGIN_MIGRATION.md` task ledger.

- [x] M8.3 SDK foundation: explicitly select portable ESM for Tauri and use
      locale-independent asset fingerprints. Exact runtime and fingerprint
      regressions, complete source lanes and all 13 cold Web cases pass. Native
      consumer qualification remains in the desktop task ledger. See [source record](spec/records/2026-10-17-tauri-plugin-runtime.md).

The additive `View.getClosePersistenceScope()` contract (LN-WS-101) retains
application-wide protection by default and enables explicitly declared views
with externally retained state to close without flushing unrelated notes.
Desktop owns its conflict-review opt-in; publication remains deferred.

</details>
