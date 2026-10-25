# Packages / Releases and exports

Dependency-image reviews retain LN-GOV-050/LN-PKG-142; API Mira uses public ranges.
`@lapis-notes/api/native-turns` exports generated DTOs, explicit continuation cursors, feature enable/disable commands and an admitted port. Activation observes native fence/drain policy and grants no executable, path, replay or resume authority.

Release and validation containers consume shared image `2026.10.14.1` by
digest. GitHub CLI 2.102.0 is supplied upstream so approved npm publication can
create its GitHub release records without a consumer tool-install workaround.

Registry-consumer toolchain and build-policy acceptance is recorded in
[the release verification record](../../records/2026-10-13-registry-consumer-toolchain.md).

## LN-PKG-157 — Pinned registry-consumer package manager

<a id="ln-pkg-157"></a>

**Requirement.** Published-package verification MUST generate its temporary registry consumer with the repository root's exact `packageManager` pin before installation. A missing or unpinned pnpm toolchain MUST fail before invoking the consumer install.

## LN-PKG-158 — Approved registry-consumer dependency builds

<a id="ln-pkg-158"></a>

**Requirement.** Published-package verification MUST generate a minimal consumer `pnpm-workspace.yaml` containing only the root's approved `onlyBuiltDependencies` list. It MUST NOT blanket-enable dependency scripts or copy repository patches, overrides, workspace links, or local hooks into that consumer.

## LN-PKG-015 — @lapis-notes/markdown: live in the sibling lapis-plugins monorepo, depend

<a id="ln-pkg-015"></a>

**Requirement.** `@lapis-notes/markdown` MUST live in the sibling `lapis-plugins` monorepo, depend on `@lapis-notes/api` and published Mira packages, and preserve the existing Plugin registration and editor configuration/event contracts without forking them. Its full Reading wrapper MUST use an inherited Design Core Scroll Area; its editing wrapper MUST bound the public embedded editor without creating a second vertical document scroll owner.

## LN-PKG-005 — Package public exports: stay source of truth in each package

<a id="ln-pkg-005"></a>

**Requirement.** Package public exports MUST stay source of truth in each package `package.json` `exports` map.

## LN-PKG-012 — @lapis-notes/api: consume @lapismd/mira through its published npm package

<a id="ln-pkg-012"></a>

**Requirement.** `@lapis-notes/api` MUST consume Mira through built public exports with portable registry dependency and peer ranges. During the Tauri migration, hosts MAY use verified source-owned pnpm archives; publication remains deferred to the final release gate.

## LN-PKG-016 — @lapismd/storybook-addon-visual-delta: remain a private root development dependency resolved

<a id="ln-pkg-016"></a>

**Requirement.** `@lapismd/storybook-addon-visual-delta` MUST remain a private root development dependency resolved from its published npm semver package; it MUST NOT enter api, ui, workspace, or plugin package manifests.

## LN-PKG-043 — Public @lapis-notes/file-explorer: own the reusable File Explorer plugin implementation

<a id="ln-pkg-043"></a>

**Requirement.** Public `@lapis-notes/file-explorer` MUST own the reusable File Explorer plugin implementation formerly co-located with Storybook, publish from built exports at an independent `0.1.0` baseline, and consume framework dependencies through npm semver ranges. It MAY map Design Core current, reveal-or-create, and forced-new-tab activation intents to API workspace leaves and MUST persist Show hidden files, but MUST NOT own vault selection, session boot, persistence policy, or source-editor fixtures.

## LN-PKG-051 — @lapis-notes/lapis-plugin-cv-roles: consume Markdown rendering and source presentation

<a id="ln-pkg-051"></a>

**Requirement.** `@lapis-notes/lapis-plugin-cv-roles` MUST consume Markdown rendering and source presentation from public `@lapismd/mira` exports. It MUST NOT import Mira source paths, target private CodeMirror selectors, or copy its renderer.

