# Packages / Vault and storage

The native codec regression verifies the complete 256 KiB payload with exact
byte comparison rather than generic deep property traversal. Prototype, length,
canonical frames, invalid input and portable-fallback checks remain enforced
under the existing five-second test budget.

The desktop's native RPC codec remains host-owned and preserves the same
bounded JSON frames across Node and portable hosts under LN-DENO-088. The
[Sync release record](../../records/2026-10-14-sync-host-release.md) retains
cross-runtime codec and payload-isolation evidence; public exports are unchanged.

Development Docs acceptance uses installed package exports after its Turbo
build prerequisites; the [portable startup contract](../storybook-catalog/build-and-process.md#ln-cat-117)
keeps sibling release preparation outside standalone CI.

## LN-PKG-006 — Vault profile storage kinds: limited to opfs, file-system-access, and desktop-folder. LightningFS

<a id="ln-pkg-006"></a>

**Requirement.** Vault profile storage kinds MUST be limited to `opfs`, `file-system-access`, and `desktop-folder`. LightningFS / legacy browser IndexedDB vault adapters and host-framework-specific kinds (for example former `tauri-folder`) MUST NOT be retained.

## LN-PKG-010 — @lapis-notes/api: expose the reusable volatile vault and concrete

<a id="ln-pkg-010"></a>

**Requirement.** `@lapis-notes/api` MUST expose the reusable volatile vault and concrete source-text view required by the editor demo; application-specific source-editor and Explorer registration policy MUST remain outside the kernel.

## LN-PKG-044 — @lapis-notes/search: publicly expose its plugin, grouped result panel

<a id="ln-pkg-044"></a>

**Requirement.** `@lapis-notes/search` MUST publicly expose its plugin, grouped result panel, manager, settings model, semantic status, and settings tab. It MUST consume API database contracts and Design Core presentation without moving vault search policy into `@lapis-notes/workspace`.

## LN-PKG-058 — @lapis-notes/api search evaluation: derive queryable property records from normalized search-document

<a id="ln-pkg-058"></a>

**Requirement.** `@lapis-notes/api` search evaluation MUST derive queryable property records from normalized search-document metadata without mutating the vault metadata index.

## LN-PKG-062 — @lapis-notes/api Vault.getFilesByGlob: return current vault files matching the shared

<a id="ln-pkg-062"></a>

**Requirement.** `@lapis-notes/api` `Vault.getFilesByGlob` MUST return current vault files matching the shared editor-association glob dialect without adapter I/O. Exact case-sensitive filenames MUST use an indexed lookup, while filename and path globs MUST remain deterministic across vault lifecycle changes.

## LN-PKG-073 — Root web and desktop build scripts: select each host plus its dependency closure

<a id="ln-pkg-073"></a>

**Requirement.** Root web and desktop build scripts MUST select each host plus its dependency closure through Turbo. Host test and distribution preflights MUST invoke those root cached builds rather than rebuilding the host directly.

## LN-PKG-019 — Public Lapis FileEmbed wrapper: add optional editable and bindable editing inputs

<a id="ln-pkg-019"></a>

**Requirement.** The public Lapis `FileEmbed` wrapper MUST add optional `editable` and bindable `editing` inputs while defaulting to its existing read-only behavior. Editable full-note rendering MUST compose Mira's public `EditableMarkdownPreview`; direct `MarkdownEmbed`, `NoteLink`, and ordinary `FileEmbed` consumers MUST remain source-compatible. The package adapter owns only Lapis vault resolution and persistence, while Mira owns activation, CodeMirror, autosave serialization, dirty-buffer protection, and preview/editor mode changes.

## LN-PKG-086 — MetadataCache: keep database readiness, rebuild, and vault reconcile

<a id="ln-pkg-086"></a>

**Requirement.** `MetadataCache` MUST keep database readiness, rebuild, and vault reconcile under one `notifications.withProgress` handle. It MUST NOT fire-and-forget reconcile after that handle completes. Load reconciliation and rebuild progress reports MUST remain determinate with current and total processable file counts.

## LN-PKG-087 — MetadataCache: yield between files during load, rebuild,

<a id="ln-pkg-087"></a>

**Requirement.** `MetadataCache` MUST yield between files during load, rebuild, and vault reconcile so progress reports and input stay responsive while worker results are applied.

## LN-PKG-106 — MetadataCache: surface normalized AppDatabase data through async per-file

<a id="ln-pkg-106"></a>

**Requirement.** `MetadataCache` MUST surface normalized AppDatabase data through async per-file and query APIs. `loaded` MUST mean persisted queries are available, while reconciliation continues within the load operation and emits committed index changes.

## LN-PKG-108 — Retirement of automatic metadata snapshots

<a id="ln-pkg-108"></a>

**Requirement.** Automatic metadata snapshots under `.lapis/cache` MUST stop. Existing files MUST remain untouched, and missing or stale rebuildable metadata MUST be recovered from authoritative vault Markdown.

## LN-PKG-109 — First-party metadata consumers: use async indexed queries and revision-aware refresh

<a id="ln-pkg-109"></a>

**Requirement.** First-party metadata consumers MUST use async indexed queries and revision-aware refresh. A source audit MUST reject first-party enumeration of synchronous `fileCache`, `metadataCache`, `resolvedLinks`, `unresolvedLinks`, or `getAllItems`.

## LN-PKG-111 — @lapis-notes/desktop-deno: the sole private native desktop package at

<a id="ln-pkg-111"></a>

**Requirement.** `@lapis-notes/desktop-deno` MUST be the sole private native desktop package at `packages/desktop-deno`, retain version `2026.31.5`, and expose common build, check, test, CEF debug, icon-generation, current-platform, and explicit macOS/Linux distribution scripts. Root desktop scripts MUST select it without a `-deno` suffix, and no Windows distribution target is supported. Packaged smoke MUST assert native Turso, the shared four-plugin profile, configured-plugin persistence, and structured renderer-ready close acceptance, while vault resources MUST stay on the contained loopback route.

## LN-PKG-118 — @lapis-notes/api: expose backward-compatible indexed-metadata domain projections, ordered path-only

<a id="ln-pkg-118"></a>

**Requirement.** `@lapis-notes/api` MUST expose backward-compatible indexed-metadata domain projections, ordered path-only Search matching, the read-only MetadataCache reconciliation fingerprint, and disposable memory source/candidate/signal/job state. Memory, direct Turso, browser-coordinated, and desktop-native transports MUST retain one typed contract, and the native/browser method catalogues MUST forward derived-memory operations without exposing SQL or durable vault files.

## LN-PKG-119 — @lapis-notes/graph: own the canonical global coordinator, versioned AppDatabase

<a id="ln-pkg-119"></a>

**Requirement.** `@lapis-notes/graph` MUST own the canonical global coordinator, versioned AppDatabase snapshot, progress, stale-while-revalidate behavior, and debounced versioned settings persistence. Its one-time unversioned migration MUST replace only force values. Canonical graph data MUST remain independent from view lifetimes.

## LN-PKG-144 — Private @lapis-notes/deno-host-services: own reusable Deno filesystem, watch, resource, plugin-asset

<a id="ln-pkg-144"></a>

**Requirement.** Private `@lapis-notes/deno-host-services` MUST own reusable Deno filesystem, watch, resource, plugin-asset, language-service, native AppDatabase kernels, and durable opaque sync repositories governed by LN-ARCH-105. It MUST NOT own desktop windows, server authentication, HTTP routing, vault selection, or Web composition.

Its portable `test:sync-engine` script accepts a built engine path for development
qualification with native storage and opaque host security capabilities. The
plugin retains history-policy ownership; the native repository stays opaque.
The same package owns the guarded native vault's process lease, file-version
tracking, streamed working-copy staging and encrypted mutation receipts under
LN-ARCH-106 through LN-ARCH-108. The API exports protocol-neutral port types and
mutation-capture helpers; hosts retain platform setup, grants and lifecycle ownership.
LN-ARCH-109 adds an immutable opaque record port for separately sealed receipts.
The native journal retains active work while completed receipts remain indexed
outside its root record; no filename or receipt payload enters a plaintext index.
LN-ARCH-110 versions the indexed journal and upgrades supported legacy roots
before access, so an earlier non-indexed writer cannot ignore archived receipts.
LN-ARCH-119 through LN-ARCH-122 add API local-provider/guard contracts and the
private native adapter, exported through `deno-host-services/sync-local-provider`.
The adapter owns separate engine/apply stores and enforces an explicit host
inclusion policy. Desktop/server admission, editor protection, transport and
runtime activation remain host integrations. The package now also owns the
portable physical-root descriptor and guarded descriptor-read port under
LN-ARCH-123. LN-ARCH-124 adds optional expected-authority metadata to opaque
ports; production native RPC requires it while trusted low-level stores remain
compatible. Client engines must supply their captured fences before activation.

## LN-PKG-145 — Private @lapis-notes/server-deno: own the authenticated Deno server, managed-vault control

<a id="ln-pkg-145"></a>

**Requirement.** Private `@lapis-notes/server-deno` MUST own the authenticated Deno server, managed-vault control database, tRPC router, direct data routes, static server-mode Web delivery, lifecycle, deployment packaging, and the browser adapter that translates public vault semantics into managed server requests. It MUST consume public Lapis interfaces and private Deno host services.

## LN-PKG-151 — @lapis-notes/api/build/vite: own the reusable Turso browser-bundle transform used

<a id="ln-pkg-151"></a>

**Requirement.** `@lapis-notes/api/build/vite` MUST own the reusable Turso browser-bundle transform used by Notes hosts and plugin Storybook. It MUST preserve runtime data URLs and worker construction, leave unrelated modules unchanged, and emit portable declarations without a Vite peer dependency. Build tooling MUST NOT be advertised as a renderer host module.

## LN-PKG-152 — Storybook Pages publication: restore or build workspace package outputs

<a id="ln-pkg-152"></a>

**Requirement.** Storybook Pages publication MUST restore or build workspace package outputs through the existing Turbo wrapper before loading Storybook configuration. The workflow MUST report cache restoration and retain output verification before upload and deployment.

## LN-PKG-153 — Cached static Storybook builds

<a id="ln-pkg-153"></a>

**Requirement.** CI and Pages static Storybook builds MUST use a cacheable root Turbo task that depends on workspace builds and restores both `storybook-static` and Visual Delta build statistics. Output verification MUST still run before Pages upload.

## LN-PKG-154 — Cached Storybook interaction tests

<a id="ln-pkg-154"></a>

**Requirement.** CI Storybook interaction and accessibility tests MUST use a cacheable root Turbo task that depends on workspace builds and executes the complete existing shard sequence on a miss. Only successful results MAY be reused; failures MUST remain blocking and execute again.

## LN-PKG-155 — Storybook cache keys: include tracked root inputs, workspace source

<a id="ln-pkg-155"></a>

**Requirement.** Storybook cache keys MUST include tracked root inputs, workspace source and build configuration, dependencies and patches, CI image/setup inputs, Node version, platform, architecture, CI mode, Node options, and Playwright browser path. Cache-service credentials MUST NOT determine functional result identity.

## LN-PKG-156 — API Turbo build task: cache its generated source host-module catalogue alongside

<a id="ln-pkg-156"></a>

**Requirement.** The API Turbo build task MUST cache its generated source host-module catalogue alongside `dist`. Restoring a successful build on a fresh checkout MUST reproduce the same catalogue consumed by source-aliased Storybook and host validation as executing the build.

## LN-PKG-040 — @lapis-notes/language-service: export ./markdownlint/runtime for native Markdown services.

<a id="ln-pkg-040"></a>

**Requirement.** `@lapis-notes/language-service` MUST export `./markdownlint/runtime` for native Markdown services. The Deno desktop host MUST consume that public specifier instead of copying the runtime or importing a private implementation path. `@lapis-notes/markdown-lint` MUST remain the sole renderer provider and pass vault rules through the native adapter.

## LN-PKG-042 — @lapis-notes/workspace: forward Design Core's generic workspace-navigation contract

<a id="ln-pkg-042"></a>

**Requirement.** `@lapis-notes/workspace` MAY forward Design Core's generic workspace-navigation contract to its shell surface, but profile discovery, vault labels, selection, management, persistence, and lifecycle policy MUST remain consumer-owned.

## LN-PKG-074 — @lapis-notes/ai: own conversations, projection, Explorer-style history presentation, bindings

<a id="ln-pkg-074"></a>

**Requirement.** `@lapis-notes/ai` MUST own conversations, projection, Explorer-style history presentation, bindings, handoff, and replay provenance. Its history view MAY compose public Design Core search, sidebar-tree, disclosure, menu, badge, and switch primitives but MUST keep that search chrome centered and retain scope selection, filesystem/index merging, conversation actions, and workspace-view registration in AI. API MUST expose generic path, durability, search, highlighting, and native-event primitives through narrow entries. `@lapismd/ai-host` and Deno desktop MUST remain non-authoritative execution transports with only live native state and bounded replay.

## LN-PKG-077 — @lapis-notes/ai: own asynchronous chat preparation and conversation-location tab

<a id="ln-pkg-077"></a>

**Requirement.** `@lapis-notes/ai` MUST own asynchronous chat preparation and conversation-location tab reuse. `@lapis-notes/api` MUST remain limited to generic main-tab creation, sidebar-leaf registration, activation, and reveal contracts; workspace packages MUST NOT acquire AI-specific navigation policy. AI MUST project folder scope breadcrumbs through the public View chrome hooks.

## LN-PKG-159 — Local test task routing

<a id="ln-pkg-159"></a>

**Requirement.** Public local test commands MUST use the bounded Turbo runner. Deterministic repository-owned tests MUST reuse only successful results through registered tasks with explicit source, configuration, dependency, and runtime inputs. Internal raw runners MUST avoid recursion, and command arguments MUST participate in result identity. An explicit forced run MUST bypass successful result reuse.

## LN-PKG-160 — Tests of external state

<a id="ln-pkg-160"></a>

**Requirement.** Tests of live servers, installed native executables, external dependency staging, or baseline mutation MUST remain uncached while running through Turbo. Supplying live controller, terminal, or external Storybook configuration MUST disable result reuse and writes. Cold acceptance MUST use a forced run; cache-service credentials MUST NOT affect functional result identity.
