# Specification Governance / Protected change mapping

Public version preparation carries bounded source facts under LN-PKG-197–198.
Its helper remains mapped to Architecture, Packages and this chapter. Actual
package ownership and this repository's spec-first map determine which pages
receive version facts; unknown or ambiguous coverage remains an error. This is
canonical preparation in the candidate, without a main specification exemption.

Generated version-PR authority maps to LN-GOV-054 and retains the release
boundary under LN-PKG-130. Scope/authentication regressions qualify that job;
they do not replace publication or candidate acceptance.

App Profile publication maps its built exports, workspace-session lifecycle and
startup retry to the package, architecture, database and host chapters under
LN-PKG-132 and LN-PKG-191. The public release graph admits the four known
separately published profile plugins; unknown private dependencies still fail.

Validation install projections and their regressions map to the architecture
build/validation chapter, retaining effective security overrides during private
archive installs. Native build/start tooling and its private regressions map to
[Rust hosted delivery](../architecture/rust-hosted-delivery.md). The explicit
profile does not waive ordinary default-switch or deployment gates.

The hosted server workspace moved to the lapis-server repository. Notes no
longer owns that Cargo workspace. Its historical canonical authority remains
[Rust application services](../architecture/rust-application-services.md).
Existing source-ownership and protected-change rules remain enforced; the
native source, manifests, toolchain and boundary/build scripts map explicitly to
that chapter, including `rust-protocol.mjs` for generated schema/type drift and
`search-model-test.mjs` for actual model, download and offline-cache acceptance.
Native `crates/*/src` joins the fail-closed protected source set. The configured
protocol-contract lane checks generation and client type fixtures alongside the
core boundary audit and its regressions.

The H02 map includes `packages/server-native` beside `server-node` so native
history admission and IPC changes require the owning hosted contracts and
cross-cutting architecture, package and database confirmations. LN-GOV-003 and
LN-GOV-013 remain unchanged; native source is not excluded from spec-first.

The approved `2026.10.14.1` shared-image refresh maps direct workflow pins,
the dependency-only Docker base and its regenerated immutable digest to
Architecture, Packages and this chapter. All existing CI and release gates
remain required.

The LN-PKG-142 retry policy removes failure-triggered cancellation and preserves
active validation runs. Required lane failures remain blocking at the aggregate;
the release-workflow checker rejects reintroduced run-cancellation endpoints.