## LN-PKG-053 — External plugins: consume semver peer dependencies for host runtimes

<a id="ln-pkg-053"></a>

**Requirement.** External plugins MUST consume semver peer dependencies for host runtimes and exact development dependencies. API, UI, Workspace, Design Core, and Mira MUST remain pack-testable versioned artifacts that support clean standalone compilation.

## LN-PKG-054 — @lapis-notes/bases: live in the sibling lapis-plugins monorepo, expose

<a id="ln-pkg-054"></a>

**Requirement.** `@lapis-notes/bases` MUST live in the sibling `lapis-plugins` monorepo, expose build, check, test, publint, root runtime, stylesheet, npm-package, and `.lapis-plugin` contracts, and publish only its governed public surface. It MUST compose shared controls through public Design Core exports and MUST NOT depend on `@lapis-notes/ui`.

## LN-PKG-056 — @lapis-notes/workspace: a public, pack-tested package with portable semver

<a id="ln-pkg-056"></a>

**Requirement.** `@lapis-notes/workspace` MUST be a public, pack-tested package with portable semver dependencies. Colocated first-party consumers MAY exercise matching workspace source during development, but their publishable manifests MUST remain registry-compatible.

## LN-PKG-063 — @lapis-notes/ai: live in the sibling lapis-plugins monorepo, expose

<a id="ln-pkg-063"></a>

**Requirement.** `@lapis-notes/ai` MUST live in the sibling `lapis-plugins` monorepo, expose build, check, test, publint, npm-package, and `.lapis-plugin` contracts, and publish only its governed public surface. It MUST depend on API and Design Core, MUST NOT depend on `@lapis-notes/ui`, and MUST keep provider-specific types behind plugin-owned runtime-neutral contracts.

## LN-PKG-064 — Root local-development configuration: keep published external LapisMD packages on portable

<a id="ln-pkg-064"></a>

**Requirement.** Root local-development configuration MUST keep published external LapisMD packages on portable registry ranges in tracked manifests and lockfiles. External repositories MUST NOT become Lapis workspace packages.

The October 2026 security refresh leaves external LapisMD package ranges and
versions unchanged and resolves bounded third-party overrides from npm. Root
release tooling uses Changesets 3 with a Node 22.11 development floor. Its
compatibility checks and accepted temporary QMD exception are recorded in the
[dependency audit evidence](../../records/2026-10-14-notes-dependency-audit.md).

## LN-PKG-066 — @lapis-notes/bases: ship one private semantic query-popover sizing rule

<a id="ln-pkg-066"></a>

**Requirement.** `@lapis-notes/bases` MUST ship one private semantic query-popover sizing rule consumed by its Sort and Filter Popover contents without changing public package APIs.

## LN-PKG-068 — @lapis-notes/bases: retain advanced-filter draft validation, accessible CodeMirror invalid

<a id="ln-pkg-068"></a>

**Requirement.** `@lapis-notes/bases` MUST retain advanced-filter draft validation, accessible CodeMirror invalid attributes, and Bases-owned native error paint in its built package. This validation MUST remain private and MUST NOT change the public package API.

## LN-PKG-069 — Public @lapismd/ai-host: remain a separately versioned transport library. Generic

<a id="ln-pkg-069"></a>

**Requirement.** Public `@lapismd/ai-host` MUST remain a separately versioned transport library. Generic orchestration, the browser SDK and standalone Deno CLI MUST live in `@lapismd/ai-controller`. Hosts and plugins MUST consume published npm semver ranges; explicitly documented local tarballs MAY be used for pre-release validation.

## LN-PKG-071 — First-party runtime and Storybook source: audited against direct ambient App reads

<a id="ln-pkg-071"></a>

**Requirement.** First-party runtime and Storybook source MUST be audited against direct ambient App reads or assignments outside the compatibility bridge and dedicated fallback tests. Both root `pnpm check` and `pnpm spec:check` MUST run the audit.

## LN-PKG-022 — Portable sidebar-wrapper declarations

