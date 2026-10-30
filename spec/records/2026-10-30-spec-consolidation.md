# Specification consolidation — 2026-10-30

This is a one-time reconciliation of the retired tracking sources, not an active
schedule. Current behavior/status lives in owning feature chapters and verification;
outstanding work lives in canonical backlog topics. Historical source checkpoints
never imply current consumer qualification.

## Baselines and evidence

Notes baseline deb48374 carried 128 Rust rows: 38 Complete, 75 Source complete,
12 Working and three Deferred. Its exact tracker regression passed 13/13 and its
128-row projection passed before removal. Desktop baseline f712d62c carried 58
rows: 39 Done, five Partial, five In progress, eight Deferred and one Planned.
Its exact tracker regressions passed 11/11; the three evidence-file regressions
also passed. Those counts describe the old records, not today's backlog size.

The later handoff supersedes stale cutover claims: recorded image basic 16/16,
model 23/23, provider 3/3 and complete hosted 11/11; Properties later passed 2/2
in three cold runs. The Rust server/core/protocol and hosted application now live
in lapis-server, whose current specifications own those implementation/release
inputs. No old receipt is transferred to a newer cohort.

## Dispositions

- Root migration summaries, workspace registers, Rust/hosted-parity plans and
  their JSON ledgers/generators were removed. No actual workspaces were changed.
- Shared contracts, original source/consumer receipts and unique architectural
  context remain. Pure duplicated editor/session/registry, Node-server and file-icon plans were
  removed; their distinct implementation/publication receipts remain.
- The workspace-retirement incident has its own historical record. Original
  source provenance for Desktop remains a byte-preserved inventory under its
  spec/evidence directory. Old documents remain recoverable from these baselines.
- Current backlog links replace stale per-commit tracker requirements. Historical
  receipt prose and commands describe their own revision, not current entrypoints.
- Local/offline-browser qualification, optional Docs/legacy History adoption and
  source-owned consumer prerequisites are in [Notes integration](../src/backlog/runtime-integration.md).
