# Packages / Configuration and lifecycle

API Sync host disposal follows LN-ARCH-118: initialization and admitted events
settle before resource teardown completes, while readiness retains startup
errors and delegated cleanup failures remain blocking. The repair is published
in API `0.2.3`; [registry and source verification](../../records/2026-10-31-api-023-publication.md)
remain distinct from consumer acceptance. Public exports and signatures are
unchanged.

LN-PKG-185 owns the plugin-independent `Workspace / File discovery / Excluded paths` list, persisted through the existing App configuration writer as `files.exclude`.
Configuration updates refresh discovery projections; plugin configuration,
direct metadata access and native admission keep their existing authority.

Tauri portable loading preserves the existing installed records and enabled preferences when rejecting unsupported entries. Installed asset identities use the locale-independent fingerprint in LN-PLUG-115; no second plugin configuration or data store is introduced.

Web retirement removes dedicated connection tokens through the existing
serialized configuration writer. LN-PLUG-113 does not reset plugin data,
conversations, unrelated secrets or retained workspace state.

## LN-PKG-186 — Read-only configuration reconciliation

<a id="ln-pkg-186"></a>

**Requirement.** Configuration reload MUST accept an optional read-only reconciliation mode that updates its saved baseline and visible values without materializing schema defaults or enqueueing persistence. Default reload behavior MUST remain unchanged. Hosts MAY run read-only reconciliation after an externally admitted guarded mutation; later queued saves MUST calculate from the reconciled state without reentering the registry queue.

## LN-PKG-173 — Serialized configuration changes

<a id="ln-pkg-173"></a>

**Requirement.** Configuration updates, plugin-data updates, removals and schema-default materialization MUST serialize calculation and persistence against the latest acknowledged state. Concurrent independent updates MUST preserve every key. Successful persistence MUST precede observable configuration updates and events; rejected validation MUST NOT enqueue a draft.

## LN-PKG-174 — App-owned application-state writers

<a id="ln-pkg-174"></a>

**Requirement.** Configuration, hotkey and plugin-enablement writes on conditional-capable hosts MUST join the owning App's file-writer lifecycle before asynchronous IO or debounce. Pending and failed drafts MUST block shutdown, preserve external changes and permit explicit recovery. A guarded flush MUST await completion without reentering its own registry queue. Recovery MUST update the owning visible state; a rejected reset MUST retain its conflict and barrier.

Core enablement, App Shell enablement and secondary compatibility data files
participate in this owner. Lazy first-write admission retains the supplied draft
across initial read failures. Compatibility files mirror canonical plugin data;
accepting one file's disk version does not rewrite the canonical application
configuration. Runtime enablement recovery awaits the owning plugin lifecycle.
The recovery callback is registered before the initial state read so a failed
load cannot detach later saves from their runtime owner. Invalid top-level core
configuration records reject recovery without clearing the retained conflict.

Hosts make the workspace inert, await App Shell plugin transitions, and drain
admitted multi-step operations before entering the global file-writer teardown
guard. Plugin data operations and runtime transitions register before their
first asynchronous boundary. Conditional-host Vault creation is tracked through
file-tree projection; Explorer also tracks the surrounding create/open action.

