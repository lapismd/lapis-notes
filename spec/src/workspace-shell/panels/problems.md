# Problems

The Problems view is a reusable workspace panel. Design Core owns the generic
diagnostic model, collection lifecycle, and presentation; Lapis adapts vault,
language-service, navigation, and plugin behavior at its public API boundary.

The Lapis façade, plugin-owned disposal, open-document bridge, cached actions,
navigation adapter, diagnostics-only Markdown composition, and default
Markdownlint provider are implemented.

Skill parse and discovery diagnostics stay in the AI plugin and do not enter
Problems collections.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-WS-025 | Design Core MUST own the application-independent `WorkspaceDiagnostic` model and `WorkspaceDiagnosticsManager`. Diagnostic data MUST remain plain, serializable, ephemeral, and free of Lapis, vault, editor, or language-service types. |
| LN-WS-026 | Diagnostic collections MUST isolate entries by owner and support resource replacement, batch replacement, lookup, deletion, clearing, iteration, and disposal. A plugin MUST NOT delete another owner's diagnostics. |
| LN-WS-027 | A diagnostic resource MUST use an opaque URI with optional label, detail, and icon hints. Positions MUST be zero-based; ranges MAY be absent for resource-wide or workspace-wide issues, and a `null` resource MUST represent a shell-wide issue. |
| LN-WS-028 | The generic Problems panel MUST provide severity counts and filters, search, sorted resource and Workspace groups, collapse controls, related-information rows, diagnostic tags, an empty state, and one-based line and column display. |
| LN-WS-029 | Primary problem activation MUST delegate to a host navigation adapter. Context menus MUST provide Copy Message and Copy Problem before collection-owned actions, including on tree group rows. Copy Problem MUST copy a JSON array of serializable problem objects. Unlocated shell failures MUST remain non-navigable. |
| LN-WS-030 | The required Problems presentation plugin MUST preserve a persisted or moved Problems leaf, including an empty missing-view placeholder, and MUST NOT seed a bottom tab on hydration. Show Problems MUST activate and reveal the existing instance wherever it lives, or create the default closable bottom-dock tab when none exists. After the required plugin starts, that leaf MUST remount as host-owned `workspace:problems` and MUST NOT remain a ghost missing-view surface. |
| LN-WS-031 | The App Shell MUST publish active static-plugin enablement and layout, configuration, plugin-state, and notification-persistence failures through an internal collection. It MUST clear each failure after recovery and MUST NOT mirror ordinary notices or notification history. |
| LN-WS-032 | Lapis MUST expose structurally compatible diagnostics through `app.workspace.diagnostics` and `Plugin.createDiagnosticCollection()`. Plugin-owned collections MUST dispose automatically without requiring community plugins to import Design Core. |
| LN-WS-033 | `LanguageServiceManager` MUST publish completed open-document diagnostics into one shared collection and cache matching code actions. It MUST reference-count editor ownership, clear final-close and provider-unload results, and MUST NOT scan unopened vault resources. |
| LN-WS-076 | `LanguageServiceManager` MUST merge diagnostics and code actions from every matching provider into the shared collection. Priority MUST order providers and MUST NOT hide a lower-priority match. A provider that does not complete MUST NOT block other matches. Completion and hover MAY stay first-match. |
| LN-WS-077 | `LanguageServiceManager` MUST publish a workspace-wide (`null` resource) error when a matching diagnostics or code-action provider throws or does not complete. It MUST keep other providers' document diagnostics. It MUST clear that failure when the provider later succeeds or unloads. New diagnostics MUST NOT open Problems. |
| LN-WS-078 | Lapis MUST publish each plugin load or enable failure as a workspace-wide error and MUST clear it after a later successful enable. It MUST NOT mirror ordinary notices or notification history. App Shell static-plugin and persistence failures remain LN-WS-031. |
| LN-WS-056 | Cached hover and Problems actions for a diagnostic MUST belong to that diagnostic. The cache MUST expose at most one action per distinct title. |
| LN-WS-034 | Problems navigation MUST open or focus the opaque Lapis note resource and reveal its diagnostic range. Collection menus MUST expose cached language-service actions. An action for an open resource MUST update its CodeMirror document and vault before diagnostics refresh so both surfaces consume the same result. |
| LN-WS-035 | The Markdown editor MUST compose language-service diagnostics in Source and Live Preview with completion and hover disabled. Mira MUST continue to own completion and hover behavior while the CodeMirror lint gutter and Problems panel consume the same result. |
| LN-WS-036 | The enabled Markdownlint core plugin MUST prefer the probed native Markdown language-service capability and fall back to its worker. It MUST preserve `markdown-lint.disabledRules`, fixes, and ignore actions through the existing provider contract. |
| LN-WS-037 | Storybook acceptance MUST prove an invalid open Markdown note appears in the lint gutter and bottom Problems panel, filters and navigates correctly, and applies a fix. It MUST restore the invalid fixture before completion and wait until both surfaces report the same diagnostics. New Problems stories MUST retain literal `visual-pending` metadata without creating a baseline. |
| LN-WS-038 | CodeMirror lint gutter markers MUST use the same severity glyphs and semantic colours as the Problems panel. Each marker MUST remain centered within its gutter element alongside Mira-owned gutter controls. |
| LN-WS-039 | A diagnostic hover card MUST keep its message, source, and code on one compact row. Its copy action MUST remain at the row's right edge without increasing the row height. |
| LN-WS-040 | A diagnostic hover card MUST remain open while the pointer crosses from its marked source or gutter marker into the card. During handoff, it MUST retain the originating diagnostic and stable placement even when the pointer crosses another marked range. The card MUST close only after the pointer leaves both surfaces and their handoff corridor. |
| LN-WS-072 | A diagnostic hover card MUST open only when the pointer is over the underlined diagnostic range or that diagnostic's gutter marker. It MUST NOT open from the rest of the line, including empty space after the mark. |
| LN-WS-041 | The Problems panel MUST default to its grouped tree and provide an upper-right action that switches between tree and table presentations. A host MAY select table as the initial mode, but the choice MUST remain transient and MUST NOT mutate workspace layout. |
| LN-WS-042 | The Problems table MUST expose Code, Message, File, and Source columns. It MUST retain the tree presentation's severity filters, search, navigation, related information, tags, and context actions. |
| LN-WS-043 | Problems table overflow MUST use the shared shadcn Scroll Area for both axes. The table MUST NOT introduce a separate native panel scrollbar when moved into a constrained workspace surface. |
| LN-WS-044 | Activating `View Problem` MUST render a compact inline problem beneath the diagnostic line. The surface MUST expose a warning pointer and accent, a distinct header and body, source and rule metadata, and an accessible close control. |
| LN-WS-045 | `View Problem` MUST hand off from its hover card to the inline problem without retaining stale hover state. After the inline problem closes, hovering a diagnostic MUST show its card again. |
| LN-WS-046 | The owning Problems leaf MUST show the live total as a shared workspace badge with visible non-hover paint. The persisted title MUST remain `Problems`, and the panel toolbar MUST NOT duplicate the total. |
| LN-WS-047 | Problems severity toggles MUST be compact checkbox items in an untitled filter menu triggered by an inline `list-filter` action inside the search field. The menu MUST retain semantic severity icon colours and show `Errors`, `Warnings`, `Infos`, and `Hints` with unclipped totals in one aligned count column. |
| LN-WS-048 | The Problems panel toolbar MUST omit duplicate Problems title text because the owning leaf supplies the label. It MUST align the search, filter, presentation, and collapse controls at the toolbar's right edge. |
| LN-WS-066 | Markdownlint Settings MUST seed `disabledRules` with MD013/line-length, matching vscode-markdownlint. Other default rules MUST stay enabled until listed. The provider MUST apply that list instead of hardcoding MD013. |
| LN-WS-067 | `LanguageServiceManager` MUST publish markdownlint `code` as `{ value, target }` whose target is the public rule documentation URL. Other sources MAY keep a string or number code. |
| LN-WS-069 | The Design Core Problems plugin MUST show a right-aligned status item with the circle-alert icon and the live diagnostics total as its chip. Click MUST run the same reveal-or-create path as Show Problems. The item MUST NOT open the dock when the count changes. |
| LN-WS-073 | `LanguageServiceCodeAction` MAY carry a serializable `command`. Apply paths MUST run provider `applyCommand` after any document edit. Diagnostic objects MUST NOT carry callbacks. |
| LN-WS-074 | Problems tree and table rows MUST use the severity-icon slot as the quick-fix control when the collection contributed actions. Hover or focus MUST show a Lucide lightbulb. Click MUST open the portaled workspace menu of those actions. The Copy-first context menu MUST remain. |
| LN-WS-079 | A diagnostic hover card MUST expose one Quick Fix control for cached code actions instead of listing each action. That control MUST open the portaled workspace menu of those actions. View Problem MAY remain a separate control. |

