# Specification Governance / Validation and CI

LN-CAT-124 requires the checked-out Plugins retirement audit before fixture
installation or builds. CI selects the post-removal immutable source and its
explicit native runner inside the already provisioned container. Missing or
rejecting source checks remain fatal; production release gates are unchanged.

LN-PKG-200's independent Core fact verifier runs through
`check:dependency-intake` before ordinary checks and as a canonical functional
lane. Trusted bot specification exemptions retain this lane; main-range
specification-first and all release gates remain required. Source-owned
workspace preparation updates factual slots only and grants no new exemption.
LN-CAT-123 extends the retired-AI tooling lane to reject shared catalog sources,
bridges, dependencies and attachment inputs. The obsolete shared-AI state-matrix
audit is retired with its catalog; all surviving shell, geometry, ownership,
static and interaction/accessibility assertions remain required. Removed
catalog requirements and verification rows retain their historical archive.

LN-CAT-122 replaces CI's obsolete shared-AI smoke fixture lane with the
retired-launcher regression. Normal and canonical checks also enforce the source
audit through the existing validation router. The lane never starts a provider,
resets a workspace or treats the retained manual catalog bridge as native
acceptance. Other required checks and existing quarantine boundaries remain.

## LN-GOV-056 — Exact-range main specification gate

<a id="ln-gov-056"></a>

**Requirement.** Main push and manual validation MUST run specification-first against verified immutable related commits, independently of PR bot exemptions. Missing or inconsistent context MUST fail closed before publication or Pages build.

### Acceptance details

The main-range gate retains these controls:

- Push validation MUST use the webhook's nonzero before/after commits, require the exact checked-out main head and reject missing, unrelated or substituted revisions; it MUST NOT substitute a parent when before is absent.
- Manual validation MUST require the exact main checkout and select that commit's verified first parent. Actor identity and user inputs MUST NOT select a baseline or grant exemption.
- Reusable CI governance and standalone Storybook Pages MUST execute the same source-owned range guard with full history. The existing narrow PR author exemption and all functional, release and deployment gates MUST remain unchanged.

