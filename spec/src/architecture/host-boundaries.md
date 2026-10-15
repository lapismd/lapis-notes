# Architecture / Host boundaries

Large-frame codec verification compares every byte directly while retaining
Uint8Array prototype and length checks. Native, Buffer and portable fallback
paths keep their canonical frame assertions and the existing test deadline;
only assertion overhead changes.

Desktop RPC codec acceleration retains the bounded, canonical frames under
LN-DENO-088. Node-decoded byte views own their payload storage; private codec
selection does not change host authority, wire formats or plugin access.

Static registry archive transport follows the API-owned signed delivery and
origin-fallback contract in [LN-PLUG-110 and LN-PLUG-111](../plugin-model/distribution-and-registry-01.md#ln-plug-110).
Web, server and native hosts share archive verification; a registry delivery
endpoint cannot change the selected release or grant additional plugin trust.

Desktop distribution follows LN-DENO-079 through LN-DENO-083. Lapis Notes owns
bundle construction, permissions, native launchers and runtime acceptance. The
Homebrew tap owns installation paths and desktop integration while consuming
the released source-bound archive contract. Core installation acceptance uses
an explicit native/renderer test scope; normal startup and full controller
acceptance retain their existing ownership and lifecycle boundaries.
The first release qualifies macOS ARM64 and Linux ARM64/x86-64. Intel macOS
remains deferred because the pinned Turso database lacks a published native
addon for that platform; the tap rejects that unsupported architecture.
Release `2026.31.5` verifies those host boundaries through tagged native
qualification; evidence is retained in the [release record](../../records/2026-10-14-homebrew-desktop-release.md).

Desktop routes new Sync security through the per-plugin provider boundary into
an admitted native profile/runtime session (LN-DENO-086 through LN-DENO-088).
The native host owns wrapping material, durable key storage and serialized
operations; renderer/plugin code receives scoped crypto results.

## LN-ARCH-009 — Api compatibility projection: preserve every persisted design-core V3 workspace region

<a id="ln-arch-009"></a>

**Requirement.** The api compatibility projection MUST preserve every persisted design-core V3 workspace region, including the bottom panel, while keeping the api-owned workspace writer as the only layout persistence adapter. Host-registered Problems leaves MUST remain that view type across API layout commits. Claimed leaves MUST keep their serialized id and live `getState()`, and file opens MUST target an empty or file-backed main leaf.

## LN-ARCH-015 — File-view chrome projection

<a id="ln-arch-015"></a>

**Requirement.** File-view chrome (path breadcrumbs, leaf history, and optional header title rename) MUST project from the api workspace host `getChrome` bridge into design-core `WorkspaceViewHeader`; the source-editor inline title remains a separate in-document filename surface when enabled. Non-file views MAY contribute breadcrumbs through View hooks.

## LN-ARCH-016 — Api source-editor shell: label CodeMirror hosts with data-language and default

<a id="ln-arch-016"></a>

**Requirement.** The api source-editor shell MUST label CodeMirror hosts with `data-language` and default editor typography to Mira monospace, with sans overrides only for Markdown and text.

## LN-ARCH-024 — API workspace-host bridge: translate compatibility view actions and pane-menu contributions

<a id="ln-arch-024"></a>

**Requirement.** The API workspace-host bridge MUST translate compatibility view actions and pane-menu contributions into design-core view chrome. Translated view-menu sections MUST precede generic pane actions; the workspace shell MUST NOT duplicate plugin controls.

## LN-ARCH-029 — Deno native and renderer code: communicate through the typed native desktop bridge

<a id="ln-arch-029"></a>

**Requirement.** Deno native and renderer code MUST communicate through the typed native desktop bridge. The renderer MUST NOT receive unrestricted Deno APIs or raw host objects.

## LN-ARCH-030 — Production application hosts: load Design Core's public runtime stylesheet

<a id="ln-arch-030"></a>

**Requirement.** Production application hosts MUST load Design Core's public runtime stylesheet and theme entries directly. Storybook-only host configuration MUST NOT be required for reusable workspace components to render correctly.

## LN-ARCH-031 — Native application hosts: map typed platform metadata to host-owned root

<a id="ln-arch-031"></a>

**Requirement.** Native application hosts MUST map typed platform metadata to host-owned root CSS state. Reusable workspace components MUST expose semantic styling hosts without detecting a desktop framework or hard-coding native window-control geometry.

## LN-ARCH-032 — Application hosts: register the reusable @lapis-notes/file-explorer contribution, but plugin

<a id="ln-arch-032"></a>

**Requirement.** Application hosts MAY register the reusable `@lapis-notes/file-explorer` contribution, but plugin enablement order, configuration and metadata boot, community-plugin policy, and teardown MUST remain host-owned. `@lapis-notes/workspace` MUST remain shell-only.

## LN-ARCH-035 — @lapis-notes/web: own browser vault selection, session boot, PWA

<a id="ln-arch-035"></a>

**Requirement.** `@lapis-notes/web` MUST own browser vault selection, session boot, PWA lifecycle, and plugin loading while consuming `@lapis-notes/api` and `@lapis-notes/workspace`.

## LN-ARCH-036 — Browser database coordination: elect one local owner per vault

<a id="ln-arch-036"></a>

**Requirement.** Browser database coordination MUST elect one local owner per vault and delegate typed operations from proxy tabs. Coordination MUST NOT be presented as cloud sync.

## LN-ARCH-037 — Editor-host readable-column ownership

<a id="ln-arch-037"></a>

**Requirement.** The API editor host MUST be the sole owner of readable-column geometry after composing Mira. It MUST neutralize inherited outer-sizer width and margin constraints before applying file margins, so widening a workspace pane or closing sidebars cannot reduce the Markdown content width.

## LN-ARCH-038 — CV compilation, generated-artifact export, and form-toolbar composition: remain plugin-owned, including document-action order after YAML

<a id="ln-arch-038"></a>

**Requirement.** CV compilation, generated-artifact export, and form-toolbar composition MUST remain plugin-owned, including document-action order after YAML. Compiled Markdown presentation composes Mira's public read-only surfaces. The plugin MUST keep vault persistence behind its host adapter and MUST NOT create another Markdown rendering stack. Shared form disclosure behavior MUST remain owned by Design Core.

## LN-ARCH-044 — Ribbon and status projection

<a id="ln-arch-044"></a>

**Requirement.** The API workspace host MUST project compatibility ribbon and status contributions into Design Core registries while plugins retain command and lifecycle ownership.

## LN-ARCH-057 — Real-agent diagnostics: use explicit developer-invoked supervisors around the production

<a id="ln-arch-057"></a>

**Requirement.** Real-agent diagnostics MUST use explicit developer-invoked supervisors around the production host boundaries. Storybook MUST remain passive, an attached loopback token MUST exist only in the supervised child environment, and Deno desktop MUST use one seeded folder as both portable vault source and native agent workspace.

## LN-ARCH-061 — Native Explorer copy, open, and reveal extras: remain File Explorer consumer work over Design

<a id="ln-arch-061"></a>

**Requirement.** Native Explorer copy, open, and reveal extras MUST remain File Explorer consumer work over Design Core's built-in vault-path menu. Design Core MUST NOT hardcode system paths or OS reveal.

## LN-ARCH-062 — Shared file-tool kernels and vault adapters

<a id="ln-arch-062"></a>

**Requirement.** Generic file-tool kernels MAY live in `@lapismd/ai-host/file-tools`. API MUST supply Vault operations and AppTool wrappers. The kernel MUST NOT own conversation scope, approvals, or Vault I/O.

## LN-ARCH-064 — API: own transport-neutral skill-source and composer slash-command registries

<a id="ln-arch-064"></a>

**Requirement.** API MUST own transport-neutral skill-source and composer slash-command registries. AI MUST own discovery, snapshots, routing, and `AppToolHost` invocation. Composer slash commands MUST remain distinct from workspace `addCommand` and from Mira editor slash commands.

## LN-ARCH-066 — API-owned workspace leaves: split through API leaf duplication before Design

<a id="ln-arch-066"></a>

**Requirement.** API-owned workspace leaves MUST split through API leaf duplication before Design Core renders the new pane. Design Core MAY own generic tab splitting, but Lapis-hosted imperative views MUST NOT create orphan design tabs without live `WorkspaceLeaf` containers, host layout projection, or translated split directions.

## LN-ARCH-069 — Deno native close, menu, and external-navigation policy: remain host-owned while session persistence and disposal

<a id="ln-arch-069"></a>

**Requirement.** Deno native close, menu, and external-navigation policy MUST remain host-owned while session persistence and disposal remain renderer-owned. On macOS, bootstrap and visible-window close events MUST share one coordinator and private same-origin signal. The renderer MUST show an opaque branded close surface, complete shared teardown, and acknowledge through a bounded native binding. Unavailable telemetry MUST NOT delay that acknowledgement beyond one second.

## LN-ARCH-081 — Desktop product identity has two host-owned layers: derive an ignored host bundle through Deno's

<a id="ln-arch-081"></a>

**Requirement.** Desktop product identity has two host-owned layers: the renderer boot document owns branded startup content, while the native bundle owns the macOS application and menu name. Development MAY derive an ignored host bundle through Deno's supported local-host boundary and reuse an unchanged runtime only after deep strict signature verification, but MUST NOT mutate shared runtime caches or move identity policy into plugins.

## LN-ARCH-091 — Filesystem content: remain authoritative while API owns reusable sync-host

<a id="ln-arch-091"></a>

**Requirement.** Filesystem content MUST remain authoritative while API owns reusable sync-host identity, cursor, generated-state, streamed I/O, capability, network, and crypto contracts. Protocol plugins own remote schemas, revision graphs, reconciliation, and UI; hosts own isolation, secret persistence, unlock, and platform adapters.

## LN-ARCH-093 — Stable per-vault Sync Identity

<a id="ln-arch-093"></a>

**Requirement.** API MUST keep a stable per-vault Sync Identity in the same wrapped host key material as root, recovery, device, and epoch secrets. API owns purpose-scoped signing, owner-authorised identity transitions, and bounded encrypted pairing transfer of opaque plugin metadata; protocol plugins own outer transport schemas, non-secret endpoint configuration, remote authorization tests, provisioning UI, and provider-specific authentication policy.

## LN-ARCH-096 — Deno desktop and server hosts: consume private reusable filesystem, watch, resource, plugin-asset

<a id="ln-arch-096"></a>

**Requirement.** Deno desktop and server hosts MUST consume private reusable filesystem, watch, resource, plugin-asset, language-service, and native AppDatabase kernels without transferring host lifecycle, authentication, routing, window, or vault-selection policy into those kernels.

## LN-ARCH-098 — Verified renderer ESM plugins: share public API modules with the host

<a id="ln-arch-098"></a>

**Requirement.** Verified renderer ESM plugins MUST share public API modules with the host through build-owned import-map entries. The API plugin loader owns constructor resolution: it MUST prefer a default export and otherwise select a named subclass of the shared `Plugin` base without treating helper exports as the runtime constructor.

## LN-ARCH-099 — Host-owned Nostr credentials

<a id="ln-arch-099"></a>

**Requirement.** Nostr private keys and NIP-46 client credentials MUST remain host-owned. API MUST expose only plugin-scoped account selection, profile-creation ceremony, public-key lookup, exact-template event signing, NIP-44 encrypt/decrypt, remote-signer connection, and close operations. A plugin MUST receive opaque account IDs rather than secret key or keychain access, and a host without a signer MUST fail closed.

## LN-ARCH-101 — Public plugin-facing Nostr signer facade: terminate at a host-owned broker. On Deno

<a id="ln-arch-101"></a>

**Requirement.** The public plugin-facing Nostr signer facade MUST terminate at a host-owned broker. On Deno desktop, the broker MUST use a renderer-private native session capability and native signing commands so keychain values never cross into renderer or plugin code. Only the first-party `community` plugin identity may use that native session; additional plugins require an explicit host policy change.

## LN-ARCH-104 — Encrypted local sync state purpose

<a id="ln-arch-104"></a>

**Requirement.** API host crypto MUST provide a distinct `local-state` object purpose with envelope tag 8 and purpose-separated authenticated encryption. Existing object tags and wire formats MUST remain unchanged. Local state MUST require enrolled, unlocked, active-device authority for encryption and MUST reject cross-purpose or wrong-epoch decryption.

## LN-ARCH-105 — Durable opaque sync repositories

<a id="ln-arch-105"></a>

**Requirement.** API MUST define a protocol-neutral repository for immutable ciphertext blobs and version-guarded sealed state. Deno hosts MUST keep that repository in a dedicated durable database, independent of application/search index rebuilds. Writes MUST durably commit before acknowledgement; namespace isolation, ciphertext hash verification and atomic state comparison MUST fail closed.

The portable `test:sync-engine` acceptance loads a supplied packed headless
engine with real host crypto and membership. It verifies active and retired
Sync Identity history authorization alongside repository reopen and key
lock/unlock. It does not qualify native filesystem apply or server routes.

## LN-ARCH-106 — Guarded native file mutations

<a id="ln-arch-106"></a>

**Requirement.** Native guarded file writes/removals MUST require captured identity, generation and absence guards. Streaming preparation MUST NOT mutate working files. Installation MUST NOT overwrite a newly appeared file; displaced preimages MUST remain recoverable when a concurrent edit makes recovery ambiguous.

## LN-ARCH-107 — Durable native apply receipts

<a id="ln-arch-107"></a>

**Requirement.** Native apply MUST persist an encrypted intent before working-file mutation and a durable idempotent receipt before acknowledgement. Restart MUST recover mutation-before-receipt failures without duplicating mutation. Reused operation identifiers with different parameters MUST fail closed; ambiguous targets MUST retain the intent and working content.

## LN-ARCH-108 — Native apply ownership and storage

<a id="ln-arch-108"></a>

**Requirement.** A native apply kernel MUST hold exclusive process-safe ownership of its vault and bind encrypted state to the enrolled vault, device and physical root. Paths MUST reject traversal and symlinks. File identity MUST survive restart and unambiguous physical rename without being inferred from content equality. Working-file staging MUST stay outside synchronization capture and ciphertext repositories.

## LN-ARCH-109 — Indexed encrypted mutation receipts

<a id="ln-arch-109"></a>

**Requirement.** Completed native mutations MUST use independently encrypted immutable receipts indexed by opaque operation keys, isolated by repository namespace and bound to the enrolled vault, device and physical root. Receipt durability MUST precede removal from the active journal. Lost write responses MUST require recovery without repeated mutation. Completed operations MUST NOT accumulate in the active encrypted journal; ambiguous recovery data MUST remain intact.

## LN-ARCH-110 — Native journal format and migration

<a id="ln-arch-110"></a>

**Requirement.** Indexed native journals MUST use a format that earlier non-indexed readers reject. Opening a supported legacy journal MUST durably upgrade its format before compaction or capture/apply access. Upgrade MUST preserve pending intent, paths, counters, receipts and working bytes. Unknown formats MUST fail without rewriting state; interrupted upgrades MUST recover idempotently under current endpoint authority.

## LN-ARCH-111 — Explicit pairing delivery

<a id="ln-arch-111"></a>

**Requirement.** API pairing MUST default to validated relay invitations. Host-delivered pairing MUST require explicit owner and joining selection, advertise no relay addresses, and reject mixed or unknown delivery modes. Both modes MUST retain signed Nostr messages, encrypted transfer, SAS verification, replay/expiry protection and independent device keys. API MUST return artifacts for caller delivery without opening a transport.

## LN-ARCH-112 — Installed encryption epochs

<a id="ln-arch-112"></a>

**Requirement.** API crypto status MUST return a sorted, independent list of installed content-key epoch numbers only while unlocked. Listing MUST expose no key bytes and MUST reflect pairing, key rotation and imported keys. Locked or unenrolled status MUST omit the list; protocol history authorization MUST use actual installed epochs rather than assumed values.

## LN-ARCH-113 — Headless Sync security host entrypoint

<a id="ln-arch-113"></a>

**Requirement.** API MUST expose `@lapis-notes/api/sync-security-host` without importing UI or DOM modules, using the same Sync security implementation as app hosts. Its host-module metadata MUST advertise no plugin runtime platforms; official renderer or sidecar releases declaring it MUST fail validation. Trusted application hosts MUST retain storage, authorization and lifecycle ownership while plugins consume scoped capabilities.

## LN-ARCH-114 — Independent Sync security storage

<a id="ln-arch-114"></a>

**Requirement.** Hosts MUST be able to supply a security store independently of disposable AppDatabase indexes. All Sync key envelopes and network grants MUST use the supplied store without falling back after failure. Existing callers MAY retain AppDatabase storage. Replacing an index MUST preserve enrolled identities and installed keys when a separate store is supplied; plugins MUST NOT receive the store.

## LN-ARCH-115 — Native security repository

<a id="ln-arch-115"></a>

**Requirement.** Native security storage MUST use a dedicated, versioned SQLite database and isolate host namespaces. Conditional metadata transactions MUST atomically check and mutate across connections. Invalid schemas, oversized or corrupt values and operations after close MUST reject without clearing records. Key envelopes MUST remain wrapped by the security service; wrapping secrets MUST NOT enter this repository.

## LN-ARCH-116 — Headless metadata contract

<a id="ln-arch-116"></a>

**Requirement.** The public `@lapis-notes/api/metadata-store` contract MUST share metadata transaction definitions with AppDatabase without loading browser, search, UI or crypto implementations. Existing AppDatabase type exports MUST remain compatible. Its host-module metadata MUST advertise no plugin runtime platforms.

## LN-ARCH-117 — Host-owned Sync security delegation

<a id="ln-arch-117"></a>

**Requirement.** Hosts MUST be able to delegate a plugin's crypto, Sync Identity, pairing, membership and recovery capabilities to host-owned custody while undelegated plugins retain their credential location. Every delegated operation MUST check grants and runtime validity before invocation and after completion. Delegate failures MUST NOT select local custody, and delegated plugins MUST reject local host enrollment and unlock operations. Provider objects MUST remain absent from plugin facades and retained public options.

## LN-ARCH-118 — Drained Sync security revocation

<a id="ln-arch-118"></a>

**Requirement.** Plugin revocation MUST synchronously invalidate its scoped capabilities and await delegated cleanup before disable completes. Host disposal MUST invalidate all runtimes, stop file observation and drain admitted security cleanup, including concurrent revocations. Cleanup failure MUST remain observable after every cleanup attempt finishes. A disposed host MUST reject new runtimes and late asynchronous capability results.

## LN-ARCH-119 — Scoped local Sync storage and file capabilities

<a id="ln-arch-119"></a>

**Requirement.** Hosts MAY delegate local Sync capture, guarded mutation and sealed storage per plugin runtime or omit local capabilities. API MUST check file, identity, generated-state and crypto grants before provider selection and after results. Providers MUST remain host-owned and MUST NOT fall back to disposable indexes or unguarded mutation. Native adapters MUST use separate engine/apply stores and require an explicit inclusion policy.

## LN-ARCH-120 — Local Sync stream and cleanup lifetime

<a id="ln-arch-120"></a>

**Requirement.** Retained file handles and input/output streams MUST obey their originating plugin runtime lifetime. Revocation MUST invalidate handles, cancel admitted streams, reject late results and drain local operations before provider cleanup. Local cleanup MUST finish before delegated key custody is released, including failed cleanup. Host disposal MUST join concurrent revocations and reject new local work.

## LN-ARCH-121 — Host apply guard for local Sync

<a id="ln-arch-121"></a>

**Requirement.** Local Sync mutations and receipt recovery MUST execute inside a host-owned apply guard that covers the complete asynchronous operation. Missing guards MUST reject before provider invocation. Mutation guards MUST receive the captured target path; receipt recovery MUST guard all potentially affected editors because recovery can complete an earlier mutation. Revocation during guard admission MUST prevent subsequent provider mutation.

## LN-ARCH-122 — Local mutation source lifetime

<a id="ln-arch-122"></a>

**Requirement.** Local Sync MUST drain mutation-source completion or cancellation before acknowledging completion or rejection and before releasing the host apply guard. Missing or rejected admission MUST cancel the supplied source without invoking provider mutation. Revocation MUST join admission-time source cleanup before releasing keys. A provider retaining an input reader or rejecting a stale target before consumption MUST cancel that source before the operation ends.

## LN-ARCH-123 — Native captured read descriptors

<a id="ln-arch-123"></a>

**Requirement.** Native guarded reads MUST resolve captured path, protocol/host identity and content generation without retaining an unbounded RPC handle for every file. Changed descriptors, excluded paths, physical root replacement and changed streamed content MUST reject. Read descriptors MUST remain usable after capture paging resources are released, subject to their original generation and runtime lifetime.

## LN-ARCH-124 — Host authority fence forwarding

<a id="ln-arch-124"></a>

**Requirement.** API local state/mutation ports MUST accept and capture expected endpoint authority outside encrypted protocol records. Scoped facades MUST forward supplied fences unchanged through host apply guards, without permitting admission-time retargeting. Native RPC adapters MUST require and validate those fences; legacy low-level ciphertext repositories MAY retain their trusted-host operation contract. Fences MUST NOT alter signed Nostr events or encrypted object formats.

## LN-ARCH-140 — Shared application state default

<a id="ln-arch-140"></a>

**Requirement.** The shared application state directory MUST default to `.lapis` across desktop, web, server, and Storybook hosts. Configuration, workspace/layout, hotkeys, core plugin data, installed-plugin state, and registry caches MUST resolve under that directory. Pre-release state MAY be reset without legacy import or preservation. App construction MUST allow an omitted configuration path while resolved public properties retain a string path.

## LN-ARCH-141 — Native desktop runtime classification

<a id="ln-arch-141"></a>

**Requirement.** Public runtime and native desktop bridge contracts MUST recognize `tauri-desktop` as a native desktop runtime. Plugin distribution MUST classify it as desktop without granting unavailable service capabilities. Existing Deno, browser, server, and explicit-test runtime behavior MUST remain supported.