Release version preparation validates formatter availability and current-version
changelog notes under [LN-PKG-164](../packages/releases-and-exports.md#ln-pkg-164).
Its cached regression inputs include package changelogs and formatter configs.

Configured specification-regression lanes use the registered
[local Turbo test tasks](../packages/vault-and-storage.md#ln-pkg-159).
Their canonical inputs remain part of result identity. The development
specification Playwright configuration maps to Storybook Catalog for its
portable test-server startup contract.

## LN-GOV-003 — Specification updates for protected changes

<a id="ln-gov-003"></a>

**Requirement.** Protected implementation and configuration changes MUST update every mapped canonical chapter in the same logical change.

## LN-GOV-013 — Repository-owned spec-validator.config.mjs: map Lapis IDs, paths, document dialects,

<a id="ln-gov-013"></a>

**Requirement.** Repository-owned `spec-validator.config.mjs` MUST map Lapis IDs, paths, document dialects, and spec-first policy onto reusable validators supplied by `@lapismd/spec-validator`; Lapis-specific validation MAY remain a configured local plugin or check lane.

## LN-GOV-026 — Spec-first map: route API storage to App Database, MetadataCache

<a id="ln-gov-026"></a>

**Requirement.** The spec-first map MUST route API storage to App Database, MetadataCache and registerIndexProjection to App Database and Plugin Model, and web changes to Web Host, Packages, and Architecture. Lapis Roles consumer stories MUST route to Roles Host Integration and Storybook Catalog.

## LN-GOV-030 — Spec-first map: route API plugin lifecycle sources to Plugin

<a id="ln-gov-030"></a>

**Requirement.** The spec-first map MUST route API plugin lifecycle sources to Plugin Model, Packages, and Architecture. It MUST route the external Roles repository through its standalone specification after cutover.

## LN-GOV-031 — Spec-first map: route Bases package sources to Bases Plugin

<a id="ln-gov-031"></a>

**Requirement.** The spec-first map MUST route Bases package sources to Bases Plugin, Packages, and Architecture. Focused and real-App Bases stories MUST route to Bases Plugin and Storybook Catalog instead of receiving the ordinary story exemption.

## LN-GOV-033 — Spec-first map: route packages/api/src/lib/storage/desktop-native.ts to Packages

<a id="ln-gov-033"></a>

**Requirement.** The spec-first map MUST route `packages/api/src/lib/storage/desktop-native.ts` to Packages. It MUST NOT treat that compatibility adapter as an App Database implementation change.

## LN-GOV-034 — AGENTS.md: require published LapisMD packages to resolve

<a id="ln-gov-034"></a>

**Requirement.** `AGENTS.md` MUST require published LapisMD packages to resolve through normal npm semver ranges, prohibit external workspace membership and vendoring, preserve portable publishable manifests, and route dependency defects to the owning repository before consumers update to released versions.

## LN-GOV-035 — AI Host package implementation: governed by the sibling ai-host repository's standalone

<a id="ln-gov-035"></a>

**Requirement.** AI Host package implementation MUST be governed by the sibling `ai-host` repository's standalone specification. The Lapis spec-first map MAY keep a `packages/ai-host` cutover route to Packages, Architecture, and Web Host so the removed in-tree path stays classified.

## LN-GOV-038 — Storybook structure audit

<a id="ln-gov-038"></a>

**Requirement.** The repository MUST run a local Storybook structure audit that maps command views to canonical panel stories and rejects stale mappings, missing placements, non-fullscreen panel geometry, legacy plugin paths, external Roles/CV catalog coupling, incomplete or scrolling shells, incomplete persisted Workspace plugin inventory, and a non-first Specification menu.

## LN-GOV-040 — Spec-first map: route the production Source Editor package

<a id="ln-gov-040"></a>

**Requirement.** The spec-first map MUST route the production Source Editor package to Packages, Architecture, Plugin Model, and Editor Demo. Desktop and web registrations MUST additionally route through their host chapters.

## LN-GOV-041 — Spec-first map: route Lapis package release workflows, Changesets configuration

<a id="ln-gov-041"></a>

**Requirement.** The spec-first map MUST route Lapis package release workflows, Changesets configuration, pre- and post-publication release and local-consumer helper scripts, release documentation, and public package metadata to Packages and Specification Governance, with API, UI, Language Service, File Explorer, and Workspace package docs also routed to their owning architectural chapters. Local-consumer preparation MUST preserve an existing ignored pnpm hook so independently owned source-package overrides remain composable.

The release caller token grant, including `actions: write` for reusable CI, is recorded on [LN-PKG-140](../packages/releases-and-exports.md#ln-pkg-140). Idempotent npm publication, missing GitHub releases, and the short registry retry are recorded on [LN-PKG-130](../packages/releases-and-exports.md#ln-pkg-130) and [LN-PKG-141](../packages/releases-and-exports.md#ln-pkg-141). This routing requirement is unchanged.

## LN-GOV-042 — Spec-first map: route app-profile, Web, and plugin-management Workspace

<a id="ln-gov-042"></a>

**Requirement.** The spec-first map MUST route app-profile, Web, and plugin-management Workspace changes to Plugin Model plus their package and host chapters. Extracted plugin behavior and Storybook source MUST be governed by the sibling `lapis-plugins` specification.

## LN-GOV-044 — Spec-first map: route CI images, dependency-context helpers, signed Turbo

The exact-range `scripts/main-spec-first.mjs` guard maps to Architecture,
Packages and Specification Governance alongside its calling workflows. Its
range selection and fail-closed behavior remain protected by LN-GOV-056.

Final registry acceptance maps its exact Plugins candidate pin to Architecture,
Packages and this chapter. The pinned version candidate uses the released Mira
overlay teardown fix; test-signed fixtures never authorize public assets.

<a id="ln-gov-044"></a>

**Requirement.** The spec-first map MUST route CI images, dependency-context helpers, signed Turbo cache configuration, local container runners, workflow orchestration, release packing, and environment examples to Architecture, Packages, and Specification Governance. Environment examples MUST document only public Nostr registry transport and trust configuration, never signer secrets. Storybook runtime-warning guards MUST remain mapped to Storybook Catalog.

## LN-GOV-045 — Spec-first map: route Deno host-service kernels to Node Server

<a id="ln-gov-045"></a>

**Requirement.** The spec-first map MUST route retained Deno host-service kernels to Node Server Host, Packages, and Architecture. Server package and server-mode Web changes MUST additionally route through Node Server Host. Runtime-independent `host-services` kernels MUST route to Architecture.

## LN-GOV-046 — Dependency-image pin automation: update the verified digest, lockfile tag,

<a id="ln-gov-046"></a>

**Requirement.** Dependency-image adoption MUST update its current-input, publication and verification contracts in Architecture, Packages and Specification Governance. Active cache publication MUST retain input, resolution and publication receipts without modifying source, specifications or pull requests. Any explicit rollback pin change MUST include every mapped chapter and retain the normal spec-first gate.

## LN-GOV-047 — Generated changeset-release/main PR: skip CI spec-first and release-intent checks already

<a id="ln-gov-047"></a>

**Requirement.** The generated `changeset-release/main` PR MAY skip CI spec-first and release-intent checks already satisfied by its constituent source commits. Ordinary PRs MUST retain both gates.

## LN-GOV-050 — Dependency-image PR selection: reuse only an open review

<a id="ln-gov-050"></a>

**Requirement.** Dependency-image publication MUST run only from trusted `main`, serialize without cancellation, and use the shared build, attest and immutable promotion action. All producer and resolver actions MUST pin one reviewed helper cohort. Existing verified identities MUST be reused without rebuilding or overwriting them; uncertain registry writes MUST NOT be retried.

## LN-GOV-052 — Superseded dependency-image reviews

<a id="ln-gov-052"></a>

**Requirement.** Migration cleanup MUST select only obsolete `github-actions[bot]` image reviews targeting `main` from this repository, with the fixed `automation/lapis-notes-ci` head or legacy `automation/lapis-notes-ci-lock-<16 lowercase hexadecimal characters>` heads. It MUST revalidate each review before closing it and retain unrelated or manually edited reviews. Cache publication MUST NOT possess PR-write authority.

## LN-GOV-053 — Already-current dependency-image review

<a id="ln-gov-053"></a>

**Requirement.** An already published and verified current-input cache MUST produce a retained reuse receipt without source changes or a new image review. Missing or unavailable caches MUST preserve ordinary candidate validation through the reviewed base; cache reuse MUST NOT skip the exact frozen source install.

<!-- ci-dependency-image:start -->

## Retained rollback dependency image

- Image: `ghcr.io/lapismd/lapis-notes-ci@sha256:9d5aa165fe46bd038294bc6716c2c59c4ea618d4c33cfa0e713c8b4ca251ebb7`
- Lockfile tag: `lock-29cea641f8dd6775`
- pnpm-lock.yaml SHA-256: `29cea641f8dd6775c582a38498bbdd300e6bdb5aac371f795e369ea01d18d71c`

<!-- ci-dependency-image:end -->

The dependency completion workflow maps to Architecture, Packages and Validation
and CI under LN-GOV-055. Its tests run in the existing release-tool lane; no
package manifest or cache input change is needed for notification adoption.