<a id="ln-pkg-022"></a>

**Requirement.** Retained `sidebar-custom` wrappers around design-core Input and Separator MUST publish portable component declarations. Their explicit public prop types MUST derive from design-core's public component contracts, and generated `@lapis-notes/ui` declarations MUST NOT name sibling-repository `node_modules` realpaths or dependency-internal Svelte/Bits UI installations. Runtime markup, bindings, and accepted props remain unchanged.

## LN-PKG-031 — @tobilu/qmd 2.5.3: remain a pinned root development dependency.

<a id="ln-pkg-031"></a>

**Requirement.** `@tobilu/qmd` 2.5.3 MUST remain a pinned root development dependency. Its native build approvals and TypeScript peer MUST remain root tooling and MUST NOT enter workspace package manifests.

The user approved a temporary exception for `GHSA-vfj7-8cjw-p6xm` in QMD's
`braces` dependency on 14 October 2026. Review it by 13 November 2026 and remove
it once a patched upstream chain is available. The
[audit record](../../records/2026-10-14-notes-dependency-audit.md) retains the
unfiltered finding, dependency path, scope limitation, and removal procedure.

## LN-PKG-034 — Public @lapis-notes/language-service: live at packages/language-service as a provider-neutral Markdown

<a id="ln-pkg-034"></a>

**Requirement.** Public `@lapis-notes/language-service` MUST live at `packages/language-service` as a provider-neutral Markdown client and worker package, publish built root, Markdown, and Markdownlint runtime exports at an independent `0.1.0` baseline, and consume framework dependencies through npm semver ranges. It MUST expose build, check, and test scripts without owning workspace presentation or vault navigation.

## LN-PKG-085 — MetadataCache.dispose: wait for in-flight load, reconciliation, query,

<a id="ln-pkg-085"></a>

**Requirement.** `MetadataCache.dispose` MUST wait for in-flight load, reconciliation, query, and index-write work. It MUST release database subscriptions and compatibility leases before the owning AppDatabase closes.

## LN-PKG-107 — Normal operation: retain at most 512 recently used metadata

<a id="ln-pkg-107"></a>

**Requirement.** Normal operation MUST retain at most 512 recently used metadata entries. Full synchronous maps MUST exist only under a reference-counted compatibility lease and MUST be released when its last owner unloads.

## LN-PKG-110 — Vault: expose a file iterator whose additional memory

<a id="ln-pkg-110"></a>

**Requirement.** Vault MUST expose a file iterator whose additional memory is bounded by folder depth. Warm MetadataCache reconciliation MUST combine it with exact-path manifest batches no larger than 500 entries.

## LN-PKG-112 — MetadataCache and Search: persist separate versioned reconciliation checkpoints in app_meta

<a id="ln-pkg-112"></a>

**Requirement.** MetadataCache and Search MUST persist separate versioned reconciliation checkpoints in `app_meta` and skip full warm scans when their streaming manifest fingerprints match. Database readiness MUST precede reconciliation, and Search MUST begin its single startup reconciliation only after MetadataCache load completes and configured providers have registered. Non-provider vault events MUST NOT invalidate Search. Failed, cancelled, or undrained work MUST NOT advance a checkpoint.

## LN-PKG-113 — @lapis-notes/ai: serve empty-query Agents palette rows from portable

<a id="ln-pkg-113"></a>

**Requirement.** `@lapis-notes/ai` MUST serve empty-query Agents palette rows from portable conversation files without enumerating or rebuilding the global Search store. Workspace layout readiness MUST NOT trigger AI conversation-index repair. Normalized no-op settings updates MUST NOT rewrite plugin data and invalidate warm-start manifests.

## LN-PKG-116 — MetadataCache: instrument database-ready load, checkpoint hit or miss

<a id="ln-pkg-116"></a>

