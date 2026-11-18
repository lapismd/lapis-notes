# Lapis Desktop and Deno retirement

Status: implementation started on 2026-11-17 after the user authorized cleanup,
repository refresh, isolated workspaces and one removal at a time. The original
plan-only commit remains preserved. Follow the [progress and resume record](legacy-runtime-retirement-progress.md)
for completed substeps, exact evidence and pending work. Publication, deployment,
npm deprecation and installed-application replacement retain their release gates.

Notes is the coordination home because it owns the frozen desktop, shared API
and application profile. Outstanding coordination status belongs to the
[runtime backlog](../../spec/src/backlog/runtime-integration.md#legacy-runtime-and-package-retirement).
Each sibling repository continues to own its implementation, canonical contracts,
qualification and releases. This supporting plan does not redefine current
requirements or transfer ownership to Notes.

## Current scope — user correction, 2026-11-18

The user narrowed implementation to **Desktop-related legacy code and Deno
removal only**. Core API services and functions are protected, including services
that have no current caller but are intended for future use. Lack of present
usage alone does not authorize removing a core service, export, function,
dependency or planned integration.

- Retire the frozen Deno desktop and obsolete Desktop-specific integrations,
  including the separately approved shared-AI distribution retirement.
- Preserve core API services/functions and future-facing capabilities. In
  particular, retain Language Service's implementation, API modules, package,
  Desktop declaration/projection and planned wiring. The proposed E-RETIRE-007
  dependency removal is stopped and recoverably parked; it is not an active slice.
- Generic deprecated-API cleanup in Notes API, Design Core, Agent UI, Community,
  Visual Delta and standalone plugins is outside this plan. Do not remove shared
  functions, aliases, settings readers or providers merely as cleanup.
- Preserve standalone `ai-controller` and exclude `nostr-agent-controller`,
  `community-local` and `nostr-auth` from code/configuration/runtime work.
- Preserve Tauri-owned AI, App Profile native chat, current Rust services,
  API file-tools, portable redaction and planned Sync. Only confirmed obsolete
  Desktop presentation may be removed after checking actual callers and intent.
- Keep the signed static V2 registry and immutable historical artifacts,
  signatures, hashes, provenance, installed apps, settings, conversations and
  memory. Prior explicitly approved AI-specific installer/metadata safeguards
  remain recorded; this correction authorizes no new core API changes.
- Deno-specific adapter/tooling cleanup must preserve surviving contracts and
  future service capability. Any proposed public interface change requires its
  own concrete review and explicit confirmation before implementation.
- Keep terminal ownership migration and Deno terminal-host retirement last,
  after all other **in-scope Desktop/Deno** removals and consumer changes land.
  Preserve the current Rust PTY dependency and required tooling until then.
- Keep functional, keyboard, accessibility, packaging and native acceptance.
  Visual baseline changes remain excluded; publication/deployment retain gates.

Earlier broad API-removal proposals in historical plan revisions are superseded
by this decision. Do not reopen them as part of this retirement.

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

### Audited usage and current disposition

| Component                                      | Audited usage                                                                                               | Future disposition                                                                                               |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `@lapis-notes/ai` in `lapis-plugins`           | Stories, probes, release automation and active registry distribution; absent from current host registration | Retire implementation and its integration/distribution paths                                                     |
| Tauri-owned AI                                 | Desktop registers its local plugin; native execution uses public `lapis-ai` transport and Rust services     | Preserve current renderer/core paths and native admission                                                        |
| App-profile native chat                        | Notes web registration and Rust-hosted Notes consume it                                                     | Preserve                                                                                                         |
| `ai-controller`                                | In-scope consumers are the retiring plugin, old desktop and probes; excluded services still need it         | Remove in-scope edges; preserve standalone service                                                               |
| `ai-host`                                      | Notes API imports the portable file-tools kernel; preserved controller uses execution exports               | Preserve package and required exports; remove obsolete Deno fixtures/configuration only                          |
| `terminal-host`                                | Deno CLI/FFI host is obsolete; Server consumes its Deno-free Rust PTY crate                                 | Consolidate Rust crate into `lapis-terminal`, then retire old host                                               |
| Standalone terminal plugin                     | Public host bridge, not a runtime dependency on the Deno terminal-host package                              | Preserve bridge integration; remove stale standalone-host instructions                                           |
| `agent-redaction`                              | Desktop uses portable redaction; no identified in-scope Deno adapter caller                                 | Preserve portable/Node/Rust and shared APIs; audit only Deno-specific adapters/tooling with public-change gates  |
| Notes `host-services` and `deno-host-services` | Remaining consumers are old Deno compatibility modules                                                      | Retire only verified Deno-specific host adapters; preserve portable/core service functions and future capability |
| Private Sync foundation                        | Parked package with intentional previews, fixtures and future-delivery contracts                            | Preserve foundation and future APIs; audit only obsolete Deno host/review tooling                                |
| Standalone Nostr Sync                          | Experimental source/provenance reference, not current host startup                                          | Preserve experimental work and service/provider APIs; generic alias cleanup excluded                             |
| `lapis-community`                              | Active independent application/protocol implementation                                                      | Preserve application and APIs; audit only obsolete Deno-dependent acceptance                                     |
| Nostr Astro renderer                           | Legacy stacks and excluded local cluster still reference it                                                 | Defer source deletion to preserve excluded consumers                                                             |
| Signed static V2 registry                      | Current installer source, publication pipeline and catalog                                                  | Preserve schemas/readers and pipeline; only approved shared-AI retirement is in scope                            |

The deprecated Nostr renderer checkout and the signed static registry checkout
both identify `lapismd/plugin-registry`; they are different source states, not
independent GitHub repositories to delete. Select the correct source revision
before any registry change.

No executable Deno dependency was identified in current Rust AI/terminal engines,
Design Core, Agent UI, Mira, Website, Maintenance, the shared CI image or the
standalone Docs/Tasks/Notebook/CV plugin sources. The dated audit also identified generic API/documentation work there; that work
is outside the current scope. The broader
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

## Slice 2: remove retired hosts and unnecessary Deno tooling

Owners: Notes, Desktop, host packages, Plugins and Homebrew tap.

Terminal-host retirement is deferred to slice 3. Remove only tooling no surviving
consumer needs; preserve terminal-specific paths and any shared Deno tooling
still required by that deferred slice.

- Relocate the PWA icon asset before deleting its old desktop source. Remove
  the frozen desktop, Deno-only host adapters, runtime configuration,
  native-library packaging, telemetry launchers and old release tooling once
  surviving consumers are disconnected. Preserve portable/shared core service
  functions and future-facing capabilities; do not delete them transitively
  because their current host caller is retired.
- Disconnect obsolete Desktop/Deno runtime wiring at its owning host boundary.
  Preserve core API identities, defaults, protocol/schema members, public native
  bridges, browser storage and Rust providers. A named Deno-specific public
  contract change requires separate explicit approval; generated bindings, if
  affected by an approved change, must be regenerated by their owner.
- Remove Deno installation from Notes/Plugins CI actions, validation images and
  tool inventories after their obsolete consumers are gone. Remove Desktop's
  obsolete Deno fallback for building spec-validator.
- Remove unused Deno fixtures/configuration in `ai-host` without changing the
  preserved controller's execution contracts. Keep the API's file-tools kernel
  and the archive/build dependency edges needed to validate that kernel.
- Audit obsolete redaction Deno adapters/tests and CI installation while
  preserving portable, Node, Rust and shared service/function contracts. Any
  Deno-specific public export removal needs its separate explicit review.
- Retire Notes-owned Deno desktop release production and Homebrew
  generation/smoke paths. Disable legacy Deno distribution without fabricating
  Tauri manifests, artifact URLs or checksums. A Tauri distribution replacement
  requires actual qualified release artifacts. Preserve installed apps and data.

## Protected core services and interfaces

No generic core API/service/function removal is scheduled. Preserve both active
and planned services even where current startup has no caller. The API language
manager/editor/worker contracts and the separate Language Service provider are
not Deno-host deletion targets. Preserve their package/build inputs and future
integration; do not infer deprecation from dependency or module graphs.

Keep registry schemas/readers, generic helpers, variant utilities, composer
fields, callback aliases, provider aliases and persisted-setting readers outside
this retirement. They may only be reconsidered through separately authorized
work. Historical broad cleanup lists are not implementation authority.

The existing Deno desktop/service wrappers may be retired at their owning host
boundary after verifying all consumers, without deleting shared/core services
or changing their public functions. Record any required Deno-specific public
interface proposal separately for explicit review.

## Slice 3: consolidate native terminal ownership

Owners: Terminal Host, Lapis Terminal, Server and terminal plugin.

Start only after slices 1–2 and their required consumer changes have landed. This
is the final removal slice, followed by whole-plan qualification in slice 4.
Until then, preserve the existing Rust PTY crate location, Server dependency and
required terminal-host tooling; record those retained edges explicitly.

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

## Slice 4: final qualification and dependency cleanup

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

Qualify and land each earlier slice at its own boundary without waiting for the
terminal migration. Record terminal-related Deno/tooling exceptions as pending,
then close them and run the complete in-scope Deno-absent acceptance after slice 3.

Required acceptance scenarios:

- Old external AI plus bundled AI; settings/conversation/memory retention;
  disablement, Safe Mode and reload/close without replay or duplicate writers.
- Disabled AI install through UI and direct distribution API; stale cache/links
  and release-plan/metadata reactivation rejection; signed-history preservation.
- Terminal byte fidelity, Unicode, resize, output cursors, reconnect, confinement,
  exit and owned process cleanup in supported Desktop/Server surfaces.
- V2 registry install/update and tampering/signature failures for the approved
  shared-AI retirement, with immutable archived artifacts still available.
  Generic registry schema/reader migration is excluded.
- Packed public exports and affected application startup/build/test paths with
  Deno and standalone controller/terminal executables absent from PATH and without
  a populated Deno cache. This does not qualify or alter the excluded services.
- Fail-closed checks for retired imports, registrations, launchers and publication
  selectors, with narrow exceptions for history, provenance and rejection tests.

Disconnect retiring Desktop/Deno consumers, preserve shared service contracts,
then remove the owning obsolete hosts/adapters and prune unneeded toolchains.
Refresh documentation, inventories and lockfiles without generic API cleanup.
Commit verified slices separately with Jujutsu. Publication/deployment retain
their governing release gates; do not infer permission from this saved plan.

## Completion criteria

Implementation is complete when in-scope retired Desktop/Deno implementations
are unreachable from supported application, catalog, build and release entrypoints, required
functional/accessibility/package/native lanes pass, and every retained runtime
edge has an explicit owner and reason. The preserved controller and excluded
repositories remain a separate service boundary. Core API services/functions
and planned Language Service wiring remain intact; their lack of current callers
is not incomplete retirement work. Do not claim a Deno-free entire
workspace, completion of deferred Sync/native work, or visual approval.

Implementation and qualification status are tracked in the progress record;
unchecked work and release gates remain pending.
