# Packages / Context — Part 3

- `@lapis-notes/file-explorer` publicly exports `ExplorerPanel` and exposes `selectedPath` plus a `file-explorer:selection-change` workspace event so other plugins can follow folder selection without importing Explorer internals.

- `@lapis-notes/ai` publicly exports `AiChatPanel`, `AiHistoryPanel`, and `AiCatalogPanel`, so Autodocs can name the production components while stories continue to create them through real plugin view registrations.

- The same public AI entry exports provider-neutral memory service, scope, retrieval, evidence, and typed turn-context contracts.

- The implementation and policy remain AI-owned; API owns only the generic AppDatabase and App-tool surfaces, and neither public boundary exposes ACP or consolidator-provider payloads.

- `MetadataCache.initialized` and `file-open` after `openFile` stay on the API kernel so Markdown file-scoped panels can refresh after late metadata load.

- Those panels share one follow helper and ignore a leaf event that repeats the same followed path.

- Restoring a non-file leaf still loads that view when its snapshot includes a follow `file` path.

- Backlinks and Outgoing Links read indexed link rows and async per-file metadata for only the active note and its candidate sources.

- They neither enumerate `getAllItems()` nor invert the synchronous link maps.

- The canonical check and specification lanes enforce this boundary with the first-party metadata-query source audit.

Desktop controller acceptance uses the managed client ready descriptor without dropping its schema; fixture connections follow the same public package contract.

The public Tasks projection v4 adds optional low/medium/high priority as an
indexed sortable field. Task Markdown remains owned by the external Tasks
package; hosts rebuild disposable projection rows through its registration.

API type checks now resolve Design Core through its published declarations;
the former local Design Core shim mappings are retired.

Local plugin preparation excludes published Design Core, Mira-family, and Spec
Validator entries from tarball remapping and install fingerprints. Existing
plugin and unpublished AI Controller acceptance remains separate
from these registry foundations.

The API owns the transport-neutral `@lapis-notes/api/registry/schema` contract. Static registry generation, plugin release notes, and Notes clients consume that lightweight export without Community. Temporary acceptance uses an ignored, checksum-pinned API tarball until the approved API publication. Concrete Community NIP-29 bindings remain deferred outside the active application profile.

For LN-PLUG-095, App Profile owns local acceptance configuration through public
App distribution options. Ephemeral public trust keys and loopback transport
remain development inputs rather than published package pins.

The Workspace package exports `PluginsView` and `PluginBrowser` for the app-owned Plugins browser (LN-PLUG-098–103). The private App Profile registers its view, ribbon, command, and disposable lifecycle; the four optional static plugin defaults remain unchanged.

Dependency-image pin updates record the exact immutable image and lockfile
inputs used for package validation below. The generated PR stages this evidence
alongside the pin so package build reproducibility stays reviewable under the
normal specification gate (LN-GOV-046).

<!-- ci-dependency-image:start -->

## Current CI dependency image

- Image: `ghcr.io/lapismd/lapis-notes-ci@sha256:5ef79cba3c761db0cacb95aacf87ab3c4d70c4b24aba8d8272449a75737c2fe6`
- Lockfile tag: `lock-2f660c227301649f`
- pnpm-lock.yaml SHA-256: `2f660c227301649f86cc72851fb8ae0c6556f17e78cfcc2d7256f84e42664df3`

<!-- ci-dependency-image:end -->

CI and the local `ci:release` parity script run `ci:storybook-static` and
`ci:storybook-interaction` through the bounded
signed Turbo wrapper (LN-PKG-153 through LN-PKG-155). Their raw root scripts
retain the existing static build/index audit and complete four-shard Vitest
sequence. Manual `build-storybook` and `test:storybook` stay direct execution
paths for development and live-host acceptance. Cached CI tasks receive only
isolated CI/toolchain options, not live controller or terminal credentials.
Cache misses and unavailable remote caching execute the existing commands.
