# Architecture / Dependency boundaries

Framework packages and application hosts require published Design Core
`^0.5.0`, including its prepared browser CSS and bundled font assets. The
registry dependency refresh retains public export resolution and existing
application-owned state; it does not activate Sync or publish local host work.
Notes declares its own Prettier and JSDoc formatter development dependencies;
Design Core's authoring tools are no longer supplied as runtime dependencies.

Retained UI dependencies install from the published manifest. The lockfile
records `clsx`, `tailwind-merge`, `bits-ui` and `@lucide/svelte` as UI runtime
dependencies, so a clean production consumer does not rely on workspace
development dependencies.

Dependency-image refreshes follow LN-GOV-050 when proposing the new digest:
merged and closed reviews produce a fresh PR rather than absorb a later pin.

The shared base is the approved multi-architecture `lapis-ci:2026.10.14.1`,
pinned by digest. It provides checksum-verified GitHub CLI 2.102.0 for release
records. Direct workflow pins and the dependency-only Docker base must agree;
the dependency image is rebuilt before its immutable digest is consumed.

Release version preparation validates formatter availability and current-version
changelog notes under [LN-PKG-164](../packages/releases-and-exports.md#ln-pkg-164).
Its cached regression inputs include package changelogs and formatter configs.

Local package tests already use Turbo. Repository-level test commands follow
[the local test task contract](../packages/vault-and-storage.md#ln-pkg-159),
with fresh execution for tests of external state.
Development specification acceptance uses the
[portable installed-graph startup](../storybook-catalog/build-and-process.md#ln-cat-117)
so standalone CI needs no sibling release directory.

The API accepts the Mira 0.1 public-export line alongside its existing 0.0.5
range for isolated Lapis Desktop shared-screen acceptance. Package source and
installed applications retain their existing ownership.

## LN-ARCH-001 — Repository: a pnpm workspace orchestrated by Turbo. Targeted

<a id="ln-arch-001"></a>

**Requirement.** The repository MUST be a pnpm workspace orchestrated by Turbo. Targeted host builds and distribution or acceptance preflights MUST select the host and dependency closure through the root Turbo graph so unchanged work can use the shared cache.

## LN-ARCH-002 — Framework and private application packages: live under packages/\* and expose appropriate build

<a id="ln-arch-002"></a>

**Requirement.** Framework and private application packages MUST live under `packages/*` and expose appropriate build, check, and test scripts. The eleven extracted first-party plugin packages MUST be owned by the sibling `lapis-plugins` workspace rather than duplicated as long-term Lapis Notes sources.

## LN-ARCH-017 — @lapismd/mira-editor, @lapismd/mira-plugin-mermaid, and @lapismd/mira-plugin-ai: consumed through published npm semver ranges

<a id="ln-arch-017"></a>

**Requirement.** `@lapismd/mira-editor`, `@lapismd/mira-plugin-mermaid`, and `@lapismd/mira-plugin-ai` MUST be consumed through published npm semver ranges for `@lapis-notes/markdown` document rendering. Consumers MUST resolve their public package exports, and Mira source changes MUST be released before Lapis consumes them through tracked manifests.

## LN-ARCH-003 — Lapis Notes repository catalog: one Storybook on port 7010 (pnpm dev)

<a id="ln-arch-003"></a>

**Requirement.** The Lapis Notes repository catalog MUST be one Storybook on port 7010 (`pnpm dev`) for framework, application-profile, host integration, and plugin-management UI. The sibling `lapis-plugins` repository MUST use one repository-level Storybook for all eleven extracted packages rather than one Storybook per package.

## LN-ARCH-004 — Import-resolution gate policy

<a id="ln-arch-004"></a>

**Requirement.** The monorepo MUST NOT reintroduce multi-script first-party import-resolution gates; resolution issues MUST be fixed inline when packages are added.

## LN-ARCH-005 — @lapismd/design-core: consumed through a published npm semver range

<a id="ln-arch-005"></a>

**Requirement.** `@lapismd/design-core` MUST be consumed through a published npm semver range; consumers MUST resolve its declared package exports, while source fixes remain owned by the Design Core repository. Reusable sidebar view-host sizing MUST remain Design Core-owned, while Lapis plugins fill the bounded host without consumer-side layout overrides.

## LN-ARCH-014 — @lapismd/mira: consumed through a published npm semver range

<a id="ln-arch-014"></a>

**Requirement.** `@lapismd/mira` MUST be consumed through a published npm semver range for the source-editor CodeMirror shell; consumers MUST resolve its built package exports, while source fixes remain owned by the Mira repository.

## LN-ARCH-006 — Root pnpm check: run pnpm check:no-tailwind before Turbo package checks

<a id="ln-arch-006"></a>

**Requirement.** Root `pnpm check` MUST run `pnpm check:no-tailwind` before Turbo package checks so Tailwind utility regressions in ui/api component sources fail closed.

## LN-ARCH-007 — @lapis-notes/workspace: a presentation/controller integration package; vault selection, routing

<a id="ln-arch-007"></a>

**Requirement.** `@lapis-notes/workspace` MUST be a presentation/controller integration package; vault selection, routing, persistence boot, plugin loading, and the selected static profile remain application or API responsibilities. The package MAY render app-registered plugin-management pages and injected README content without importing a plugin implementation.

## LN-ARCH-011 — Storybook-local source plugins: declare CodeMirror language packages as root development

<a id="ln-arch-011"></a>

**Requirement.** Storybook-local source plugins MAY declare CodeMirror language packages as root development dependencies. CodeMirror/Lezer singleton peers shared with published packages MUST also be explicit root development dependencies; neither case moves demo plugin policy into api or workspace.

## LN-ARCH-012 — Storybook: resolve Design Core, Mira, and extracted plugin

<a id="ln-arch-012"></a>

**Requirement.** Storybook MUST resolve Design Core, Mira, and extracted plugin entry points through installed package dependencies and public package exports. Docker visual capture MAY temporarily install ignored staged package copies, but Lapis-owned Vite configuration MUST NOT bypass external packages with source aliases. Framework packages owned by Lapis Notes MAY resolve from their workspace source roots.

## LN-ARCH-013 — Storybook: resolve the API editor, editor-core, and editor-language-service

<a id="ln-arch-013"></a>

**Requirement.** Storybook MUST resolve the API editor, editor-core, and editor-language-service subpaths from the same API source root as the root API alias. Source-editor fixtures MUST NOT mix packaged and source editor state fields or implementations.

## LN-ARCH-018 — Root Storybook tooling: resolve @lapismd/storybook-addon-visual-delta from its published npm semver

<a id="ln-arch-018"></a>

**Requirement.** Root Storybook tooling MUST resolve `@lapismd/storybook-addon-visual-delta` from its published npm semver dependency; registry-package staging remains owned by Visual Delta and MUST NOT move the tool into a runtime package dependency.

## LN-ARCH-019 — Design Core: the sole owner of trigger-based overlay portal

<a id="ln-arch-019"></a>

**Requirement.** Design Core MUST be the sole owner of trigger-based overlay portal resolution. Lapis consumers MUST compose its public Popover, Hover Card, Tooltip, Dropdown Menu, Context Menu, and Select exports, inherit their trigger-owner-document behavior, and MUST NOT publish a competing overlay portal context, package export, or Vite alias.

## LN-ARCH-022 — Specification validation before package checks

<a id="ln-arch-022"></a>

**Requirement.** Root `pnpm check` MUST run shared configured specification validation before the no-Tailwind and Turbo package checks. Root `pnpm test` MUST run Lapis package tests without copying the shared validator's own regression suite.

## LN-ARCH-025 — Design Core: own reusable diagnostics state and Problems presentation

<a id="ln-arch-025"></a>

**Requirement.** Design Core MUST own reusable diagnostics state and Problems presentation. Lapis API MUST adapt that contract to plugins, vault navigation, and language services; provider packages MUST remain independent of Design Core and workspace layout.

## LN-ARCH-028 — Deno desktop host: remain a consumer of @lapis-notes/api and @lapis-notes/workspace

<a id="ln-arch-028"></a>

**Requirement.** The Deno desktop host MUST remain a consumer of `@lapis-notes/api` and `@lapis-notes/workspace`. Native lifecycle, vault discovery and selection, session boot, and bounded bindings belong to the host; the workspace package MAY forward generic navigation presentation while rendering and persisted layout compatibility remain in their owning packages.

## LN-ARCH-041 — External-plugin dependency closure, including the public workspace: cross repository boundaries through published package exports

<a id="ln-arch-041"></a>

**Requirement.** External-plugin dependency closure, including the public workspace shell used by plugin catalogs, MUST cross repository boundaries through published package exports and portable semver manifests. Colocated workspaces MAY resolve matching sibling versions locally, but consumer manifests and packed artifacts MUST NOT encode machine-specific paths.

## LN-ARCH-042 — Bases: own its query controller, document model, rendering

<a id="ln-arch-042"></a>

**Requirement.** Bases MUST own its query controller, document model, rendering helpers, view layouts, editing workflows, semantic CSS, private table-track model, measured variable-height rows, and compact table-control density. API owns App, database, metadata, plugin, editor, and Markdown processor contracts; Design Core owns shared input, autocomplete, Select, Popover sizing, and Accordion indicator primitives; hosts own boot and persistence ordering. Source-linked Storybook MUST preserve the package's public-entrypoint runtime semantics and deduplicate shared component runtimes such as `bits-ui` across linked packages.

## LN-ARCH-046 — Reusable editor presentation: enter through the API editor package while

<a id="ln-arch-046"></a>

**Requirement.** Reusable editor presentation MUST enter through the API editor package while language plugins retain rich extension and toolbar policy. Its public embedded editor MUST support self-owned or ancestor-owned vertical scrolling without a second scroll host. External plugins MUST NOT import bundled-plugin implementation files or create a competing CodeMirror persistence path.

## LN-ARCH-047 — Domain file previews: delegate whole-file editing to the registered Markdown

<a id="ln-arch-047"></a>

**Requirement.** Domain file previews MAY delegate whole-file editing to the registered Markdown leaf through public serialized view state. Markdown MUST retain editor, settings, keybinding, and persistence ownership while the domain plugin owns only the return target and its structured preview. Linked external-plugin catalogs MUST deduplicate the API peer runtime so compatibility view identity and chrome projection remain valid.

## LN-ARCH-049 — Pnpm-workspace.yaml: limit workspace membership to Lapis-owned directories. Published

<a id="ln-arch-049"></a>

**Requirement.** `pnpm-workspace.yaml` MUST limit workspace membership to Lapis-owned directories. Published external LapisMD packages MUST resolve through registry dependency ranges in tracked manifests and lockfiles, never external workspace membership or checkout-specific paths. Their host-runtime peers MUST resolve to matching colocated workspace packages, through host-owned import-map entries where browser ESM plugins consume shared modules, rather than duplicate registry copies.

Security remediation uses bounded third-party version overrides and registry
lockfile resolution. The October 2026 refresh preserves YAML 3/4 API families,
aligns the Vitest 4 tools, and checks Simple Git 4 against the native caller's
clone API. Changesets 3 removes the obsolete glob/YAML reader chain; root
development tooling consequently requires Node 22.11 or newer. Public package
versions and external LapisMD dependency ranges remain unchanged. See the
[dependency audit record](../../records/2026-10-14-notes-dependency-audit.md)
for compatibility evidence, the before/after advisory counts, and the user's
temporary acceptance of the unpatched QMD development advisory.

## LN-ARCH-052 — API: retain the shared CodeMirror autocomplete extension while

<a id="ln-arch-052"></a>

**Requirement.** API MUST retain the shared CodeMirror autocomplete extension while UI owns its completion-popover stylesheet and application hosts load that public stylesheet after Design Core paint. Bases owns only its inline query-editor surface and focus treatment and MUST NOT gain a runtime dependency on the pruned UI package.

## LN-ARCH-067 — Deno desktop host: remain a consumer of @lapis-notes/api, @lapis-notes/workspace,

<a id="ln-arch-067"></a>

**Requirement.** The Deno desktop host MUST remain a consumer of `@lapis-notes/api`, `@lapis-notes/workspace`, and public host packages. Native window, bindings, services, vault discovery, session boot, and local distribution orchestration belong to the host. Language diagnostics MUST remain plugin-owned over the public native boundary without a duplicate host provider; terminal execution and verified asset metadata MUST use public boundaries while watching and HTTP delivery remain Deno-owned.

## LN-ARCH-072 — Local observability: remain owned by the Deno desktop host

<a id="ln-arch-072"></a>

**Requirement.** Local observability MUST remain owned by the Deno desktop host and use the API telemetry boundary. Telemetry development launch MUST require an available loopback collector and MUST NOT require a first-party plugin, product setting, remote collector, or telemetry-enabled production package.

## LN-ARCH-073 — API: expose its transport-neutral telemetry contract

<a id="ln-arch-073"></a>

**Requirement.** API MUST expose its transport-neutral telemetry contract through a narrow package entry. The Deno desktop renderer and native host MAY supply local exporters and propagation, but plugins and portable packages MUST remain exporter-neutral.

## LN-ARCH-085 — Source Editor package: own host-neutral text, JSON, and YAML file

<a id="ln-arch-085"></a>

**Requirement.** The Source Editor package MUST own host-neutral text, JSON, and YAML file associations plus shared source-editor settings. Desktop, web, and Storybook MUST load that public plugin before Markdown, while Markdown retains exclusive ownership of Markdown associations and rich rendering policy.

## LN-ARCH-087 — Public package release workflows: remain distribution infrastructure for @lapis-notes/ui, @lapis-notes/api, @lapis-notes/language-service

<a id="ln-arch-087"></a>

**Requirement.** Public package release workflows MUST remain distribution infrastructure for `@lapis-notes/ui`, `@lapis-notes/api`, `@lapis-notes/language-service`, `@lapis-notes/file-explorer`, and `@lapis-notes/workspace`, in dependency order. They MUST NOT move host boot, application-owned static profiles, vault selection, persistence, desktop native bindings, web routing, or installed-plugin policy into those public packages.

## LN-ARCH-089 — Workspace-owned plugin management: distinguish installed vault artifacts from statically bundled

<a id="ln-arch-089"></a>

**Requirement.** Workspace-owned plugin management MUST distinguish installed vault artifacts from statically bundled profile plugins. Uninstall and disable actions MUST remain App-owned lifecycle operations and reuse the installed-plugin confirmation boundary without transferring package removal policy to Design Core.

## LN-ARCH-094 — Bounded Turbo task execution

<a id="ln-arch-094"></a>

**Requirement.** Root package build, check, and test tasks MUST run through a bounded Turbo wrapper that defaults to half the available processors capped at four and honors `TURBO_CONCURRENCY`. Signed organization remote caching MUST fail open to normal local execution when credentials or the cache service are unavailable.

## LN-ARCH-095 — CI: consume a digest-pinned lockfile-specific lapis-notes-ci image built

<a id="ln-arch-095"></a>

**Requirement.** CI MUST consume a digest-pinned lockfile-specific `lapis-notes-ci` image built over the shared multi-architecture `lapis-ci` toolchain. The dependency layer MUST contain only the pnpm store derived from manifests, patches, and the lockfile; source and reusable `node_modules` MUST remain outside the image.

<!-- ci-dependency-image:start -->

## Current CI dependency image

- Image: `ghcr.io/lapismd/lapis-notes-ci@sha256:fe28e5a789f6266bd48b3a7922d3bfe8f823af7d892c07b252f43dbb252ba96e`
- Lockfile tag: `lock-f2f65624a7eaf81d`
- pnpm-lock.yaml SHA-256: `f2f65624a7eaf81dea6ab27ff21633c999972677224d7558b001d6b160dea915`

<!-- ci-dependency-image:end -->

## Browser acceptance network ownership

Web server-restart acceptance owns its disposable Docker network holder and
serving container. The holder retains one loopback-published namespace while
the server is stopped and recreated; production host networking and remote
vault adapters remain governed by their existing contracts.
Its dedicated browser worker starts after network preparation, so preceding
PWA cases cannot carry delayed Docker interface events into initial navigation.
