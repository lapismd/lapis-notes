# Packages / Vault and storage

The private `lapis-app-core` Rust crate owns the extracted native vault file
engine under the [shared service contract](../architecture/rust-application-services.md).
Existing TypeScript Vault and AppDatabase interfaces remain intact. Root
check/test/build include the independently qualified native lanes; this does not
replace the standalone browser backend or enable a hosted Rust adapter.

The private `lapis-app-protocol` crate owns portable commands, replies and editor
claims. `pnpm protocol:generate` emits schemas and TypeScript bindings, including
call/change DTOs exported by `@lapis-notes/api/app-database`. Packed declaration
checks require exact retained method/change parity. `pnpm check:protocol` checks
drift and positive/negative client fixtures in normal native/spec lanes. The
same guarded runner exports without a second target or disk-guard bypass.
Portable file actions retain shell operations and result metadata, excluding
host-only OS commands. Native admission consumes a retained root capability
without reopening its path.

The retained API projection-value implementation and native database storage
share the API-owned `__tests__/fixtures/projection-values.json`. Their independent tests verify
scalar conversion, missing values, arrays and typed columns; companion cases
retain field ordering, cardinality and text/row limits under LN-DB-017.
The API-owned projection-query fixture checks complete AST filtering, ordering,
selection and cursor continuation through both retained providers. Turso narrows
only provable SQL candidates before the shared evaluator cuts the final page.
Native projection readers consume that same query fixture independently, retain
bounded selected pages and generate their DTOs through the protocol drift gate.
This does not change either host's existing database-adapter selection.
API task-record fixtures independently qualify the retained providers and native
facade, including full recurrence/structure data and effective view membership.
Memory storage fixtures also qualify retained and native records, candidate
queries, exact origins, daily recall totals and renewable job transitions.

The Search-storage reference fixture retains prepared documents, manifests,
embedding states and statistics through Memory and Turso. Its counts and error
values are qualified before the native storage intake.
The API-owned Search-preparation fixture also qualifies native normalization,
scored breakpoints, tags, frontmatter text and UTF-16 offsets. LN-DB-058 keeps
generated cutoffs outside surrogate pairs in retained and native implementations.
This does not change public AppDatabase interfaces or select a native host
adapter; semantic inference and retrieval retain separate qualification gates.
Search-candidate conformance uses more than 100 eligible documents to qualify
case-sensitive, field, property, negative, provider and path queries through
Memory and both FTS-enabled and degraded Turso. Final result limits belong after
complete table evaluation, including path-only queries (LN-DB-059).
The Search-retrieval reference retains full result JSON for native intake,
including score/fusion detail, source metadata and UTF-16 snippet ranges. Native
retrieval and semantic inference are independently qualified before host adoption.

## LN-PKG-185 — Core vault listing exclusions

<a id="ln-pkg-185"></a>

**Requirement.** The API MUST own `files.exclude` for vault discovery, defaulting to `.git` and `.jj` at any depth. File/folder enumeration, list and glob APIs MUST apply current patterns and excluded ancestors. Exclusions MUST NOT delete data or change explicit adapter access, native admission, backup selection or plugin lifetime.

### Acceptance details

Discovery follows these rules:

- Patterns use the shared glob dialect with case-sensitive matching; an excluded folder hides all descendants while similarly named ordinary files remain visible.
- Core settings MUST expose an editable string list at Workspace / File discovery / Excluded paths without a plugin, retain stored values through the App configuration bridge and allow an empty list to disable discovery exclusions. Updated patterns MUST refresh listing consumers without reloading or modifying vault contents.
- Explicit resource lookup and adapter reads/writes MUST remain available to admitted metadata services; the setting is discovery policy, not an authorization boundary.

## LN-PKG-184 — Optional native system-trash port

<a id="ln-pkg-184"></a>

**Requirement.** Native Vault adapters MUST advertise system trash only with its implemented host capability and invoke it with a normalized admitted path. Root trash MUST reject before invocation. Unsupported capability or ENOTSUP MUST return explicit unavailability for the existing local-trash fallback; other provider errors MUST propagate without fallback. Handled native trash MUST project removal without a second filesystem deletion.

## LN-PKG-183 — App-owned watch ingestion

<a id="ln-pkg-183"></a>