[LN-PKG-195](../packages/registry-readiness.md#ln-pkg-195) bounds exact-candidate installation readiness and preserves all release gates. LN-PKG-141 requires fresh registry metadata on every exact-version consumer
probe; only typed exact-candidate transient failures retain bounded retries within the shared deadline.
LN-PKG-196 prepares the same immutable shared readiness source before CI
regressions and published consumer verification. Missing setup remains a failed
gate; it grants no workflow-token fallback or publication retry. Existing
quarantined Storybook lanes retain their explicit disposition, not a new pass.
Turbo passes the public shared-module path specifically to the release
regression task, preserving strict environment selection.

LN-WEB-092 retains the prepared PWA before browser qualification and preserves
failed acceptance logs. Full validation and exact-source deployment admission
remain required; retained diagnostic artifacts grant no deployment authority.

## LN-GOV-055 — Verified dependency completion callback

<a id="ln-gov-055"></a>

**Requirement.** Successful same-repository PR or default-branch CI completion MUST notify the dependency coordinator only through the pinned trusted `workflow_run` verifier. The caller MUST expose no candidate execution or source-write authority and MUST retain complete current-head qualification and repair ownership.

### Acceptance details

The source-owned caller retains these controls:

- The workflow MUST list only the five reviewed CI, Storybook, PWA, Release and dependency-image workflows, excluding itself and deferred surfaces; it MUST NOT cancel independent completion notifications.
- The reusable workflow and `automation-ref` MUST share an exact reviewed commit. It MUST use only the existing named App key and public `LAPIS_DEPENDENCY_APP_CLIENT_ID`, with contents/Actions/PR reads for the workflow token.
- The caller MUST execute no local steps or candidate checkout, artifact or cache handling; publication remains independently gated and an unqualified current lane MUST remain a hold.

## LN-GOV-054 — Generated version PR authority

<a id="ln-gov-054"></a>

**Requirement.** Generated version PRs MUST use the existing dependency App scoped to this repository from a trusted-main job. Its workflow token MUST remain read-only, checkout credentials MUST NOT persist, and missing App credentials MUST fail without a workflow-token fallback. Version preparation MUST retain the existing recipe and MUST NOT publish packages or create GitHub releases.

### Acceptance details

The authentication boundary retains these controls:

- The job MUST request only contents/packages reads for its workflow token, and the App token MUST request only this repository's contents/PR writes.
- The version command MUST remain `pnpm release:version` using the GitHub API commit mode; publication, verification, notification and protected release gates MUST retain their authority.
- Workflow validation MUST reject credential fallback, missing main restriction, persistent checkout credentials, altered token scope and publication during version preparation.

Application composition validation traces the shared App Profile public export
through its owned barrel and Svelte source. It still rejects a replacement body;
an imported session name is never accepted as shell evidence by itself.

The reusable CI aggregate includes Cloudflare PWA packaging, HTTP semantics and fresh-browser artifact acceptance. Production publication runs that aggregate for every main revision independently of npm versioning; only its main-restricted deployment job receives the Cloudflare token (LN-WEB-083–086).

<!-- dependency-automation-policy -->

Dependency update PRs from the trusted LapisMD App, Dependabot or Renovate MAY skip specification checks using the PR author rather than the rerun actor. Enabled functional checks remain required; LN-CAT-121 explicitly quarantines Vitest browser interactions and axe with visible disabled coverage. The shared `lapismd/dependency-automation` coordinator proposes published first-party npm updates with Changeset release intent where required; it does not merge, publish, sign or deploy. This CI policy changes no runtime or public contract in this chapter.

Local validation selects the isolated Docker runtime under LN-ARCH-146. Hosted
CI explicitly selects its provisioned native runtime. The source composition
audit enforces LN-CAT-118 and LN-CAT-119 in both normal and specification lanes;
existing shell placement, App ownership and public Show Code checks remain.
Docker smoke checks enforce real filesystem permission denial under dropped
capabilities; a worker's root identity cannot waive native permission assertions.

## LN-GOV-004 — Local gate: inspect the current VCS change (jj preferred

<a id="ln-gov-004"></a>

**Requirement.** The local gate MUST inspect the current VCS change (`jj` preferred, else git); CI MAY compare base and head revisions.

## LN-GOV-005 — Protected-change gate exclusions

<a id="ln-gov-005"></a>

**Requirement.** Tests, generated output, and ordinary story files MUST NOT satisfy or spuriously trigger the specification-first gate.

The explicit Rust-hosted Web build writes generated assets to
`packages/web/dist-rust-server`. That directory is ignored alongside the other
Web build outputs; it does not become authored source or satisfy a protected
change's canonical-document requirement. The build profile, adapter source and
their contracts remain subject to the ordinary specification-first gate.

## LN-GOV-023 — Specification validation: inspect repository and authorized package-local Autodocs stories

<a id="ln-gov-023"></a>

**Requirement.** Specification validation MUST inspect repository and authorized package-local Autodocs stories that use demo, harness, or fixture render boundaries. They MUST resolve explicit `docs.source` code, language, and type fields without exposing story-only names or `args` as consumer usage.

## LN-GOV-027 — Roles package implementation and plugin-only Storybook changes: governed by the sibling repository's standalone specification

<a id="ln-gov-027"></a>

**Requirement.** Roles package implementation and plugin-only Storybook changes MUST be governed by the sibling repository's standalone specification rather than Lapis source paths.

## LN-GOV-029 — Agent guidance: require canonical movable-panel registrations to declare

<a id="ln-gov-029"></a>

**Requirement.** Agent guidance MUST require canonical movable-panel registrations to declare their opening commands together, while file-backed editor views use editor associations and compatibility aliases reuse canonical commands.

Changes to the shared validation workflow and Web fixture runner map to the
package acceptance requirements LN-PKG-161 and LN-PKG-162. Fixture signing uses
ephemeral keys and exact source provenance; it cannot authorize a release or
replace the production signing gate.
Workflow-shell regressions execute checkout and provenance handling against a
different host SHA and reject a mismatched checkout.
CI runners declare the external controller and Docker prerequisites needed to
execute the complete acceptance graph; prerequisite absence remains a failure.
Linux qualification includes controller dependency materialization and a private
server secret readable by the container service user without relaxing assertions.
Initial server navigation allows one recovery only for observed same-origin
Chromium document or script `ERR_NETWORK_CHANGED` failures. Retry annotations
and attachments remain visible in diagnostic artifacts after a successful
recovery. Readiness, later application steps and a failed second attempt retain
their original failure behavior.

The Rust server acceptance job is independent of Deno setup and desktop builds.
Its native and container browser commands are uncached bounded root tasks. The
job keeps the workflow-wide provisioned native runtime except for actual image
acceptance, which explicitly re-selects the Docker runtime because the image
harness fails closed without Docker and has no host fallback.
Workflow regressions verify job ordering, that exact Docker override and that
removing either Web job's success still fails the aggregate; splitting
execution cannot remove coverage.

Release-artifact qualification passes the read-only GitHub job token to package
release lookups. It preserves fail-closed lookup errors and immutable candidate
checks; publication still requires its independent dispatch and environment gates.
