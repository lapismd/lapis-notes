# Storybook Catalog / Catalog policy

Search panel acceptance follows the shared command picker's accessible name,
including its current selection: `Filter by file type: All` before selection
and `Filter by file type: Markdown` afterward. All six placement stories retain
the real filter interaction and selected-state assertions.

Search placement acceptance reads the full-path caption as file identity and
asserts the released accessible name, the vault path and match count. Copy
controls use the accessible name `Copy search results` and show the result
count as their visible label. AI's Search Tool Hits scenario selects the
complete filename/path label and still proves exact file navigation with chat
retained.

API Date Setting acceptance also asserts full date-picker names, including
`Choose date: Pick date` and the retained legacy date value. Selected values
remain part of each control's accessible name.

Workspace Shell persistence instrumentation counts only writes to its owned
`.lapis/workspace.json`. Configuration writes must not inflate that counter;
bottom-panel resize acceptance retains the exactly-one-workspace-write check.

Plugin Management acceptance follows the same selected-value names for platform,
channel and sort controls, and retains the real filtering and result ordering.

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

**Requirement.** Shared shadcn families destined for design-core SHOULD NOT duplicate full design-core Storybook coverage; document ownership and adoption evidence in canonical styling and verification, with remaining work in the backlog.

## LN-CAT-010 — Story / demo Svelte under stories/: use host Tailwind for layout; that usage

<a id="ln-cat-010"></a>

**Requirement.** Story / demo Svelte under `stories/` MAY use host Tailwind for layout; that usage MUST remain excluded from `pnpm check:no-tailwind`.

App-backed catalog fixtures use the shared `.lapis` state default under
LN-ARCH-140 for settings, plugin enablement, hotkeys, and persisted layouts.
Functional, keyboard, and axe gates retain their existing assertions.
