# Architecture / Context — Part 3

- Root scripts stay thin: configured shared specification validation, `check:no-tailwind`, Turbo for package tasks, `spec:first` for change mapping, and Storybook for docs.

- Root `restart:web` frees the web Vite port, then starts the existing `dev:web` lane.

- Do not grow a parallel script forest for import path syncing.

- Lapis policy stays in `spec-validator.config.mjs`, while reusable validators and their tests stay in `@lapismd/spec-validator`.

- QMD discovery uses that same root-only tooling boundary.

- Storybook manager-only dependencies, including the shared theme toolbar icons, remain root development tooling and do not enter the runtime package graph.

- Web and Deno own their Vite renderer interop policy.

- Registry package source continues through the appropriate Svelte transform, while deep Mira modules and their transitive CommonJS dependencies are pre-bundled before a native browser module loader sees them.

- Local tarball installation preserves the committed registry lockfile and invalidates generated consumer caches only when the verified release-candidate fingerprint changes.

- The repository-local Storybook structure audit consumes the same structured command-panel registry as the visual catalog so command metadata, canonical story paths, and six-placement coverage cannot drift independently.

- Hosts still start metadata index load after layout; file-scoped Markdown panels query persisted rows at `loaded` and refresh from revisioned changes without blocking shell mount.

- The metadata controller keeps only a 512-entry access-ordered hot set during normal production use.

- A community or official compatibility plugin may hold a reference-counted snapshot lease; the first lease materializes the full maps, committed database changes refresh them, and the last release returns the controller to the bounded hot set.

- Core and system code never acquire this lease and consume the indexed query boundary instead.

- First-party panels suppress stale async results with a local generation and translate committed database revisions into only the queries their surface owns.

- A query failure remains visible and never selects snapshot enumeration as a fallback.

- The deterministic metadata performance runners seed the same normalized schema for native and real WASM/OPFS sessions.

- Their 50,000-note gate measures direct database readiness and indexed queries without mounting a vault-sized JavaScript model; the 100,000-note lane remains reported stress evidence.

Desktop managed-controller test fixtures preserve the public ready descriptor, including its schema, so host-boundary assertions verify the same connection shape as the supervised process.

The public Tasks projection v4 adds optional low/medium/high priority as an
indexed sortable field. Task Markdown remains owned by the external Tasks
package; hosts rebuild disposable projection rows through its registration.

Local plugin preparation excludes published Design Core, Mira-family, and Spec
Validator entries from tarball remapping and install fingerprints. Existing
plugin and unpublished AI Controller acceptance remains separate
from these registry foundations.

For LN-PLUG-092, plugin-management presentation composes shared V2 metadata through public package exports. Packed API acceptance uses one public API class identity and lets the Workspace Vitest graph transform dependency modules through Vite rather than substituting a private API barrel.

Local signed-registry acceptance (LN-PLUG-095) composes the public App options
inside App Profile. Only the configured virtual HTTPS artifact origin maps to
the loopback fixture transport; signed content and all installer verification
boundaries remain authoritative.

For LN-PKG-146, canonical host-module configuration and current API exports
regenerate the catalogue before package output. App Profile supplies pure build
metadata; each host supplies its own Vite plugin and emits public module proxies
from the same graph as the application. No registry bundle uses source aliases.

The signed plugin editor runtime also shares the approved CodeMirror and Lezer
core modules through LN-PKG-146 host entries. Language grammars remain local to
the plugin while editor classes, facets, and parser node properties resolve
through the same graph as the API editor.

LN-PKG-149 binds compiled Svelte archives to the exact renderer ABI supplied by
the host. Generated versioned entries and browser import maps share that module
graph without exposing original private host specifiers. API and host Svelte
peers retain the exact qualified compiler version; dependency drift fails the
host-catalogue build before archives can be installed.

The API owns pure registry schema and build-tooling subpaths. Community relay composition remains deferred outside active application sources; the static registry, hosts, and plugin release tooling consume API exports. Build tooling has no renderer platform in the generated host catalogue.

The default app owns Plugins view/ribbon registration through App Profile. Workspace owns transport-neutral presentation and an App-scoped registry controller shared with Settings; the API remains the verified distribution boundary (LN-PLUG-098–103). Community components supply presentation references only, without loading its runtime.

The public `Notice` constructor declaration exposes its implemented optional
App argument. App-owned registry actions pass that App explicitly, so notices
follow the owning host rather than compatibility state.

The dependency-image pin PR records its exact verified image digest, lockfile
tag, and lockfile hash here alongside the image ownership contract
(LN-ARCH-095). This generated evidence changes with each pin; it does not alter
host or package ownership.

<!-- ci-dependency-image:start -->

## Current CI dependency image

- Image: `ghcr.io/lapismd/lapis-notes-ci@sha256:5ef79cba3c761db0cacb95aacf87ab3c4d70c4b24aba8d8272449a75737c2fe6`
- Lockfile tag: `lock-2f660c227301649f`
- pnpm-lock.yaml SHA-256: `2f660c227301649f86cc72851fb8ae0c6556f17e78cfcc2d7256f84e42664df3`

<!-- ci-dependency-image:end -->

Static Storybook output and successful interaction/a11y results are CI-owned
Turbo tasks (LN-PKG-153 through LN-PKG-155). They depend on the workspace build
graph so cached results cannot conceal missing API build-tool exports. The
wrapper partitions result identity by the actual Node runtime, OS and CPU;
root task inputs include directly aliased workspace sources and toolchain
configuration. Application and plugin ownership remain unchanged.

API build-cache outputs include the generated source host-module catalogue as
well as `dist` (LN-PKG-156). Source-aliased hosts therefore see the same
regenerated catalogue after a cache restore as after a fresh package build.
The generator and its product contract remain API-owned.