`Plugin.registerAgentTool` is independent from diagnostic collections and does
not add callbacks or agent-specific fields to serializable diagnostics.

## Ownership

- Design Core owns diagnostics data structures, owner isolation, generic
  sorting/filtering, copy actions, tree/table presentation state, shared scroll
  behavior, movable Problems presentation, and ephemeral leaf badge rendering.
- Lapis API owns the compatibility façade, plugin lifecycle mapping, opaque URI
  resolution, vault navigation, editor ownership, and language-service bridge.
  That bridge merges complementary diagnostics and code actions (LN-WS-076)
  and publishes provider and plugin startup failures as workspace-wide
  Problems (LN-WS-077, LN-WS-078).
- Language-service packages own provider-neutral client and worker utilities.
- Markdownlint owns Markdown rules, native/worker provider selection, vscode-markdownlint
  Fix this / Fix all / Disable line / Disable file / Disable in this vault
  actions, and its configuration field.
- Spell Check owns Harper diagnostics through the shared language-service
  collection. Its Problems menu uses cspell-style suggestion, dictionary, and
  ignore-word titles. Its status item refreshes from configuration and MUST NOT
  upsert on `layout-change`.
- Mira continues to own Markdown completion and hover behavior. The language
  service contributes diagnostics and code actions only in this slice.
  Lint hover cards open only on the underlined range or gutter marker, not the
  rest of the line. Cached code actions appear behind one Quick Fix control
  that opens the same portaled workspace menu as Problems (LN-WS-079).