**Requirement.** `MetadataCache` MUST instrument database-ready load, checkpoint hit or miss, full reconciliation, and bounded manifest batches through the App telemetry contract. Completion, cancellation, and failure events MUST carry only checkpoint state and aggregate file or batch counts; they MUST NOT include vault identity, file paths, parser output, note content, or error messages. Disabled hosts MUST retain identical behavior through the no-op service.

## LN-PKG-117 — Independent Graph package ownership

<a id="ln-pkg-117"></a>

**Requirement.** `@lapis-notes/graph` MUST live in the sibling `lapis-plugins` monorepo as an independently versioned installable plugin. It MUST expose its plugin, controls overlay, embed, renderer, views, settings, types, and styles through public package exports, depend on API and Design Core rather than `@lapis-notes/ui`, and retain runtime id `lapis-graph`.

## LN-PKG-123 — @lapis-notes/desktop-deno: generate its macOS development WebView and CEF

<a id="ln-pkg-123"></a>

**Requirement.** `@lapis-notes/desktop-deno` MUST generate its macOS development WebView and CEF hosts under ignored `release/dev-laufey`. Reuse MUST require a matching Deno version, backend, application name, and identifier, repairing an invalid signature before reuse. The launcher MUST ad-hoc sign after identity patching and Deno runtime insertion, accept an unchanged runtime only while its deep strict signature remains valid, then pass the generated parent through `LAUFEY_DEV_DIR`; Linux and packaged output retain their existing paths.

## LN-PKG-124 — @lapis-notes/desktop-deno: privately own session-scoped startup recovery persistence

<a id="ln-pkg-124"></a>

**Requirement.** `@lapis-notes/desktop-deno` MUST privately own session-scoped startup recovery persistence and presentation while reusing the public API `AppSafeModeState` and Design Core startup surface. It MUST retain saved vault profiles after recoverable open failures, preserve native filesystem failure classes, and avoid adding public package exports or desktop-only canonical vault settings.

## LN-PKG-129 — Independent framework package releases

<a id="ln-pkg-129"></a>

**Requirement.** Public Lapis Notes framework packages MUST start at version `0.1.0`, publish independently in dependency order `@lapis-notes/ui`, `@lapis-notes/api`, `@lapis-notes/language-service`, `@lapis-notes/file-explorer`, then `@lapis-notes/workspace`, and keep internal runtime ranges compatible with the published provider version before a dependent package can be released.

## LN-PKG-130 — Release workflow: keep Changesets version PR creation, build

<a id="ln-pkg-130"></a>

**Requirement.** The release workflow MUST keep Changesets version PR creation, build and retain a verified tarball manifest, stop with a manual-publish notice while an npm package is not registered, use npm trusted publishing with OIDC after bootstrap through the `npm-production` environment, and create package-scoped GitHub releases from the verified manifest. A partial manifest MAY omit published internal dependencies but MUST preserve dependency order among selected packages. All GitHub Actions jobs MUST use Node 24 and current Node 24-based action majors.

## LN-PKG-131 — Public package checks: reject missing README, changelog, license, repository, homepage

<a id="ln-pkg-131"></a>

**Requirement.** Public package checks MUST reject missing README, changelog, license, repository, homepage, bugs, or public publish metadata; tarball checks MUST reject local dependency protocols, private package runtime references, wrong source repository URLs, generated artifacts, and clean-consumer import failures for documented UI, API, Workspace, and CSS entrypoints.

## LN-PKG-133 — Sibling lapis-plugins repository: own source, behavior specifications, tests, release tooling

<a id="ln-pkg-133"></a>

**Requirement.** The sibling `lapis-plugins` repository MUST own source, behavior specifications, tests, release tooling, and one repository-level Storybook for AI, Bases, Bookmarks, Graph, History, Markdown, Markdown Lint, Search, Source Editor, Spellcheck, and Word Count. Lapis Notes MUST retain only framework, application-profile, host, and install-management integration contracts for those packages.

## LN-PKG-134 — Lapis manifests and lockfile: consume extracted plugins through registry semver ranges

