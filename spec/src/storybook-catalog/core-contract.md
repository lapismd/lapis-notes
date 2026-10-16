# Storybook Catalog / Catalog policy

`Workspace/Desktop Vault Launcher` and `Workspace/Desktop Startup` verify the
public components shared by the Deno and Tauri hosts (LN-PKG-171). Their plays
cover native-action callbacks, recent-project search, supported profile actions,
appearance persistence, startup and recovery accessibility. Public consumer
examples accompany both families; visual capture and approval remain pending.

Sync Protected Editor exercises LN-ARCH-132 through LN-ARCH-134 in the real
App/source editor. Its independent declared baseline is
`stories/workspace/lapis-editor-demo/sync-protected-editor-chromium.png`; capture
and approval remain pending. It proves editor admission and controlled refresh,
while full writer coverage and production Sync selection remain separate.

Sync Independent Writer Admission exercises LN-ARCH-129 and LN-ARCH-130 through
the real App's public session registry and vault. Its independent declared
baseline is `stories/workspace/lapis-editor-demo/sync-independent-writer-admission-chromium.png`;
capture and approval remain pending. This contract story does not activate the
production Sync runtime or claim complete editor registration.

The governed Sync Editor Persistence scenario exercises LN-ARCH-125 through
LN-ARCH-128 in the real source-editor workspace. Its independent baseline path
remains visual-pending; functional checks do not approve or generate a baseline.

## LN-CAT-003 — Catalog metadata under stories/catalog/: list API UI verification ids, governing spec

<a id="ln-cat-003"></a>

**Requirement.** Catalog metadata under `stories/catalog/` MUST list API UI verification ids, governing spec links, public surfaces, and story ids.

## LN-CAT-005 — Shared primitive catalog ownership

<a id="ln-cat-005"></a>

**Requirement.** Shared shadcn families destined for design-core SHOULD NOT duplicate full design-core Storybook coverage; document status in `MIGRATION.md`.

## LN-CAT-010 — Story / demo Svelte under stories/: use host Tailwind for layout; that usage

<a id="ln-cat-010"></a>

**Requirement.** Story / demo Svelte under `stories/` MAY use host Tailwind for layout; that usage MUST remain excluded from `pnpm check:no-tailwind`.

App-backed catalog fixtures use the shared `.lapis` state default under
LN-ARCH-140 for settings, plugin enablement, hotkeys, and persisted layouts.
Functional, keyboard, and axe gates retain their existing assertions.
