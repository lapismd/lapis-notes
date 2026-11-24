# Packages / Host and plugin integration

The prepared partial release is UI `0.2.2` → API `0.6.7` → Workspace `0.4.7`
for the admitted Core `^0.13.4` intake. API's UI peer floor becomes `^0.2.2`;
Workspace's API/UI dependencies become `^0.6.7`/`^0.2.2`. The existing three
patch Changeset entries own these versions. Language Service, File Explorer
and App Profile retain their current versions and independently held dependency
ranges. API's generated module inventory updates version metadata only. This
candidate does not establish npm publication or change any dist-tag; the
existing governed release recipe and package order remain required.

The published application profile owns optional Repository registration and its
App-scoped binding before configured plugin loading. Its complete shared session
exports built output for both hosted and browser applications. Web selects that
session through the public package; hosts retain transport, credential custody,
permissions, appearance and platform lifecycle.

LN-PKG-129/130/131 apply to App Profile after API, File Explorer and Workspace in
the public release graph. Registry ranges admit the current API and History
remotes cohort. The profile declares the native History SDK needed by its public
Repository types rather than relying on a development-only transitive peer.
The ordinary four-plugin profile remains unchanged; supplying a
Repository factory explicitly registers the source-owned History plugin without
calling native services before enablement. Shared session startup, retry, writer
preflight and disposable App ownership remain application-profile policy.

This integration adapts the committed shared-session implementation at
`1c790698abb1e5fb033534e1e5ae75ef71d951c4` to current main. Later native Chat
startup/retry behavior, browser appearance persistence, PWA disposal and default
responsive shell selection remain retained. Source and published-package
qualification are distinct from Desktop/Server acceptance.

The optional Rust-hosted History profile consumes the retained public Repository
plugin and lossless History SDK through the same App/session and admitted client.
It adds no published API export or alternate plugin engine. The native Rust SDK
uses the documented private-app sibling exception and exact public validation archive.

The native-chat application profile consumes host-authored target
`default_mode` metadata under LN-CORE-009/010. It resolves the exact target again
before Send, refuses missing or invalid metadata and preserves explicit native
input modes. It never infers provider permissions from target IDs or labels.

The private Web package's opt-in provider-screen acceptance exercises that
profile through its real composer and History after explicit Sign out and cold
service restart. Its dedicated Playwright configuration is type-checked with
the hosted test sources; no acceptance helper enters package runtime exports.

The private root specification commands validate canonical contracts, verification,
navigation and source mappings. They do not generate an application-status ledger
or enter published package exports.

The root development cohort selects released Mira `~0.2.0`, Design Core
`^0.13.3` and published `~0.0.4` Mira companions. API selects Mira `~0.2.0`;
API, UI and Workspace directly select Core `^0.13.4`. Their existing peer
compatibility ranges remain unchanged. App Profile retains Core `^0.13.3`,
while File Explorer retains its multi-version compatibility range. The frozen
lockfile records this bounded registry intake; held consumers do not inherit
permission to regenerate. The existing Changeset owns release intent, with
publication and consumer qualification remaining independent gates.

Root, API and UI select published Bits UI `2.20.2`. The user-approved,
reproducible `patches/bits-ui@2.20.2.patch` composes Link Preview selection-timer
cleanup, Slider post-destroy pointer guards and the upstream FocusScope
idempotent-mount repair. The [composed patch receipt](../../records/2026-10-31-composed-bits-lifecycle-patch.md)
records official registry input, exact patch bytes and separate qualification.
This root pnpm patch does not propagate through published framework packages;
LN-PKG-158's minimal published consumer remains independent of root patches.
Remove it only after an upstream release contains every remaining repair and
passes the exact regressions, complete affected lanes and consumer acceptance.

Published `@lapis-notes/bases@0.1.4` omits accessible names on its Select
triggers. `patches/@lapis-notes__bases@0.1.4.patch` applies the names already
present in plugins source. Axe rules stay unchanged. Remove the patch when a
published bases release includes those names.

The private native core exposes bounded archive extraction and immutable ZIP
snapshots under LN-CORE-004/007. Hosts own publication and transport; the engine
accepts only an empty provisional root and regular content, retaining `.lapis`.