<a id="ln-pkg-134"></a>

**Requirement.** Lapis manifests and lockfile MUST consume extracted plugins through registry semver ranges and bind their API peer to the colocated framework. A git-ignored hook MAY redirect only those ranges to checksum-verified sibling tarballs without changing host ranges or lockfile; its stamp MUST distinguish a local `file:` package from the same registry version. Local preparation MUST preserve an existing hook so other source-package overrides remain composable. Web, desktop, Storybook, and AI development entrypoints MUST prepare that package-boundary install before launch.

## LN-PKG-135 — @lapis-notes/language-service browser providers: construct workers from package-stable emitted JavaScript URLs

<a id="ln-pkg-135"></a>

**Requirement.** `@lapis-notes/language-service` browser providers MUST construct workers from package-stable emitted JavaScript URLs using the standards-aligned module-worker form. Published output MUST NOT retain Vite query-suffix worker imports that require source-mode transformation.

## LN-PKG-136 — @lapis-notes/workspace: consume public Design Core filter, forms, Resizable

<a id="ln-pkg-136"></a>

**Requirement.** `@lapis-notes/workspace` MAY consume public Design Core filter, forms, Resizable, and settings entrypoints for its private plugin-management presentation. It MUST NOT republish those primitives, add a second shared component API, or move registry and install policy into Design Core.

## LN-PKG-139 — Hidden release-directory artifacts

<a id="ln-pkg-139"></a>

**Requirement.** The release workflow MUST upload the hidden `.release` directory as the immutable candidate artifact, including its manifest, plan, and tarballs, before any gated publication job can run.

## LN-PKG-140 — Push-triggered release runs: stop after preparing the verified candidate artifact

<a id="ln-pkg-140"></a>

**Requirement.** Push-triggered release runs MUST stop after preparing the verified candidate artifact. Package publication MUST require an explicit manual workflow dispatch with its `publish` input enabled, in addition to the protected `npm-production` environment and release-script approval guard.

## LN-PKG-141 — Post-publication verification of a partial manifest: install each selected package at its manifest

<a id="ln-pkg-141"></a>

**Requirement.** Post-publication verification of a partial manifest MUST install each selected package at its manifest version and every unchanged public framework package at its repository version from npm before exercising documented UI, API, Workspace, and CSS entrypoints.

## LN-PKG-142 — CI: populate package build outputs once, then run

The exact final Plugins version candidate is
`da7d8bb73541eb3421ca8fdfaf1eaaf2baecc850`. The fixture lane builds all active
archives from that commit for the complete Web installer lane; full application
interactions and both native packaged lanes remain blocking independently.

<a id="ln-pkg-142"></a>

**Requirement.** CI MUST populate package build outputs once, then run governance, quality, unit, static Storybook, interaction/accessibility, web acceptance, native packaged acceptance and release-artifact jobs concurrently before one stable `validate` aggregation job. Every required job MUST succeed; functional, interaction, and accessibility failures MUST block. Visual comparison MUST remain non-blocking.

## LN-PKG-143 — Release candidates: reuse the validated Turbo build graph

<a id="ln-pkg-143"></a>

**Requirement.** Release candidates MUST reuse the validated Turbo build graph and generate npm tarballs through an explicit already-built path. Publication MUST continue to require the downloaded immutable candidate, explicit manual dispatch, protected environment, OIDC, checksum verification, and existing bootstrap stop.

## LN-PKG-146 — Generated host-module catalogue: derive API modules from actual public package

<a id="ln-pkg-146"></a>

**Requirement.** The generated host-module catalogue MUST derive API modules from actual public package exports and retain canonical compatibility configuration. Web and desktop renderer builds MUST provide host-owned import-map entries for the public API modules used by signed first-party bundles and the bundled Markdown embed contract and approved singleton CodeMirror/Lezer modules. Every proxy MUST preserve its public exports and share the host module graph.