**Requirement.** App MUST own an explicitly started watch/reconciliation service that awaits registration before its initial complete scan. It MUST bound/coalesce hints, reconcile after uncertainty, report failures through existing notifications and limit automatic retries. Stop MUST retire callbacks synchronously and drain registration, cleanup and scans; failed cleanup MUST remain retryable. Restart after a failed leave MUST register afresh and reconcile missed changes.

## LN-PKG-182 — Serialized vault mutation projection

<a id="ln-pkg-182"></a>

**Requirement.** Vault mutations and reconciliation MUST serialize IO through cache/tree/event projection so a scan cannot publish over an in-flight internal mutation. App operation admission MUST include queued work. Rejection MUST NOT poison later operations; internal method delegation MUST NOT deadlock by re-entering the queue.

- View projection MUST await admitted mutation guards before rebinding clean editors. Internal rename projections MUST retain event order and retire with their owning App; dirty external views retain their existing recovery owner.

## LN-PKG-180 — Stable vault tree reconciliation

<a id="ln-pkg-180"></a>

**Requirement.** Vault reconciliation MUST preserve canonical nodes, parents, children and filename indexes for unchanged or explicitly renamed resources. Modified content MUST invalidate cached bytes; renames and deletions MUST notify each affected descendant through existing lifecycle events. Internal rename, copy, trash and atomic writes MUST preserve unrelated identities and use the same tree projection.

## LN-PKG-181 — Complete bounded reconciliation snapshots

<a id="ln-pkg-181"></a>

**Requirement.** Reconciliation MUST bound snapshot entries and path storage, validate child paths and complete all required listing/stat operations before publishing tree changes. Incomplete or invalid scans MUST retain the previous complete tree and permit retry. Retired generations MUST NOT publish scanned changes. Successful scans MUST NOT write note bytes.

## LN-PKG-178 — Optional exclusive-create transport

<a id="ln-pkg-178"></a>

**Requirement.** Vault adapters MAY expose an exclusive-create capability and write port for text or binary bytes. Native adapters MUST require the advertised capability, preserve bytes, options and collision errors, and reject unsupported requests before invocation without an overwrite fallback. Capability absence MUST remain explicit. An advertised incomplete port MUST fail closed.

## LN-PKG-179 — New-file creation intent

<a id="ln-pkg-179"></a>

**Requirement.** Vault MUST expose explicit exclusive creation and preserve legacy low-level create semantics. FileManager new-file creation MUST use exclusivity when supported; Explorer new-note and landing actions MUST use this intent boundary. Admitted operations MUST span IO, cache/tree projection and creation events. Failed creation MUST NOT project success; existing destinations MUST remain unchanged on collision.

## LN-PKG-177 — Watch registration readiness

<a id="ln-pkg-177"></a>

**Requirement.** NativeWatchSubscription MAY expose registration readiness. Supporting adapters and DirectoryWatcher MUST preserve that promise, including array subscriptions, so owners can register watching before their initial reconciliation. Failed registration MUST remain observable through readiness without an unhandled background rejection. Closing during registration MUST retain cleanup ownership until the native start and stop boundary completes.

## LN-PKG-176 — Owned watcher retirement

<a id="ln-pkg-176"></a>

**Requirement.** DirectoryWatcher MUST retire callbacks synchronously when a subscription is replaced or closed. Its close boundary MUST await native cleanup and admitted polling, retain failed cleanup for retry, and reject incomplete polling snapshots without projecting deletions. Portable changes MAY carry an optional previous path for rename reconciliation. Array subscriptions MUST preserve options and await every owned subscription during closure.

## LN-PKG-172 — Protected text mutations

<a id="ln-pkg-172"></a>

**Requirement.** Conditional-capable hosts MUST apply frontmatter and metadata text mutations through the owning App's file-writer lifecycle. Mutations MUST drain and protect existing document writers before reading authoritative content, retain failed conditional drafts for explicit recovery, and block shutdown until persistence or discard succeeds. Queued mutations MUST serialize without reentering the guard. Cached metadata MUST NOT replace authoritative mutation input.

An admitted transform survives initial read failures; invalid transforms remain
rejected actions. A rejected recovery projection retains the writer barrier.

## LN-PKG-170 — Source-owned text conflict recovery

<a id="ln-pkg-170"></a>

**Requirement.** API MUST export a generic FileTextPersistence contract for document-owned conditional baselines and the owning App's text-conflict registry. Recovery MUST acquire protection before yielding and await asynchronous admission before resolving a conflict. Each concurrent operation MUST use its own acknowledgement, reset and release lease. Storage snapshots MUST remain independent of background cache reads; stale decisions MUST reject, and failed resets MUST retain the conflict.

