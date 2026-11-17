# Lapis legacy runtime and package retirement

Status: planned; implementation has not started. Saved on 2026-11-17 from the
consolidated source audit and scope decisions made on 2026-11-15. The request
authorizes saving and committing this plan only. It does not authorize starting
the removals, changing packages, publishing, deploying or replacing applications.

Notes is the coordination home because it owns the frozen desktop, shared API
and application profile. Outstanding coordination status belongs to the
[runtime backlog](../../spec/src/backlog/runtime-integration.md#legacy-runtime-and-package-retirement).
Each sibling repository continues to own its implementation, canonical contracts,
qualification and releases. This supporting plan does not redefine current
requirements or transfer ownership to Notes.

## Scope and decisions

- Retire the frozen Deno desktop, the shared AI plugin and obsolete integrations;
  remove unnecessary Deno dependencies and explicitly deprecated first-party APIs.
- Exclude `nostr-agent-controller`, `community-local` and `nostr-auth`: no code,
  configuration, runtime migration or acceptance work in those repositories.
- Preserve standalone `ai-controller` for excluded consumers. Remove its
  retiring in-scope consumers; do not port the service to Node in this work.
- Keep the signed static V2 registry. Preserve historical signatures, hashes,
  archives, provenance, application data and existing installed applications.
- Preserve Tauri-owned AI and Rust execution. Its renderer-owned and core-owned
  paths are distinct active paths, not evidence that one can be deleted. Do not
  change ownership defaults or enable deferred features as cleanup.
- Migrate callers and persisted data before removing public interfaces. Use
  appropriate breaking-release semantics rather than indefinite compatibility
  shims, consumer patches or copied implementations.
- Keep functional, keyboard, accessibility, packaging and native acceptance.
  Visual baseline updates are excluded.

## Audit basis and limits

The audit traced checked-in manifests, imports, host registration, launchers,
release selectors, workflows, catalogs and named deprecated API callers across
primary local checkouts. Duplicate JJ workspaces were not separate repositories.
Relevant GitHub default-branch source and npm metadata were checked separately.
Static references, historical attribution and negative tests were distinguished
from application startup, dynamic distribution and executable tooling.

At audit time, npm and the registry source still offered `@lapis-notes/ai`
0.1.15, despite its absence from current application startup. Direct hosted
registry requests returned HTTP 403; source/registry metadata inspection did not
prove the deployed endpoint. Installed user profiles were not inspected.

Focused evidence from that audit, not implementation qualification:

| Owner             | Command                                                     | Result                   |
| ----------------- | ----------------------------------------------------------- | ------------------------ |
| Notes App Profile | `pnpm exec vitest run src/index.test.ts`                    | 1 passed                 |
| Notes web         | `pnpm exec vitest run src/native-chat-registration.test.ts` | 2 passed                 |
| Plugins           | `node --test scripts/parked-plugins.test.mjs`               | 7 passed                 |
| Desktop           | `node --test tests/governance/source-audit.test.mjs`        | 11 passed                |
| Desktop           | `node scripts/source-audit.mjs`                             | Source boundaries passed |

The implementation preflight must refresh the chosen source revisions, consumer
graph, distribution state and concurrent-work inventory. These dated findings
are not current release or native acceptance receipts.

### Verified usage and disposition

| Component                                      | Audited usage                                                                                               | Future disposition                                                                      |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `@lapis-notes/ai` in `lapis-plugins`           | Stories, probes, release automation and active registry distribution; absent from current host registration | Retire implementation and its integration/distribution paths                            |
| Tauri-owned AI                                 | Desktop registers its local plugin; native execution uses public `lapis-ai` transport and Rust services     | Preserve current renderer/core paths and native admission                               |
| App-profile native chat                        | Notes web registration and Rust-hosted Notes consume it                                                     | Preserve                                                                                |
| `ai-controller`                                | In-scope consumers are the retiring plugin, old desktop and probes; excluded services still need it         | Remove in-scope edges; preserve standalone service                                      |
| `ai-host`                                      | Notes API imports the portable file-tools kernel; preserved controller uses execution exports               | Preserve package and required exports; remove obsolete Deno fixtures/configuration only |
| `terminal-host`                                | Deno CLI/FFI host is obsolete; Server consumes its Deno-free Rust PTY crate                                 | Consolidate Rust crate into `lapis-terminal`, then retire old host                      |
| Standalone terminal plugin                     | Public host bridge, not a runtime dependency on the Deno terminal-host package                              | Preserve bridge integration; remove stale standalone-host instructions                  |
| `agent-redaction`                              | Desktop uses portable redaction; no identified in-scope Deno adapter caller                                 | Preserve portable/Node/Rust functionality; remove Deno adapter and validation           |
| Notes `host-services` and `deno-host-services` | Remaining consumers are old Deno compatibility modules                                                      | Remove with retired desktop                                                             |
| Private Sync foundation                        | Parked package with intentional previews, fixtures and future-delivery contracts                            | Preserve foundation; remove obsolete Deno review path                                   |
| Standalone Nostr Sync                          | Experimental source/provenance reference, not current host startup                                          | Preserve experimental work; remove explicitly deprecated provider aliases               |
| `lapis-community`                              | Active independent application/protocol implementation                                                      | Preserve; replace obsolete renderer-specific in-scope acceptance                        |
| Nostr Astro renderer                           | Legacy stacks and excluded local cluster still reference it                                                 | Defer source deletion to preserve excluded consumers                                    |
| Signed static V2 registry                      | Current installer source, publication pipeline and catalog                                                  | Preserve; retire obsolete presentation/reader features                                  |

The deprecated Nostr renderer checkout and the signed static registry checkout
both identify `lapismd/plugin-registry`; they are different source states, not
independent GitHub repositories to delete. Select the correct source revision
before any registry change.

No executable Deno dependency was identified in current Rust AI/terminal engines,
Design Core, Agent UI, Mira, Website, Maintenance, the shared CI image or the
standalone Docs/Tasks/Notebook/CV plugin sources. Relevant changes there are
deprecated API consumption or documentation, not runtime migration. The broader
inventory may have changed since the audit; absence of a startup registration
alone does not establish that an experimental or externally distributed package
is obsolete.

## Slice 1: retire the shared AI plugin

Owners: Plugins, Notes, Desktop, registry, Website and organization package docs.

1. Remove the shared plugin implementation, exports, package/release selectors,
   workflow matrix entries, metadata dispatch selection and media generation.
   Reject stale release plans or dispatches that would reactivate it.
2. Remove package-specific catalog wiring in Plugins and duplicate AI stories,
   controller bridges, live-host probes, root development dependencies,
   optimization entries and local archive requirements in Notes.
3. Use Desktop's existing coverage ledgers to preserve assertions for surviving
   application behavior. Retire tests whose sole contract is the removed
   controller-backed plugin; keep native acceptance at its original boundary.
4. Preserve Desktop's owned AI, app-profile native chat, public Agent UI
   presentation and native admission/lifecycle. Do not rewrite them as removal
   substitutes or migrate the preserved standalone controller.
5. Preserve plugin ID `ai`, settings, conversations and memory. Prove startup
   with both an old installed external AI package and bundled AI. Retire external
   distribution records by provenance, not an uninstall or data deletion keyed
   only by plugin ID. Preserve normal disablement and Safe Mode behavior.
6. Disable new registry installs/updates and remove active promotion. Use the
   existing `disabled` status: the audited distribution API still accepted
   `deprecated` entries. Verify UI and direct API behavior, including saved
   install links and stale cached metadata.
7. Preserve historical versions, hashes, signatures and artifacts. Deprecate npm
   versions with replacement guidance; do not unpublish. Update Website AI
   guidance and organization listings to describe bundled/native AI correctly.

Source anchors:
[Desktop registration](https://github.com/lapismd/lapis-desktop/blob/main/src/components/views/notes-bundled-plugins.ts),
[Notes default profile](https://github.com/lapismd/lapis-notes/blob/main/packages/app-profile/src/index.ts),
[web native-chat registration](https://github.com/lapismd/lapis-notes/blob/main/packages/web/src/native-chat-registration.ts).

## Slice 2: consolidate native terminal ownership

Owners: Terminal Host, Lapis Terminal, Server and terminal plugin.

- Relocate the existing Deno-free Rust PTY service crate into `lapis-terminal`,
  retaining its API behavior and regression tests; update Server's pinned
  dependency. Preserve raw bytes, cursors, truncation, exit reporting,
  confinement and shutdown. Do not replace Server's raw protocol with parsed
  terminal frames.
- Keep authentication, vault admission and resource ownership in the host.
  Preserve the terminal plugin's public bridge and current hosted-terminal
  integration. Reconcile concurrent Server work instead of recreating its adapter.
- After consumer acceptance, retire the Deno CLI, FFI/native-library downloads,
  standalone WebSocket host and corresponding install/publish machinery. Remove
  stale advice to start `lapis-terminal-host`; do not create a new standalone
  service as part of this retirement.

## Slice 3: remove retired hosts and unnecessary Deno tooling

Owners: Notes, Desktop, host packages, Plugins and Homebrew tap.

- Relocate the PWA icon asset before deleting its old desktop source. Remove
  the frozen desktop, Deno compatibility services, unused portable host-services,
  runtime configuration, native-library packaging, telemetry launchers and old
  release tooling once surviving consumers are disconnected.
- Remove retired Deno runtime identities, defaults, fallback branches and
  generated protocol members. Remove the unused Node-server identity after
  confirming the hosted implementation remains Rust. Preserve browser storage,
  public native bridges, Rust providers and shared semantic fixtures; regenerate
  Server bindings from their owner rather than editing generated files by hand.
- Remove Deno installation from Notes/Plugins CI actions, validation images and
  tool inventories after their obsolete consumers are gone. Remove Desktop's
  obsolete Deno fallback for building spec-validator.
- Remove unused Deno fixtures/configuration in `ai-host` without changing the
  preserved controller's execution contracts. Keep the API's file-tools kernel
  and the archive/build dependency edges needed to validate that kernel.
- Remove redaction's Deno export, adapter tests and CI installation while
  preserving active portable, Node and Rust adapters.
- Retire Notes-owned Deno desktop release production and Homebrew
  generation/smoke paths. Disable legacy Deno distribution without fabricating
  Tauri manifests, artifact URLs or checksums. A Tauri distribution replacement
  requires actual qualified release artifacts. Preserve installed apps and data.

## Slice 4: migrate and remove deprecated interfaces

Perform caller migration before removing public exports. Update each owner's
canonical contract and verification with the implementation, not through this
plan-only commit. Choose breaking-release semantics appropriate to that package.

| Owner           | Caller-aware cleanup                                                                                                                                                                                                                                                                                     |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Notes API       | Remove unused Markdown rendering/registration aliases after migrating remaining `registerCorePlugins` stories and examples. Remove database-mode summaries and old task-row fields; update Server bindings and fixtures.                                                                                 |
| Design Core     | Migrate real variant-helper consumers in components/examples and update generators before deleting helpers. Remove unused catalog helpers, generator aliases and old Visual Delta forwarding modules. Remove custom-field `update` props, preserving the distinct active settings-controller update API. |
| Agent UI        | Remove deprecated transcript-option fallbacks and composer `sendError`; update fixtures/docs. Preserve active composer-state fields also named `composerStatus`.                                                                                                                                         |
| Community       | Remove old commit-error/review callback fallbacks and `scopeRoom`, retaining current callbacks and scoped search behavior.                                                                                                                                                                               |
| Plugins/Desktop | Migrate old AI tool settings before dropping readers. Remove Bases' unused serialization alias, Docs' deprecated exported helper/test, and only Sync's deprecated crypto-provider signing alias.                                                                                                         |
| Visual Delta    | Migrate internal callers and Design Core's viewport test before removing redundant exports and response fields. Preserve capture provenance and required historical-baseline recognition.                                                                                                                |

Mira's independent `buttonVariants`, CV Roles' local Markdown compiler, standard
Nostr signing methods, deprecation diagnostic tags and registry statuses are
active concepts, not targets of a text-match deletion. Handle vendored WordCanvas
compatibility through its vendor/upstream boundary, not blanket first-party API
removal. Preserve signed Sync protocol fixtures and planned capabilities.

Migrate persisted settings explicitly. Rebuild disposable task projections from
authoritative notes before dropping old row readers. Preserve note content and
avoid rewriting immutable signed records.

### Registry and Community cleanup

- Extract version-neutral schemas still used by V2 before deleting V1
  readers/exports. Convert mutable source entries and migrate saved official
  registry URLs; do not reinterpret signed metadata without verification.
- Remove unused README/Markdown rendering helpers and V1 environment/configuration
  fallbacks. Preserve immutable signed V1 archives, unrelated version-1
  release/trust formats, signatures, download delivery and statistics.
- Replace in-scope renderer-dependent Community acceptance with native
  Community/relay acceptance. Leave the excluded cluster and its renderer
  prerequisite intact. This slice does not delete that renderer's source.

## Slice 5: final qualification and dependency cleanup

Before implementation, refresh exact source revisions, remote/package state and
concurrent work. Read each owner's tracked agent guide. Stop an overlapping slice
when it cannot be changed safely; never conceal an owner defect in a consumer.
Use the latest Deno-free spec-validator, doctor and specification search before
protected changes. Preserve portable registry dependency ranges; source fixes and
required public builds precede consumer refreshes.

For every slice, record exact commands and before/after failure counts. Start
with its narrowest regression, then run the complete impact-based owning checks,
tests, required builds, package/archive acceptance and relevant consumer lanes.
Shared changes require complete relevant interaction/accessibility coverage and
at least one cold startup/teardown run. Keep source, consumer and native evidence
distinct; compilation, mocks and screenshots do not establish native acceptance.

Required acceptance scenarios:

- Old external AI plus bundled AI; settings/conversation/memory retention;
  disablement, Safe Mode and reload/close without replay or duplicate writers.
- Disabled AI install through UI and direct distribution API; stale cache/links
  and release-plan/metadata reactivation rejection; signed-history preservation.
- Terminal byte fidelity, Unicode, resize, output cursors, reconnect, confinement,
  exit and owned process cleanup in supported Desktop/Server surfaces.
- V2 registry install/update and tampering/signature failures after source/URL
  migration, with immutable archived artifacts still available as intended.
- Packed public exports and affected application startup/build/test paths with
  Deno and standalone controller/terminal executables absent from PATH and without
  a populated Deno cache. This does not qualify or alter the excluded services.
- Fail-closed checks for retired imports, registrations, launchers and publication
  selectors, with narrow exceptions for history, provenance and rejection tests.

Deliver replacement contracts first, migrate consumers second, remove interfaces
third, then prune toolchains and refresh documentation, inventories and lockfiles.
Commit verified slices separately with Jujutsu. Publication/deployment retain
their governing release gates; do not infer permission from this saved plan.

## Completion criteria

Implementation is complete when retired implementations are unreachable from
supported Lapis application, catalog, build and release entrypoints, required
functional/accessibility/package/native lanes pass, and every retained runtime
edge has an explicit owner and reason. The preserved controller and excluded
repositories remain a separate service boundary. Do not claim a Deno-free entire
workspace, completion of deferred Sync/native work, or visual approval.

All implementation slices and their acceptance evidence remain pending.
