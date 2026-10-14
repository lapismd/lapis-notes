# Specification Governance / Protected change mapping

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

## LN-GOV-032 — Spec-first map: route AI package sources to AI Plugin

<a id="ln-gov-032"></a>

**Requirement.** The spec-first map MUST route AI package sources to AI Plugin, Packages, and Architecture. Focused AI stories MUST route to AI Plugin and Storybook Catalog instead of receiving the ordinary story exemption.

## LN-GOV-033 — Spec-first map: route packages/api/src/lib/storage/desktop-native.ts to Desktop Host, Deno Desktop

<a id="ln-gov-033"></a>

**Requirement.** The spec-first map MUST route `packages/api/src/lib/storage/desktop-native.ts` to Desktop Host, Deno Desktop Host, and Packages. It MUST NOT treat that file as an App Database change.

## LN-GOV-034 — AGENTS.md: require published LapisMD packages to resolve

<a id="ln-gov-034"></a>

**Requirement.** `AGENTS.md` MUST require published LapisMD packages to resolve through normal npm semver ranges, prohibit external workspace membership and vendoring, preserve portable publishable manifests, and route dependency defects to the owning repository before consumers update to released versions.

## LN-GOV-035 — AI Host package implementation: governed by the sibling ai-host repository's standalone

<a id="ln-gov-035"></a>

**Requirement.** AI Host package implementation MUST be governed by the sibling `ai-host` repository's standalone specification. The Lapis spec-first map MAY keep a `packages/ai-host` cutover route to AI Plugin, Packages, Architecture, Desktop Host, and Web Host so the removed in-tree path stays classified.

## LN-GOV-038 — Storybook structure audit

<a id="ln-gov-038"></a>

**Requirement.** The repository MUST run a local Storybook structure audit that maps command views to canonical panel stories and rejects stale mappings, missing placements, non-fullscreen panel geometry, legacy plugin paths, external Roles/CV catalog coupling, incomplete or scrolling shells, incomplete persisted Workspace plugin inventory, incomplete AI state coverage, and a non-first Specification menu.

## LN-GOV-040 — Spec-first map: route the production Source Editor package

<a id="ln-gov-040"></a>

**Requirement.** The spec-first map MUST route the production Source Editor package to Packages, Architecture, Plugin Model, and Editor Demo. Desktop and web registrations MUST additionally route through their host chapters.

## LN-GOV-041 — Spec-first map: route Lapis package release workflows, Changesets configuration

<a id="ln-gov-041"></a>

**Requirement.** The spec-first map MUST route Lapis package release workflows, Changesets configuration, pre- and post-publication release and local-consumer helper scripts, release documentation, and public package metadata to Packages and Specification Governance, with API, UI, Language Service, File Explorer, and Workspace package docs also routed to their owning architectural chapters. Local-consumer preparation MUST preserve an existing ignored pnpm hook so independently owned source-package overrides remain composable.

## LN-GOV-042 — Spec-first map: route app-profile, Web, Deno, and plugin-management Workspace

<a id="ln-gov-042"></a>

**Requirement.** The spec-first map MUST route app-profile, Web, Deno, and plugin-management Workspace changes to Plugin Model plus their package and host chapters. Extracted plugin behavior and Storybook source MUST be governed by the sibling `lapis-plugins` specification.

## LN-GOV-044 — Spec-first map: route CI images, dependency-context helpers, signed Turbo

<a id="ln-gov-044"></a>

**Requirement.** The spec-first map MUST route CI images, dependency-context helpers, signed Turbo cache configuration, local container runners, workflow orchestration, release packing, and environment examples to Architecture, Packages, and Specification Governance. Environment examples MUST document only public Nostr registry transport and trust configuration, never signer secrets. Storybook runtime-warning guards MUST remain mapped to Storybook Catalog.

## LN-GOV-045 — Spec-first map: route Deno host-service kernels to Deno Server

<a id="ln-gov-045"></a>

**Requirement.** The spec-first map MUST route Deno host-service kernels to Deno Server Host, Desktop Host, Packages, and Architecture. Server package and server-mode Web changes MUST additionally route through Deno Server Host.

## LN-GOV-046 — Dependency-image pin automation: update the verified digest, lockfile tag,

<a id="ln-gov-046"></a>

**Requirement.** Dependency-image pin automation MUST update the verified digest, lockfile tag, and lockfile hash in Architecture, Packages, and Specification Governance alongside the manifest. The generated PR MUST include those chapters and retain the normal spec-first gate.

## LN-GOV-047 — Generated changeset-release/main PR: skip CI spec-first and release-intent checks already

<a id="ln-gov-047"></a>

**Requirement.** The generated `changeset-release/main` PR MAY skip CI spec-first and release-intent checks already satisfied by its constituent source commits. Ordinary PRs MUST retain both gates.

<!-- ci-dependency-image:start -->

## Current CI dependency image

- Image: `ghcr.io/lapismd/lapis-notes-ci@sha256:5f613141805c539dbdf5f5f460d8eb31231ad522d24e01e22888fb906bb11992`
- Lockfile tag: `lock-654683e1966e6631`
- pnpm-lock.yaml SHA-256: `654683e1966e6631f48f3bbbcc1b4764a98c0f986a048649be41623dfdf79c51`

<!-- ci-dependency-image:end -->