The public API Workspace owns awaitable layout persistence under
[LN-WS-095](../workspace-shell/layout-and-persistence.md#ln-ws-095). Hosts call
`flushLayout()` before teardown instead of implementing a second layout writer.
The packaged method uses the same shared `.lapis` path and selected workspace
filename as normal debounced persistence.

The private application profile owns plugin App URL registration, while
Workspace's public navigator accepts an optional selected release version.
The profile and hosts consume that generic navigator under
[LN-PLUG-106](../plugin-model/app-ownership.md#ln-plug-106); no registry-specific
archive transport or trust key enters the application link.
Workspace resolves requested versions from indexed own metadata entries under
[LN-PLUG-107](../plugin-model/editor-contributions.md#ln-plug-107).
Successful profile URL navigation dismisses owning Settings under
[LN-PLUG-109](../plugin-model/app-ownership.md#ln-plug-109).

## LN-PKG-050 — @lapis-notes/lapis-plugin-cv-roles: expose Storybook interaction and static-build scripts.

<a id="ln-pkg-050"></a>

**Requirement.** `@lapis-notes/lapis-plugin-cv-roles` MUST expose Storybook interaction and static-build scripts. Its package build MUST emit portable declarations without linked sibling implementation paths.

## LN-PKG-052 — @lapis-notes/lapis-plugin-cv-roles: own the adapted legacy Applications components

<a id="ln-pkg-052"></a>

**Requirement.** `@lapis-notes/lapis-plugin-cv-roles` MUST own the adapted legacy Applications components and native CSS in its source tree. It MUST NOT retain a runtime or build dependency on `/Users/stevejuma/code/cv`, `@cvstudio/*`, or legacy Tasks and AI modules.

## LN-PKG-055 — @lapis-notes/api: publicly export search-document provider types

<a id="ln-pkg-055"></a>

**Requirement.** `@lapis-notes/api` MUST publicly export search-document provider types and the registry used by separately versioned first-party plugins without requiring an import from `@lapis-notes/search`.

## LN-PKG-126 — @lapis-notes/ai: own cross-agent transcript projection, binding cursor reduction

<a id="ln-pkg-126"></a>

**Requirement.** `@lapis-notes/ai` MUST own cross-agent transcript projection, binding cursor reduction, switch/configuration audit records, and optional background handoff summaries. `@lapismd/ai-host` and desktop adapters MAY configure or resume native sessions through versioned transport methods, but MUST NOT copy opaque runtime state, author handoff transcript messages, select durable binding state, or become conversation authority.

## LN-PKG-083 — Independent Word Count package ownership

<a id="ln-pkg-083"></a>

**Requirement.** `@lapis-notes/wordcount` MUST live in the sibling `lapis-plugins` monorepo as an independently versioned installable plugin. It MUST depend on `@lapis-notes/api` and MUST NOT depend on `@lapis-notes/ui`.

## LN-PKG-089 — Independent Spell Check package ownership

<a id="ln-pkg-089"></a>

**Requirement.** `@lapis-notes/spellcheck` MUST live in the sibling `lapis-plugins` monorepo as an independently versioned installable plugin. It MUST depend on the API and `harper.js` without importing Design Core presentation or `@lapis-notes/ui`.

## LN-PKG-099 — Independent Bookmarks package ownership

<a id="ln-pkg-099"></a>

**Requirement.** `@lapis-notes/bookmarks` MUST live in the sibling `lapis-plugins` monorepo as an independently versioned installable plugin. It MUST depend on API and Design Core, MUST NOT depend on `@lapis-notes/ui`, and MUST persist `{ items }` through `.lapis/bookmarks.json`.

## LN-PKG-103 — Portable Docs plugin dependencies

<a id="ln-pkg-103"></a>

**Requirement.** `@lapis-notes/lapis-plugin-docs` MUST NOT depend on `/Users/stevejuma/code/cv` or `@cvstudio/*` at runtime or build time. Coding practice host services MUST remain out of the Core Docs package.

## LN-PKG-104 — @lapis-notes/api: own a daily-document provider registry, the desktop

<a id="ln-pkg-104"></a>

**Requirement.** `@lapis-notes/api` MUST own a daily-document provider registry, the desktop and web hosts MUST register the shared default provider before configuration loads, and generated settings MUST persist `dailyNotes.folder` and Luxon `dailyNotes.dateFormat` with defaults `daily` and `yyyy-MM-dd`. The default provider MUST locate canonical `type: daily-note` plus `date: YYYY-MM-DD` front matter before deriving a path, MUST fail visibly on duplicate dates or occupied generated paths, and MUST never move an existing note after configuration changes.

The native Task coordination intake freezes the unchanged public provider and
formatter against explicit storage and metadata fixtures. Full traces retain
non-creating lookup, exact configured paths and canonical seeds, source errors,
registry priority/ambiguity/disposal and the effective formatting locale.
`pnpm capture:native-daily-reference` writes only a collected authoring artifact;
`pnpm test:native-daily-reference` compares the frozen artifact without replacing
it. Capturing reference data alone grants no native persistence or host default.

`pnpm capture:native-daily-locales-reference` and
`pnpm test:native-daily-locales-reference` retain the original en-US 7/4 corpus,
actual en-GB 1/4 defaults and a separately declared legacy-Intl en-US 7/1 profile.
Each complete source corpus preserves all 200 filename, 45 provider and 19
registry outcomes. [Native source qualification](../../records/2026-10-26-native-daily-locale-parity.md)
adds guarded default-provider IO without selecting either application or
introducing timezone policy; actual-host and signed acceptance remain separate.

Registration does not itself express data removal. LN-PLUG-112 preserves unadopted
compatibility files; confirmed canonical removals retain their existing mirror
cleanup. Both paths keep LN-PKG-174 writer ownership and recovery unchanged.

The file-icon intake upgrades API-owned Zod to the patched `^4.6.6` package
while using its public `zod/v3` entry to preserve the existing configuration,
registry and remote-database schema contracts. This closes the dependency audit
finding GHSA-mrhx-c7xc-m3w5 without adding an advisory suppression.