## Lifecycle

Diagnostics are not workspace layout state. Closing the Problems view does not
clear collections, and new diagnostics do not open it. Hydration reapplies a
persisted Problems leaf, including a leftover empty missing-view placeholder,
and does not insert a quiet bottom tab. After the required plugin starts that
leaf remounts as host-owned `workspace:problems` instead of a ghost
missing-view surface. API compatibility projection keeps that type so a later
file open or other API layout commit cannot replace it with an empty
placeholder. Closing the final editor
for a Markdown resource clears its language-service entry; reopening the file
requests a fresh result. Disabling or unloading a provider clears results that
the provider owned. Navigation focuses an existing file leaf before opening a
new one so diagnostic ownership is not churned. The browser fallback installs
only the entity-decoder contract needed when Markdownlint's parser selects its
DOM export inside a Web Worker. That shim reports standards-mode
`compatMode` so shared worker chunks cannot treat the worker as quirks.

The Electron consumer uses the same provider-neutral diagnostics and actions
through `@lapis-notes/language-service/markdownlint/runtime`. Its child process
accepts Markdown documents only, exposes capability probing, update,
diagnostics, and code actions, and uses bounded request timeouts plus restart
and shutdown handling. The desktop host does not register the Markdownlint
plugin during partial-shell startup; the native provider remains available for
later plugin activation.

Plugin view ownership retained for disable and re-enable recovery remains
separate from diagnostic collection ownership. Both use the API `Plugin`
registration lifecycle, and neither permits one plugin to dispose another
plugin's contributions. Search-document providers use the same plugin-owned
cleanup mechanism but remain separate from diagnostic collections and Problems
presentation.
The generic Plugin API also carries explicit `ViewAccess` classification for
first-party view registrations; the Problems command remains governed by its
own required-panel lifecycle above.
App `app:rebuild-vault-cache` and `app:rebuild-generated-state` report file
progress through notifications, not Problems collections (LN-PKG-097,
LN-PKG-098).