- Native participants, context/handoff, approvals/tools/Changes, memory,
  operations, optional Docker execution and hosted qualification are in the
  [Server backlog](https://github.com/lapismd/lapis-server/blob/main/spec/src/backlog.md).
- Desktop native/provider/shared-screen, sync/undo, canonical conversations,
  Review/tools and distribution follow-ups are in the
  [Desktop backlog](https://github.com/lapismd/lapis-desktop/blob/main/spec/src/backlog.md).

## Former Rust row destinations

Every former row is accounted for below. Contract destinations preserve the
row's source concern; they do not promote host adoption. Former parent rows and
children may share a backlog destination because they describe one capability.

| Former row    | Canonical destination                                                                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R0            | [Plan and review](../src/architecture/rust-application-services.md#ln-core-001)                                                                           |
| R1.1          | [Shared vault engine](../src/architecture/rust-application-services.md#ln-core-002)                                                                       |
| R1.2          | [Vault/service ownership](../src/architecture/rust-application-services.md#ln-core-003)                                                                   |
| R1.3          | [Both host adapters](../src/architecture/rust-application-services.md#ln-core-004)                                                                        |
| R2            | [Durable conversation](../src/architecture/rust-application-services.md#ln-core-003)                                                                      |
| R2.1          | [Native admission and supervised execution](../src/architecture/rust-application-services.md#ln-core-003)                                                 |
| R2.2          | [Typed host adapters and existing chat adoption](../src/architecture/rust-application-services.md#ln-core-004)                                            |
| R2.3          | [Real-provider detach and cold application recovery](../src/architecture/rust-application-services.md#ln-core-007)                                        |
| R3            | [Indexed vault](../src/architecture/rust-application-services.md#ln-core-003)                                                                             |
| R4            | [AI/tools/Changes](https://github.com/lapismd/lapis-server/blob/main/spec/src/backlog/native-services.md)                                                 |
| R5            | [Memory](https://github.com/lapismd/lapis-server/blob/main/spec/src/backlog/native-services.md)                                                           |
| R6            | [Native jobs](https://github.com/lapismd/lapis-server/blob/main/spec/src/backlog/native-services.md)                                                      |
| R7            | [Rust cutover](https://github.com/lapismd/lapis-server/blob/main/spec/src/backlog/qualification.md)                                                       |
| R1.3.1        | [Shared portable file operations](../src/architecture/rust-application-services.md#ln-core-004)                                                           |
| R1.3.2        | [Desktop file adapter intake](../src/architecture/rust-application-services.md#ln-core-004)                                                               |
| R1.3.3        | [Rust HTTP command adapter](../src/architecture/rust-application-services.md#ln-core-004)                                                                 |
| R1.3.4        | [Hosted client leases and expiry](../src/architecture/rust-application-services.md#ln-core-004)                                                           |
| R1.3.5        | [File/resource streaming](../src/architecture/rust-application-services.md#ln-core-004)                                                                   |
| R1.3.6        | [Browser owner login and sessions](../src/architecture/rust-application-services.md#ln-core-004)                                                          |
| R1.3.7        | [Database facade bound to admitted vault lifetime](../src/architecture/rust-application-services.md#ln-core-004)                                          |
| R1.3.8        | [Tauri and HTTP database adapters](../src/architecture/rust-application-services.md#ln-core-004)                                                          |
| R1.3.9        | [Existing browser login/vault/workspace UI on Rust](../src/architecture/rust-application-services.md#ln-core-004)                                         |
| R1.3.10       | [Automatic backup after client detach and controlled Quit](../src/architecture/rust-application-services.md#ln-core-004)                                  |
| R1.3.11       | [Same existing file actions through both application shells](../src/architecture/rust-application-services.md#ln-core-004)                                |
| R3.1.1        | [Metadata get/set, scans, conditional transactions and revisions](../src/architecture/rust-application-services.md#ln-core-003)                           |
| R3.1.2        | [Notebook state, notifications and committed change events](../src/architecture/rust-application-services.md#ln-core-003)                                 |
| R3.1.3        | [Database-only file history](../src/architecture/rust-application-services.md#ln-core-003)                                                                |
| R3.1.4        | [Core indexed metadata storage, reads, manifests, filters and facets](../src/architecture/rust-application-services.md#ln-core-003)                       |
| R3.1.5        | [Projection definitions and atomic source writes](../src/architecture/rust-application-services.md#ln-core-003)                                           |
| R3.1.6        | [Projection single-row reads](../src/architecture/rust-application-services.md#ln-core-003)                                                               |
| R3.1.7        | [Projection AST and relationship queries](../src/architecture/rust-application-services.md#ln-core-003)                                                   |
| R3.1.8        | [Task facade](../src/architecture/rust-application-services.md#ln-core-003)                                                                               |
| R3.1.9        | [Derived memory records and job leases](../src/architecture/rust-application-services.md#ln-core-003)                                                     |
| R3.1.10       | [Retained Search storage reference](../src/architecture/rust-application-services.md#ln-core-003)                                                         |
| R3.1.11       | [Retained Search retrieval candidate reference](../src/architecture/rust-application-services.md#ln-core-003)                                             |
| R3.1.12       | [Native prepared Search storage](../src/architecture/rust-application-services.md#ln-core-003)                                                            |
| R3.1.13       | [Native Search document preparation and chunking](../src/architecture/rust-application-services.md#ln-core-003)                                           |
| R3.1.14       | [Native lexical/structured Search retrieval](../src/architecture/rust-application-services.md#ln-core-003)                                                |
| R3.1.15       | [Native ONNX encoder](../src/architecture/rust-application-services.md#ln-core-003)                                                                       |
| R3.1.16       | [Native Search provider control and embedding publication](../src/architecture/rust-application-services.md#ln-core-003)                                  |
| R3.1.17       | [Desktop provider/archive/SQL intake](../src/architecture/rust-application-services.md#ln-core-003)                                                       |
| R3.1.18       | [Native model/cache installation and runtime admission](../src/architecture/rust-application-services.md#ln-core-003)                                     |
| R3.1.19       | [Native vector/hybrid Search retrieval](../src/architecture/rust-application-services.md#ln-core-003)                                                     |
| R3.1.20       | [Native Search batch and rebuild controls](../src/architecture/rust-application-services.md#ln-core-003)                                                  |
| R3.1.21       | [Complete indexed-file upsert, rename and delete](../src/architecture/rust-application-services.md#ln-core-003)                                           |
| R3.1.22       | [Complete native AppDatabase facade](../src/architecture/rust-application-services.md#ln-core-003)                                                        |
| R3.2.1        | [Unattended metadata and projection reconciliation](../src/architecture/rust-application-services.md#ln-core-003)                                         |
| R3.2.2        | [Search index reconciliation and scheduling](../src/architecture/rust-application-services.md#ln-core-003)                                                |
| R3.2.3        | [History-index scheduling](../src/architecture/rust-application-services.md#ln-core-003)                                                                  |
| R1.3.9.1      | [Retained chooser managed-vault lifecycle](../src/architecture/rust-application-services.md#ln-core-004)                                                  |
| R1.3.9.2      | [Existing folder/ZIP import and vault export](../src/architecture/rust-application-services.md#ln-core-004)                                               |
| R1.3.9.3      | [Existing installed-plugin delivery and lifecycle](../src/architecture/rust-application-services.md#ln-core-004)                                          |
| R2.2.1        | [Typed turn protocol, HTTP and public client port](../src/architecture/rust-application-services.md#ln-core-004)                                          |
| R2.2.2        | [Service-owned conversation creation and continuation](../src/architecture/rust-application-services.md#ln-core-004)                                      |
| R2.2.3        | [Tauri selection and existing chat adoption](../src/architecture/rust-application-services.md#ln-core-004)                                                |
| R3.2.1.1      | [Native Markdown parsing and reconciliation lifetime](../src/architecture/rust-application-services.md#ln-core-003)                                       |
| R3.2.1.2      | [Remaining native plugin projection processors](../src/architecture/rust-application-services.md#ln-core-005)                                             |
| R3.2.1.3      | [Tauri and HTTP unattended metadata adoption](../src/architecture/rust-application-services.md#ln-core-004)                                               |
| R3.2.1.2.1    | [Source-owned Tasks occurrence parser](../src/architecture/rust-application-services.md#ln-core-005)                                                      |
| R3.2.1.2.2    | [Native Tasks occurrence publication](../src/architecture/rust-application-services.md#ln-core-005)                                                       |
| R3.2.1.2.3    | [Source-owned Tasks document parser](../src/architecture/rust-application-services.md#ln-core-005)                                                        |
| R3.2.1.2.4    | [Source-owned Tasks recurrence and effective resolution](../src/architecture/rust-application-services.md#ln-core-005)                                    |
| R3.2.1.2.5    | [Source-owned version-4 Task row normalization](../src/architecture/rust-application-services.md#ln-core-005)                                             |
| R3.2.1.2.6    | [Source-owned Tasks per-document structure and run resolution](../src/architecture/rust-application-services.md#ln-core-005)                              |
| R3.2.1.2.7    | [Source-owned Tasks whole-vault parent and cycle validation](../src/architecture/rust-application-services.md#ln-core-005)                                |
| R3.2.1.2.8    | [Source-owned Tasks hrefs, targets and index publication envelopes](../src/architecture/rust-application-services.md#ln-core-005)                         |
| R3.2.1.2.9    | [Native complete Tasks document projection intake](../src/architecture/rust-application-services.md#ln-core-005)                                          |
| R3.2.3.1      | [Native backup-owned index source lifetime](../src/architecture/rust-application-services.md#ln-core-003)                                                 |
| R3.2.1.2.10   | [Native mutation and occurrence transformations](../src/architecture/rust-application-services.md#ln-core-005)                                            |
| R3.2.1.2.11   | [Native Docs note projection parity](../src/architecture/rust-application-services.md#ln-core-005)                                                        |
| R3.2.1.2.11.1 | [Native Docs source-to-projection service intake](../src/architecture/rust-application-services.md#ln-core-005)                                           |
| R3.2.1.2.12   | [Verify and repair native YAML 1.2 behavior](../src/architecture/rust-application-services.md#ln-core-005)                                                |
| R3.2.2.1      | [Native Markdown source reconciliation and SearchManager envelope parity](../src/architecture/rust-application-services.md#ln-core-003)                   |
| R3.2.1.2.10.1 | [Source YAML 1.2 reader prerequisite](../src/architecture/rust-application-services.md#ln-core-005)                                                       |
| R3.2.3.2      | [Paused and cold read-only index owner](../src/architecture/rust-application-services.md#ln-core-003)                                                     |
| R3.2.1.2.10.2 | [Guarded native Task writes and occurrence materialization](../src/architecture/rust-application-services.md#ln-core-006)                                 |
| R3.2.1.2.12.1 | [Qualified native parser pin and cold cache-identity intake](../src/architecture/rust-application-services.md#ln-core-008)                                |
| R3.2.2.2      | [Retained Canvas document source extraction](../src/architecture/rust-application-services.md#ln-core-005)                                                |
| R3.2.1.2.10.3 | [Native daily provider creation and daily-before-rolling Task coordination](../src/architecture/rust-application-services.md#ln-core-006)                 |
| R3.2.2.3      | [Canvas publication and explicit chunking selection on the existing owner](../src/architecture/rust-application-services.md#ln-core-005)                  |
| R3.2.2.4      | [Bounded provider selection, writer authority and explicit unavailable callbacks](../src/architecture/rust-application-services.md#ln-core-005)           |
| R3.2.2.5      | [Shared App observer and native Search plugin lifecycle](../src/architecture/rust-application-services.md#ln-core-005)                                    |
| R3.2.2.6      | [Native Search through the retained hosted application](../src/web-host/startup-and-plugins.md#ln-web-068)                                                |
| R3.2.3.3      | [Shared indexed History controls and admitted HTTP bridge](../src/architecture/rust-history-indexing-lifetime.md#ln-core-011)                             |
| R3.2.3.4      | [Public History observer and admitted hosted port](../src/web-host/startup-and-plugins.md#ln-web-067)                                                     |
| R3.2.3.5      | [Admitted native reader and retained Repository read/search/blame screen](../src/architecture/rust-history-reader.md#ln-core-016)                         |
| R3.2.3.6      | [Guarded restore, backup controls and original repository source](../src/architecture/rust-history-parity.md#ln-core-023)                                 |
| R3.2.3.7      | [Shared immutable History controls and observer in the existing Desktop shell](../src/architecture/rust-history-indexing-lifetime.md#ln-core-011)         |
| R3.2.1.2.10.4 | [Admitted native Task protocol and source-owned plugin adapter](../src/architecture/rust-task-host-port.md#ln-core-013)                                   |
| R3.2.1.2.10.5 | [Retained English daily locale/week settings and native provider parity](../src/architecture/rust-task-host-port.md#ln-core-015)                          |
| R3.2.3.6.1    | [Guarded file/vault restore and retained review](../src/architecture/rust-history-parity.md#ln-core-023)                                                  |
| R3.2.3.6.2    | [Backup capture controls and passive status](../src/architecture/rust-application-services.md#ln-core-003)                                                |
| R3.2.3.6.3    | [Original repository source selection](../src/architecture/rust-history-reader.md#ln-core-016)                                                            |
| R3.2.3.6.4    | [Optional legacy database History capture ownership](../src/backlog/runtime-integration.md#optional-plugin-service-adoption)                              |
| R3.2.4        | [Shared editing intent integration](../src/architecture/native-editor-intents.md#ln-core-019)                                                             |
| R3.2.4.1      | [Core protocol and App registry foundation](../src/architecture/native-editor-intents.md#ln-core-019)                                                     |
| R3.2.4.2      | [Captured-generation explicit recovery through existing Problems](../src/architecture/native-editor-intents.md#ln-core-025)                               |
| R3.2.4.3      | [Source-owned Mira raw input lease and Markdown binding](../src/architecture/native-editor-intents.md#ln-core-020)                                        |
| R3.2.4.4      | [Actual hosted and Desktop editor/Tasks acceptance](../src/architecture/native-editor-intents.md#ln-core-020)                                             |
| R3.2.4.2.1    | [Captured-state recovery and discard contract](../src/architecture/native-editor-intents.md#ln-core-025)                                                  |
| R3.2.4.2.2    | [Existing Problems discovery and explicit recovery actions](../src/architecture/native-editor-intents.md#ln-core-027)                                     |
| R3.2.4.1.1    | [Scope noninteractive state ownership to admitted logical operations](../src/architecture/native-editor-intents.md#ln-core-026)                           |
| R3.2.4.6      | [Protected clean producer refresh after guarded native mutation](../src/architecture/native-editor-intents.md#ln-core-028)                                |
| R3.2.1.2.10.6 | [Staged hosted native Tasks and retained installed-plugin UI](../src/web-host/startup-and-plugins.md#ln-web-070)                                          |
| R4.3          | [Native context, skills, commands and handoff](https://github.com/lapismd/lapis-server/blob/main/spec/src/backlog/native-services.md)                     |
| R4.3.1        | [Retained context projection and admitted attachment foundation](../src/architecture/rust-turn-admission.md#ln-core-038)                                  |
| R4.3.2        | [Retained selected-skill manifest and initial instruction preparation](../src/architecture/rust-turn-admission.md#ln-core-044)                            |
| R4.1          | [Deliver the retained plaintext queue through both existing hosts](https://github.com/lapismd/lapis-server/blob/main/spec/src/backlog/native-services.md) |
| R4.1.1        | [Lossless frozen Desktop captures and receipts](../src/architecture/rust-queue-admission.md#ln-core-029)                                                  |
| R4.1.2        | [Durable bounded admission, dispatch, pause and recovery barriers](../src/architecture/rust-queue-admission.md#ln-core-030)                               |
| R4.1.3        | [Generated DTOs and admitted HTTP/shared API queue port](../src/architecture/rust-queue-admission.md#ln-core-032)                                         |
| R4.1.4        | [Existing chat projection, retained controls and trusted operator capture metadata](../src/architecture/rust-queue-admission.md#ln-core-036)              |
| R4.1.5        | [Admitted native bridge and trusted recipient-catalog selection](../src/architecture/rust-queue-admission.md#ln-core-036)                                 |
| R4.1.6        | [Combined real-host queue workflows and retained provider gates](https://github.com/lapismd/lapis-server/blob/main/spec/src/backlog/native-services.md)   |
| R4.3.3        | [Retained ancestor instructions and admitted Work bootstrap preparation](../src/architecture/rust-turn-admission.md#ln-core-049)                          |
| R4.2          | [Logical participants and one conversation publication owner](https://github.com/lapismd/lapis-server/blob/main/spec/src/backlog/native-services.md)      |
| R4.2.1        | [Source-only native participant acceptance and coordinated publication](../src/architecture/rust-participants.md#ln-core-034)                             |
| R4.2.2        | [Generated participant DTOs, admitted HTTP and shared native client port](../src/architecture/rust-participants.md#ln-core-042)                           |
| R4.2.3        | [Declared-profile participant observation and hosted native integration](../src/architecture/rust-participants.md#ln-core-048)                            |
| R4.3.4        | [Retained skill discovery and versioned native bindings](../src/architecture/rust-turn-admission.md#ln-core-051)                                          |
| R7.1          | [Static Web and health delivery](https://github.com/lapismd/lapis-server/blob/main/spec/src/backlog/qualification.md)                                     |
| R7.2          | [Authenticated observation streams](https://github.com/lapismd/lapis-server/blob/main/spec/src/backlog/qualification.md)                                  |
| R7.3          | [Native build and start entrypoints](https://github.com/lapismd/lapis-server/blob/main/spec/src/backlog/qualification.md)                                 |
| R7.4          | [Linux runtime and container delivery](https://github.com/lapismd/lapis-server/blob/main/spec/src/backlog/qualification.md)                               |
| R7.5          | [Default switch and transitional runtime retirement](../src/architecture/rust-application-services.md#ln-core-008)                                        |
| R7.6          | [Coherent host and restart qualification](https://github.com/lapismd/lapis-server/blob/main/spec/src/backlog/qualification.md)                            |
| R7.7          | [Deferred and failing source-test closure](https://github.com/lapismd/lapis-server/blob/main/spec/src/backlog/qualification.md)                           |
| R7.8          | [Shared retained text-conflict presentation](../src/workspace-shell/panels/problems/core-contract.md#ln-ws-102)                                           |

## Verification

The implementation record will retain exact consolidation check results below.
Product behavior, backlog features, live providers and native OS qualification
are not reclassified by this documentation/governance change.

## Extracted source check ownership

The pre-existing Notes specification check still dispatched check:protocol, which
is absent from its manifest, and Cargo/source-boundary commands against its
removed crates tree. Direct reproduction reports command-not-found before any
protocol proof. Those obsolete lanes are removed from Notes; native source and
server acceptance belong to lapis-server. This does not relabel any source test
as passed. Remaining native tooling reconciliation is recorded in that owner's
qualification backlog rather than keeping a nonfunctional consumer lane.

Intentional requirement wording changes are limited to tracking authority/routes:
LN-GOV-039/051, LN-PKG-004, LN-CAT-005 and LN-UI-001/005. All identities and
product constraints remain; source/consumer evidence keeps its original scope.

## Consolidation validation

- Node 24.10.0 and public spec-validator 0.2.0: canonical validation retains
  all 1,567 requirement identities with zero findings. Doctor and semantic QMD
  discovery pass. The router aliases intentionally retain their extra lanes.
- Explicit native documentation/tooling lane:
  LAPIS_NOTES_VALIDATION_RUNTIME=native pnpm spec:check passes all six configured
  spec lanes, App ownership and metadata-query audits and 67 spec regressions.
  This is host tooling evidence, not Docker or native-product qualification.
- node --test scripts/spec-validation/\*.test.mjs: 67 pass, zero failures.
- Complete affected validation/controller/install/cache/image/transfer suites:
  45 pass, zero failures. Changed-file formatting and mirror checks pass.
- The old 13/13 tracker target is retired with its generator; its source/state
  checks are replaced by canonical specification validation and existing
  navigation/verification audits. No product assertion or threshold is loosened.
- The legacy-port backlog was stale too: PDF, CSV and Canvas now have owning
  plugin packages/specifications, inspected read-only at 6a9b678a. The old
  unchecked specify/port items are replaced with owner links and actual remaining
  host acceptance, while Telemetry/Univer/Tasks proposals retain their scope.

Logs for this local qualification are retained in
/tmp/lapis-spec-consolidation. Earlier failures remain in those logs and the
Desktop consolidation receipt. No product/native/provider acceptance is inferred.
