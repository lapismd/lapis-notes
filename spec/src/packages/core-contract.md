# Packages / Host and plugin integration

The private application profile owns optional Repository registration and its
App-scoped binding before configured plugin loading. The generic Web session
selects that public private-profile entry; it does not import plugin classes.

The private Rust-hosted History profile consumes the retained public Repository
plugin and lossless History SDK through the same App/session and admitted client.
It adds no published API export or alternate plugin engine. The unpublished SDK
uses the documented private-app sibling exception and exact public validation archive.

The private native-chat application profile consumes host-authored target
`default_mode` metadata under LN-CORE-009/010. It resolves the exact target again
before Send, refuses missing or invalid metadata and preserves explicit native
input modes. It never infers provider permissions from target IDs or labels.

The private Web package's opt-in provider-screen acceptance exercises that
profile through its real composer and History after explicit Sign out and cold
service restart. Its dedicated Playwright configuration is type-checked with
the hosted test sources; no acceptance helper enters package runtime exports.

The private root package exposes `progress:generate` and `check:progress` for
the master migration tracker. These development-only commands consume
`spec/migration-progress.json` and do not enter published package exports or
application runtime dependencies. Normal check includes the drift gate.

The root development cohort selects released Mira `~0.1.1` and its three
`~0.0.3` companions through public exports. Current API and Markdown peer
ranges admit those releases. The
[dependency intake receipt](../../records/2026-10-25-released-mira-dependency-intake.md)
records the temporary committed Design Core archive, separate consumer checks
and unresolved private-package frozen-registry gate under LN-PKG-012/064.

Root, API and UI select the same published Bits UI `2.20.2` runtime. The
[unified-runtime intake](../../records/2026-10-25-bits-runtime-intake.md) retains
exact hover-preview regressions, final source/packing and separate consumer gates
before admission. The timer repair is qualified in its owning source and consumed
through a documented temporary archive, without a tracked dependency patch or
checkout-specific installation path.

The private native core exposes bounded archive extraction and immutable ZIP
snapshots under LN-CORE-004/007. Hosts own publication and transport; the engine
accepts only an empty provisional root and regular content, retaining `.lapis`.

R1.3.11 retains Web's existing public App-owned vault-change service. Starting it
before ready and draining it before host teardown restores internal file-view
projection; no API export, alternative file writer or scheduler is added.

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

**Requirement.** Private `@lapis-notes/web` version `2026.6.3` MUST live at `packages/web` and expose `dev`, `build`, `check`, and `test` scripts.

## LN-PKG-065 — @lapis-notes/bases filter groups: preserve the initial predicate when adding another

<a id="ln-pkg-065"></a>

**Requirement.** `@lapis-notes/bases` filter groups MUST preserve the initial predicate when adding another row and compose nested Design Core Select portals without package-local stacking overrides. The built package MUST retain these filter interaction semantics.

## LN-PKG-114 — Private desktop package: expose local LGTM and telemetry development commands

<a id="ln-pkg-114"></a>

**Requirement.** The private desktop package MUST expose local LGTM and telemetry development commands. Root commands MUST delegate to that package, while ordinary development, build, package, test, and distribution commands remain telemetry-disabled.

## LN-PKG-115 — @lapis-notes/api: export its telemetry contract through @lapis-notes/api/telemetry. Browser

<a id="ln-pkg-115"></a>

**Requirement.** `@lapis-notes/api` MUST export its telemetry contract through `@lapis-notes/api/telemetry`. Browser OpenTelemetry SDK dependencies MUST remain private to `@lapis-notes/desktop-deno` and load only after explicit telemetry enablement.

## LN-PKG-120 — @lapis-notes/graph: own deterministic entrance layout, Obsidian-range camera

<a id="ln-pkg-120"></a>

**Requirement.** `@lapis-notes/graph` MUST own deterministic entrance layout, Obsidian-range camera and force transforms, degree-normalized D3 simulation, zoom-stable geometry, direct screen-pixel links, paint culling, exponential emphasis, reduced motion, semantic roles, and bounded telemetry. It MUST NOT add another renderer dependency.

## LN-PKG-125 — @lapis-notes/ai: own in-memory turn projection and terminal conversation

<a id="ln-pkg-125"></a>

**Requirement.** `@lapis-notes/ai` MUST own in-memory turn projection and terminal conversation checkpoints. `@lapismd/ai-controller` MUST own later-task start, prompt, and journal delivery. `@lapis-notes/desktop-deno` MUST expose only an authenticated controller connection. Durable conversation authority MUST remain in AI, and native transports MUST NOT write transcript state.

## LN-PKG-149 — API host catalogue: expose declared Svelte browser runtime contracts under

<a id="ln-pkg-149"></a>

**Requirement.** The API host catalogue MUST expose declared Svelte browser runtime contracts under compiler-versioned specifiers. API and host builds MUST use that exact Svelte peer version. Hosts MUST provide those entries through their own module graph. Raw private imports and unavailable ABI versions MUST remain rejected.

## LN-PKG-075 — Root real-agent smoke scripts: remain thin supervisors over the standalone AI

<a id="ln-pkg-075"></a>

**Requirement.** Root real-agent smoke scripts MUST remain thin supervisors over the standalone AI controller, its public client, Storybook, Deno desktop, and Turbo. Seed creation and reset confinement MUST remain deterministic and testable without starting an agent, while the manual checklist stays with `@lapis-notes/ai`.

## LN-PKG-096 — @lapis-notes/api: own skill-source and composer slash-command registration. @lapis-notes/ai

<a id="ln-pkg-096"></a>

**Requirement.** `@lapis-notes/api` MUST own skill-source and composer slash-command registration. `@lapis-notes/ai` MUST own discovery, snapshots, skill tools, and the composer router. Those APIs MUST NOT expose MCP, ACP, or vendor runtime types.

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