R1.3.11 retains Web's existing public App-owned vault-change service. Starting it
before ready and draining it before host teardown restores internal file-view
projection; no API export, alternative file writer or scheduler is added.

LN-WEB-095 remains private Web-package lifecycle composition. It wraps the
existing `VaultSession.close()` operation with one page-owned close flight and
settles its internal browser lock lease; it does not add a public package export
or change the session close contract.
LN-WEB-096 routes guarded update preparation through that Web-owned lifecycle;
it likewise adds no public API or package contract.

UI's existing public theme export supplies shared search-highlight defaults.
Dark-mode contrast is qualified under LN-UI-020 on workspace/sidebar normal,
hover and active rows, without a consumer override or an additional export.

Plugin manifests expose optional `requiredNativeServices` for host capability
admission (LN-PLUG-121). It is distinct from brokered `requiredCapabilities`: no
new native permission or implicit service activation follows from a declaration.

The API installer uses optional static-identity and replacement-preparation
operations from its owning PluginManager. Preparation exposes an awaitable
rollback and reload decision without leaking app IDs or host-specific services.
Existing plugin data survives signed replacement and obsolete static copies can
be removed without changing the application-owned plugin lifecycle.

Workspace's exported plugin-management registration retains App Shell controls
through Design Core's public managed-plugin registry. The consumer needs no
private source import, replacement Settings page or additional export.

The public editing-session registry exposes retained text conflicts under
LN-ARCH-143 and explicit protected resolution under LN-ARCH-144. Host-owned
presentation consumes those contracts; it must not create another save path.

The UI 0.1.3 candidate retains the version and changelog prepared by Changesets
PR #33 for the runtime dependency repair in PR #32. Its ordinary release
follow-up also repairs the private desktop large-frame assertion cost; that
verification change does not alter published UI behavior or bypass normal gates.