Captured conflicts also expose `resolveMerged(text)`. It uses the same exact
snapshot, asynchronous protection and conditional replacement as keeping a draft.
Only a successful owner reset acknowledges merged text. Stale disk bytes, unreadable
snapshots and failed resets retain the conflict; a failed post-write reset may
require refresh to display the already-persisted result before retry.

Application-state recovery may restore runtime state outside the persistence
queue while retaining its owner lease. It revalidates the displayed disk bytes
after asynchronous restoration and acknowledges only after that check or the
conditional replacement succeeds. A failed or stale projection retains the
original local draft, including when the next decision keeps that draft.

## LN-PKG-169 — Conditional Vault writes

<a id="ln-pkg-169"></a>

**Requirement.** Vault MUST expose conditional text-write support and `modifyIfUnchanged` through the public built package. Unsupported adapters MUST reject conditional requests before IO. Successful writes MUST update the file tree, cache and modification events consistently; rejected writes MUST NOT acknowledge new contents through those projections.

## LN-PKG-167 — Optional conditional text writes

<a id="ln-pkg-167"></a>

**Requirement.** `VaultAdapter` MAY expose `writeTextIfUnchanged` with exact expected text or explicit expected absence. A supporting adapter MUST reject an observed mismatch without an unconditional-write fallback. The public package MUST expose the method's types. `MemoryVaultAdapter` MUST advertise and implement this existing capability with an atomic in-memory comparison, including expected absence and competing writes.

## LN-PKG-168 — Native conditional text transport

<a id="ln-pkg-168"></a>

**Requirement.** Native adapters MUST require an advertised `conditional-text-write` capability before conditional text IO. Missing or unavailable capability MUST reject before invocation. The adapter MUST transmit the explicit expected snapshot and preserve portable conflict errors without automatic retries or fallback writes.

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

**Requirement.** Private `@lapis-notes/deno-host-services` MUST own Deno filesystem, watch, resource, plugin-asset and durable opaque sync kernels governed by LN-ARCH-105. Private `@lapis-notes/host-services` MUST own runtime-independent path, language and native AppDatabase worker kernels, with retained Deno compatibility exports. Both packages MUST NOT own desktop windows, server authentication, HTTP routing, vault selection or Web composition.

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

## LN-PKG-145 — Private @lapis-notes/server-node: own the authenticated Node server, managed-vault control

<a id="ln-pkg-145"></a>

**Requirement.** Private `@lapis-notes/server-node` MUST own the authenticated Node server, managed-vault control database, tRPC router, direct data routes, static server-mode Web delivery, lifecycle, deployment packaging, and the browser adapter that translates public vault semantics into managed server requests. It MUST consume public Lapis interfaces and private portable host services.

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

Native core, companion and host acceptance use uncached root tasks. The opt-in
`test:search:onnx` lane also runs uncached: its default is offline, and only
`--download` admits missing pinned model assets after digest verification.

Managed FileManager trash follows LN-ARCH-145: the originally selected path
remains protected through writer drain and removal, including failed descendant
writes. Explorer uses this shared owner instead of low-level Vault trash.

The existing FileManager new-file intent under LN-PKG-179 also accepts Explorer attachment bytes. File Explorer admits asynchronous reading before calling it and retains the operation through projection. Native exclusive publication remains source-owned; import does not retry collisions through low-level overwrite APIs.

Native AppDatabase indexed-file intake retains LN-DB-061/062/063 through the
shared database owner; low-level core publication remains independent of plugin
projection work. The existing browser implementation remains explicit.

The native Search encoder is an independent Notes-owned component under
`lapis-app-core::embedding`; runtime/tokenizer files remain native host authority.
`test:search:onnx` qualifies model math, publication and retrieval under LN-DB-007.

AppDatabase owns portable Search configuration and invalidation. Memory and
Turso reuse the API's pending-record policy; native publication uses its actor.
Native model/cache file registration stays outside serialized configuration.

The semantic reference retains 16 Memory/Turso envelopes before Rust intake:
fusion ranks, scope filters, preferred chunks and provider-kind diagnostics. Five
extra cases qualify enhancement signals before limits; the call reference covers
85 requests, all 68 methods, defaults and undefined/null/void without host adoption.
