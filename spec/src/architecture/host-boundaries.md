# Architecture / Host boundaries

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