## LN-PKG-147 — @lapis-notes/api: own the transport-neutral multi-source plugin registry adapter

<a id="ln-pkg-147"></a>

**Requirement.** `@lapis-notes/api` MUST own the transport-neutral multi-source plugin registry adapter, verified-payload handoff, and persistent source enablement state. It MUST expose the host composition boundary and distribution-manager types through a lightweight public `plugin-distribution-host` subpath. The application profile MAY bind the published Community NIP-29 source and proof verifier to that subpath. The Workspace package MAY render and toggle source state through the public contract but MUST NOT import a Nostr protocol implementation, relay client, curator policy, or private key API.

## LN-PKG-150 — @lapis-notes/api/registry/schema: expose transport-neutral V2 catalog schemas, types, verified-input

<a id="ln-pkg-150"></a>

**Requirement.** `@lapis-notes/api/registry/schema` MUST expose transport-neutral V2 catalog schemas, types, verified-input V1 normalization, authored media fallback, and validated Changesets notes without importing Community, application boot, UI, or relay implementations.

## LN-PKG-079 — @lapis-notes/history: live in the sibling lapis-plugins monorepo, expose

<a id="ln-pkg-079"></a>

**Requirement.** `@lapis-notes/history` MUST live in the sibling `lapis-plugins` monorepo, expose build, check, test, publint, npm-package, and `.lapis-plugin` contracts, and publish its plugin, panel, views, and settings. It MUST depend on API and Design Core, MUST NOT depend on `@lapis-notes/ui`, and MUST persist revisions only through `AppDatabase`.

## LN-PKG-094 — @lapis-notes/api: depend on @lapismd/ai-host through its published npm

<a id="ln-pkg-094"></a>

**Requirement.** `@lapis-notes/api` MAY depend on `@lapismd/ai-host` through its published npm semver range and MUST import only `@lapismd/ai-host/file-tools`. `@lapis-notes/ai`, Search, and Markdown MUST NOT depend on `@lapismd/ai-host`.

## LN-PKG-081 — Root Docker visual staging: update sibling dependency overrides in pnpm-workspace.yaml, regenerate

<a id="ln-pkg-081"></a>

**Requirement.** Root Docker visual staging MUST update sibling dependency overrides in `pnpm-workspace.yaml`, regenerate the matching lockfile, and restore the root manifest, workspace configuration, and original lockfile before a frozen relink after capture. It MUST NOT depend on the retired manifest-level `pnpm.overrides` shape.

## LN-PKG-093 — Public @lapismd/terminal-host: live in the terminal-host repository, version independently

<a id="ln-pkg-093"></a>

**Requirement.** Public `@lapismd/terminal-host` MUST live in the `terminal-host` repository, version independently, and expose build, check, test, Deno embed, and CLI entries. Lapis hosts MUST consume it through published npm semver ranges. Deno desktop MUST pass the vault path, optional `cwd`, optional absolute `shell`, and a packaged verified native-library path.

## LN-PKG-161 — Complete web acceptance in CI

<a id="ln-pkg-161"></a>

**Requirement.** Pull-request and reusable CI MUST run the complete Web end-to-end suite against freshly built output after a frozen registry install. Failures MUST retain browser diagnostics and block the aggregate. Before production V2 cutover, CI MUST use a retained fixture from an exact frozen Plugins source candidate with ephemeral signing keys; production builds MUST ignore fixture trust.

Fixture builds verify their checkout and export source provenance in the executing
shell so the host workflow SHA cannot label another repository's artifacts.
The runner provisions Docker and builds the candidate server image with its
checksum-matched public pnpm hook and frozen registry installation.
Server acceptance seeds bootstrap credentials through stdin into a private
service-user-owned Docker volume and mounts it read-only into the candidate.

## LN-PKG-162 — Native packaged acceptance in CI

<a id="ln-pkg-162"></a>

