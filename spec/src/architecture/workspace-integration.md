# Architecture / Workspace integration

LN-WS-101 keeps close policy generic and safe by default. A declared layout-only
view still joins operation settlement and layout persistence; its App-owned
staged state and unrelated failed writers survive removal. Desktop owns the
conflict-review opt-in; shared code contains no consumer view-type exception.

Same-type state transitions retain LN-WS-005/062 authority through in-flight
projection, including Search query/scope state.
Foreground file routing joins LN-WS-005's projection-aware reveal. LN-ARCH-048
history capture and the original App, leaf, view and writer owners are unchanged.

Diagnostic navigation may register disposable App-owned resource openers before
the existing vault-file fallback. The desktop routes conflict resources while
retaining writer-owned persistence; the shared API grants no file authority.

Deferred imperative attachment follows LN-WS-006/064: the API waits for its
queued compatibility projection and retains the same view/container owner.
Layout authority, navigation policy and application service admission stay with
their existing owners; attachment cannot create another App or execution scope.

## LN-ARCH-008 — Storybook: consume design-core's shared catalog stylesheet and layout

<a id="ln-arch-008"></a>

**Requirement.** Storybook MUST consume design-core's shared catalog stylesheet and layout synchronizer so Workspace stories receive the same edge-to-edge viewport contract while ordinary component stories retain catalog padding.

## LN-ARCH-040 — Lapis: classify statically shipped plugins by distribution while

<a id="ln-arch-040"></a>

**Requirement.** Lapis MUST classify statically shipped plugins by distribution while retaining one API core lifecycle. Design Core MUST own only the managed-plugin settings source and grouped presentation; Lapis MUST own registration, persistence, failures, and workspace recovery policy.

The public Workspace Core Settings page consumes all managed-plugin sources.
App Shell entries retain source-qualified lifecycle routing alongside Lapis
entries, with no duplicate persistence or direct App Shell implementation.

## LN-ARCH-048 — File-opening navigation: capture the initiating leaf state before constructing

<a id="ln-arch-048"></a>

**Requirement.** File-opening navigation MUST capture the initiating leaf state before constructing a target view that may eagerly attach itself. Back MUST restore the initiating view rather than an incomplete target-view state and MUST discard the previous file-view root before mounting it.

## LN-ARCH-055 — Folder-contained AI conversation files: the portable source of truth and use

<a id="ln-arch-055"></a>

**Requirement.** Folder-contained AI conversation files MUST be the portable source of truth and use API-owned vault durability. Chat and folder-aware history MUST remain separate views joined by a non-authoritative scope-and-ID hint that follows live folder moves in memory. The selected history scope and empty-query Agents palette MUST read portable source while the provider-filtered AppDatabase projection remains disposable and limited to cross-scope discovery and full-text previews. Workspace layout readiness MUST NOT trigger an unconditional global Search-index rebuild.

## LN-ARCH-058 — AI chat view construction: remain synchronous and presentation-first while conversation, catalog

<a id="ln-arch-058"></a>

**Requirement.** AI chat view construction MUST remain synchronous and presentation-first while conversation, catalog, and runtime preparation continue behind the mounted surface. Conversation history MUST use generic workspace leaf activation to preserve its sidebar view and route location-keyed conversations into reusable main-area tabs. The chat view MUST project scope path breadcrumbs through the generic view chrome contract.

## LN-ARCH-059 — View-access metadata composition

<a id="ln-arch-059"></a>

**Requirement.** API MUST compose generic view access metadata into the existing plugin command lifecycle and project active API commands into the Design Core Actions tab. File Explorer and AI MUST register Files and Agents palette providers. The Files provider MUST expose a bounded recent-file or lexical-path starter set and typed path queries. First-party plugins retain placement, reuse, activation, and reveal policy for their own views.

## LN-ARCH-076 — Graph: own one application-plugin-scoped canonical-data coordinator above view

<a id="ln-arch-076"></a>

**Requirement.** Graph MUST own one application-plugin-scoped canonical-data coordinator above view instances. AppDatabase owns its disposable snapshot, MetadataCache owns reconciliation readiness and fingerprinting, Graph owns snapshot validation and rebuild scheduling, and renderers own display-only derivation. Views and controls MUST NOT create competing global scans.

## LN-ARCH-077 — Graph canvas simulation, camera, and emphasis state: remain renderer-owned and independent from canonical persistence

<a id="ln-arch-077"></a>

**Requirement.** Graph canvas simulation, camera, and emphasis state MUST remain renderer-owned and independent from canonical persistence. Idle paint MUST remain neutral; only an emphasis source and incident links use accent paint. Viewport culling and screen-pixel link width MUST remain paint-only concerns that do not mutate simulation, navigation targets, or hit testing.

## LN-ARCH-090 — Signed catalog metadata and unsigned aggregate download: remain separate contracts. API owns summary validation

<a id="ln-arch-090"></a>

**Requirement.** Signed catalog metadata and unsigned aggregate download statistics MUST remain separate contracts. API owns summary validation and source access; Workspace owns optional display and sorting. Missing statistics MUST NOT affect signature verification, install availability, updates, or registry errors.

The workspace compatibility owner versions explicit API view transitions and
activations against queued controller projections. Older queued snapshots yield
before reconciliation so they cannot unload a newly opened plugin view.

The status bridge forwards left, centre and right contributions to the shared
footer, retaining plugin-owned mounts and disposal. Design Core owns footer
geometry, overflow, Settings chrome and notification placement; API retains App,
command, context and persistence authority (LN-WS-054, LN-WS-075).

Responsive plugin-directory acceptance follows the shared PanelToggle public
part/side markers and retains actual open, close and focus checks after the
source shell composition update (LN-ARCH-040, LN-WS-054).

LN-WS-005 reveal now drains an in-flight host projection before publishing its
selection. Generic host ownership under LN-ARCH-003 and view-access composition
under LN-ARCH-059 remain unchanged; plugins retain their routing policy.