The API owns signed archive delivery selection and transport-only origin
fallback under [LN-PLUG-110 and LN-PLUG-111](../plugin-model/distribution-and-registry-01.md#ln-plug-110).
Hosts retain the verified installer's hash, signature and selected-release checks.

## LN-PKG-002 — @lapis-notes/api: depend on @lapis-notes/ui as a peer

<a id="ln-pkg-002"></a>

**Requirement.** `@lapis-notes/api` MUST depend on `@lapis-notes/ui` as a peer for shared UI primitives used by kernel components.

## LN-PKG-003 — Pruned retained UI exports

<a id="ln-pkg-003"></a>

**Requirement.** `@lapis-notes/ui` MUST export only the pruned surface required by api (plus documented transitive dependencies).

The retained class helper imports `clsx` and `tailwind-merge`; dialogs and
sidebar controls use `bits-ui`, and Search uses `@lucide/svelte`. These are
runtime dependencies in the published UI manifest. Package consumers do not
install the UI package's development dependencies.

## LN-PKG-046 — Private @lapis-notes/web version 2026.6.3: live at packages/web and expose dev, build

<a id="ln-pkg-046"></a>

**Requirement.** Private `@lapis-notes/web` version `2026.6.3` MUST live at `packages/web` and expose `dev`, `build`, `check`, and `test` scripts. It MUST export `WebWorkspaceSession` from `@lapis-notes/web/session` so a hosted server can mount the Notes workspace.

## LN-PKG-065 — @lapis-notes/bases filter groups: preserve the initial predicate when adding another

<a id="ln-pkg-065"></a>

**Requirement.** `@lapis-notes/bases` filter groups MUST preserve the initial predicate when adding another row and compose nested Design Core Select portals without package-local stacking overrides. The built package MUST retain these filter interaction semantics.

## LN-PKG-115 — @lapis-notes/api: export its telemetry contract through @lapis-notes/api/telemetry. Browser

<a id="ln-pkg-115"></a>

**Requirement.** `@lapis-notes/api` MUST export its transport-neutral telemetry contract through `@lapis-notes/api/telemetry`. Runtime telemetry SDK dependencies and opt-in policy MUST remain host-owned rather than entering the public API package.

## LN-PKG-120 — @lapis-notes/graph: own deterministic entrance layout, Obsidian-range camera

<a id="ln-pkg-120"></a>

**Requirement.** `@lapis-notes/graph` MUST own deterministic entrance layout, Obsidian-range camera and force transforms, degree-normalized D3 simulation, zoom-stable geometry, direct screen-pixel links, paint culling, exponential emphasis, reduced motion, semantic roles, and bounded telemetry. It MUST NOT add another renderer dependency.

## LN-PKG-149 — API host catalogue: expose declared Svelte browser runtime contracts under

<a id="ln-pkg-149"></a>

**Requirement.** The API host catalogue MUST expose declared Svelte browser runtime contracts under compiler-versioned specifiers. API and host builds MUST use that exact Svelte peer version. Hosts MUST provide those entries through their own module graph. Raw private imports and unavailable ABI versions MUST remain rejected.

## LN-PKG-096 — @lapis-notes/api: own transport-neutral skill-source and composer slash-command registration

<a id="ln-pkg-096"></a>

**Requirement.** `@lapis-notes/api` MUST own skill-source and composer slash-command registration. Those APIs MUST remain transport-neutral and MUST NOT expose MCP, ACP, or vendor runtime types. Concrete AI consumers MAY own discovery, snapshots, skill tools, and composer routing without moving that policy into API.

## LN-PKG-165 — Public application state paths

<a id="ln-pkg-165"></a>

**Requirement.** API MUST export the shared `.lapis` directory default and application-state path builder through its root and headless `@lapis-notes/api/path` entrypoints. First-party hosts MUST use the shared path contract for default state rather than a Tauri-only override.

## LN-PKG-166 — Independent runtime identity export

<a id="ln-pkg-166"></a>

**Requirement.** API MUST export runtime identity types and native desktop classification through `@lapis-notes/api/runtime` without importing database or model services. Existing root and application-database exports MUST retain those contracts.

The same private core owns the installed-asset verifier extracted from Desktop
under LN-CORE-004/007. Tauri and HTTP adapters retain URL and caller authority;
Core receives only an admitted vault capability and installation coordinates.

The optional App `nativeHistoryIndex` property and matching `VaultSession` field
carry the already admitted public native History port. Explicit App construction
wins over its session; absence retains the existing host profile. Construction
performs no selection or network operation. The Repository plugin observes this
port only after the host separately binds its admitted repository services;
transport availability alone cannot create a replacement Repository view.

Optional trusted `queue_selection` metadata follows [LN-CORE-037](../architecture/rust-queue-admission.md#ln-core-037). Hosts keep the exact saved recipient and ACP choices separate from opaque execution-target authority; absent metadata leaves shared UI capture unavailable while preserving R2 operation.

The private native hosted build/start scripts follow
[CORE-064/065](../architecture/rust-hosted-delivery.md). They compile the existing
public renderer closure and native executable, add no npm runtime package and
preserve registry manifests. Default replacement and container delivery remain
separate from explicit development entrypoints.

Native chat layout capture preserves saved conversation/scope before mount;
only an observed new draft clears the saved conversation. This retains existing
view state through native metadata/History/Tasks boot without creating a writer
or resubmitting accepted work. The pre-mount regression reproduces0/1 and passes
after the view-owned repair; final combined hosted acceptance remains R7.

The Notebook segmented density picker consumes the public Design Core ToggleGroup module through the generated renderer module registry. This adds no private module or application ownership exception.

Notebook's final registry cohort uses Design Core ^0.9.0 in development hosts and admits it in API, UI, Workspace and Explorer's public ranges. Existing supported ranges remain compatible. Generated catalog imports MUST resolve without private aliases or a second older Core installation. Source-archive and registry receipts remain separate.

Notebook host intake changes generated module admission and dependency ranges only; API runtime interfaces remain unchanged. Its compatibility release MUST remain in the existing API 0.2 peer cohort so unchanged plugins remain admissible. Design Core's new public table contracts use its own minor release.

The public API build/vite entry MUST expose rendererHostModulePlugin for plugin/host build modes, bound to an exact svelteVersion and the generated renderer catalog. This build-only compatibility addition preserves API runtime interfaces and the existing 0.2 plugin peer cohort. CodeMirror Markdown MUST have an explicit public host entry.

The optional public background-jobs API follows LN-PLUG-141 through LN-PLUG-143.
Both App source and its public handwritten declaration expose the admitted port
and passive session; built-package contract checks verify this export boundary.