**Requirement.** Pull-request and reusable CI MUST build validation-only packages on native macOS and Linux runners and execute cold packaged acceptance for first launch, URL handoff, controller, tools, services and clean close. Both platforms MUST complete independently and retain candidate artifacts. This lane MUST NOT publish, use production signing credentials or notarize.

The separately installed controller CLI is provisioned from exact released source
through its owning build and installer, in an isolated candidate area. Its npm SDK
does not substitute for that executable. Acceptance passes the explicit CLI path
and retains its runtime manifest alongside native package candidates.
The validation pin includes the source-owned portable dependency staging repair
on top of released 0.1.0 controller source; npm SDK ranges remain unchanged.

## LN-PKG-163 — Portable terminal dependency during desktop packaging

<a id="ln-pkg-163"></a>

**Requirement.** Desktop packaging MUST read native artifact metadata from the public npm Terminal Host export and resolve its Deno runtime through the public npm Deno entry. A clean checkout MUST NOT require a sibling Terminal Host checkout. Native downloads MUST retain checksum verification.

## LN-PKG-164 — Complete version changelogs

<a id="ln-pkg-164"></a>

**Requirement.** Version preparation MUST preflight each public changelog formatter and reject a package whose current version has no non-empty changelog section before and after Changesets runs. Markdown formatting MUST NOT require optional code-only formatter plugins.

## Approved registry consumer snapshot — 2026-10-14

Desktop application releases use the separate `desktop-v<version>` tag namespace
and the private desktop package version. The source-owned packaging pipeline
produces three native candidates (macOS ARM64 and Linux ARM64/x86-64), qualifies their actual Homebrew installations,
and publishes immutable archives with a source-bound manifest. Manual dispatch
remains validation-only; native jobs select and verify the pinned Node and Deno
toolchain after Homebrew setup modifies PATH. The Homebrew tap
executes Linux runtime preflight from the absolute staged bundle and
consumes that contract rather than rebuilding the application or substituting
local npm dependencies; see LN-DENO-079 through LN-DENO-083. npm Changesets and
desktop releases retain independent version and publication flows.
The first tagged desktop release is `2026.31.5`; its three verified archives and
manifest bind source commit `9fed4f1577a6beb27168d0b83b9ea42408d4f1b1`.
See the [release record](../../records/2026-10-14-homebrew-desktop-release.md).

Server-host browser qualification uses the client built from these public
package boundaries. Its restart test retains the test network namespace while
recreating the serving container and verifying persisted data; it does not
substitute a warm browser-only check for server shutdown and startup.
The initial browser navigation may repeat once for an observed same-origin
Chromium document or script `ERR_NETWORK_CHANGED` abort. It records that retry
and retains every readiness and later application assertion; other failures and
a repeated transport failure remain failed acceptance.
The server case launches its own browser worker after preparing that namespace.
Recovery reports persist as JSON files in the test output directory and attach
by path. Both Web Playwright configurations preserve passing test output so the
always-run CI artifact upload can retain successful recovery evidence.

The private application profile and root catalog consume the approved plugin
batch through npm ranges: AI 0.1.5; Bases, Bookmarks, Graph, Search and Spellcheck
0.1.3; History 0.1.4; Markdown 0.1.6; Markdown Lint, Source Editor and Word Count
0.1.2. Slides 0.1.0 remains available through installed-plugin management rather
than the static profile. The tracked lockfile resolves public npm packages;
test-signed archive fixtures remain separate acceptance inputs.

<!-- ci-dependency-image:start -->

## Current CI dependency image

- Image: `ghcr.io/lapismd/lapis-notes-ci@sha256:fe28e5a789f6266bd48b3a7922d3bfe8f823af7d892c07b252f43dbb252ba96e`
- Lockfile tag: `lock-f2f65624a7eaf81d`
- pnpm-lock.yaml SHA-256: `f2f65624a7eaf81dea6ab27ff21633c999972677224d7558b001d6b160dea915`

<!-- ci-dependency-image:end -->
