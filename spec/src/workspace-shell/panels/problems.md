# Problems

The Problems view is a reusable workspace panel. Design Core owns the generic
diagnostic model, collection lifecycle, and presentation; Lapis adapts vault,
language-service, navigation, and plugin behavior at its public API boundary.

The Lapis façade, plugin-owned disposal, open-document bridge, cached actions,
navigation adapter, diagnostics-only Markdown composition, and default
Markdownlint provider are implemented.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-WS-025 | Design Core MUST own the application-independent `WorkspaceDiagnostic` model and `WorkspaceDiagnosticsManager`. Diagnostic data MUST remain plain, serializable, ephemeral, and free of Lapis, vault, editor, or language-service types. |
| LN-WS-026 | Diagnostic collections MUST isolate entries by owner and support resource replacement, batch replacement, lookup, deletion, clearing, iteration, and disposal. A plugin MUST NOT delete another owner's diagnostics. |
| LN-WS-027 | A diagnostic resource MUST use an opaque URI with optional label, detail, and icon hints. Positions MUST be zero-based; ranges MAY be absent for resource-wide or workspace-wide issues, and a `null` resource MUST represent a shell-wide issue. |
| LN-WS-028 | The generic Problems panel MUST provide severity counts and filters, search, sorted resource and Workspace groups, collapse controls, related-information rows, diagnostic tags, an empty state, and one-based line and column display. |
| LN-WS-029 | Primary problem activation MUST delegate to a host navigation adapter. Context menus MUST provide Copy Message and Copy Problem before collection-owned actions, while unlocated shell failures remain non-navigable. |
| LN-WS-030 | The required Problems presentation plugin MUST preserve a persisted or moved Problems leaf. Otherwise it MUST seed one inactive, closable bottom-dock tab after hydration without opening the dock, and the Show Problems command MUST reveal or recreate it. |
| LN-WS-031 | The App Shell MUST publish active static-plugin enablement and layout, configuration, plugin-state, and notification-persistence failures through an internal collection. It MUST clear each failure after recovery and MUST NOT mirror ordinary notices or notification history. |
| LN-WS-032 | Lapis MUST expose structurally compatible diagnostics through `app.workspace.diagnostics` and `Plugin.createDiagnosticCollection()`. Plugin-owned collections MUST dispose automatically without requiring community plugins to import Design Core. |
| LN-WS-033 | `LanguageServiceManager` MUST publish completed open-document diagnostics into one shared collection and cache matching code actions. It MUST reference-count editor ownership, clear final-close and provider-unload results, and MUST NOT scan unopened vault resources. |
| LN-WS-034 | Problems navigation MUST open or focus the opaque Lapis note resource and reveal its diagnostic range. Collection menus MUST expose cached language-service actions. An action for an open resource MUST update its CodeMirror document and vault before diagnostics refresh so both surfaces consume the same result. |
| LN-WS-035 | The Markdown editor MUST compose language-service diagnostics in Source and Live Preview with completion and hover disabled. Mira MUST continue to own completion and hover behavior while the CodeMirror lint gutter and Problems panel consume the same result. |
| LN-WS-036 | The enabled Markdownlint core plugin MUST prefer the probed native Markdown language-service capability and fall back to its worker. It MUST preserve `markdown-lint.disabledRules`, fixes, and ignore actions through the existing provider contract. |
| LN-WS-037 | Storybook acceptance MUST prove an invalid open Markdown note appears in the lint gutter and bottom Problems panel, filters and navigates correctly, and applies a fix. It MUST restore the invalid fixture before completion and wait until both surfaces report the same diagnostics. New Problems stories MUST retain literal `visual-pending` metadata without creating a baseline. |
| LN-WS-038 | CodeMirror lint gutter markers MUST use the same severity glyphs and semantic colours as the Problems panel. Each marker MUST remain centered within its gutter element alongside Mira-owned gutter controls. |
| LN-WS-039 | A diagnostic hover card MUST keep its message, source, and code on one compact row. Its copy action MUST remain at the row's right edge without increasing the row height. |
| LN-WS-040 | A diagnostic hover card MUST remain open while the pointer crosses from its marked source or gutter marker into the card. During handoff, it MUST retain the originating diagnostic and stable placement even when the pointer crosses another marked range. The card MUST close only after the pointer leaves both surfaces and their handoff corridor. |
| LN-WS-041 | The Problems panel MUST default to its grouped tree and provide an upper-right action that switches between tree and table presentations. A host MAY select table as the initial mode, but the choice MUST remain transient and MUST NOT mutate workspace layout. |
| LN-WS-042 | The Problems table MUST expose Code, Message, File, and Source columns. It MUST retain the tree presentation's severity filters, search, navigation, related information, tags, and context actions. |
| LN-WS-043 | Problems table overflow MUST use the shared shadcn Scroll Area for both axes. The table MUST NOT introduce a separate native panel scrollbar when moved into a constrained workspace surface. |
| LN-WS-044 | Activating `View Problem` MUST render a compact inline problem beneath the diagnostic line. The surface MUST expose a warning pointer and accent, a distinct header and body, source and rule metadata, and an accessible close control. |
| LN-WS-045 | `View Problem` MUST hand off from its hover card to the inline problem without retaining stale hover state. After the inline problem closes, hovering a diagnostic MUST show its card again. |
| LN-WS-046 | The owning Problems leaf MUST show the live total as a shared workspace badge with visible non-hover paint. The persisted title MUST remain `Problems`, and the panel toolbar MUST NOT duplicate the total. |
| LN-WS-047 | Problems severity toggles MUST be compact checkbox items in an untitled filter menu triggered by an inline `list-filter` action inside the search field. The menu MUST retain semantic severity icon colours and show `Errors`, `Warnings`, `Infos`, and `Hints` with unclipped totals in one aligned count column. |
| LN-WS-048 | The Problems panel toolbar MUST omit duplicate Problems title text because the owning leaf supplies the label. It MUST align the search, filter, presentation, and collapse controls at the toolbar's right edge. |

## Ownership

- Design Core owns diagnostics data structures, owner isolation, generic
  sorting/filtering, copy actions, tree/table presentation state, shared scroll
  behavior, movable Problems presentation, and ephemeral leaf badge rendering.
- Lapis API owns the compatibility façade, plugin lifecycle mapping, opaque URI
  resolution, vault navigation, editor ownership, and language-service bridge.
- Language-service packages own provider-neutral client and worker utilities.
- Markdownlint owns Markdown rules, native/worker provider selection, fixes,
  ignore actions, and its configuration field.
- Mira continues to own Markdown completion and hover behavior. The language
  service contributes diagnostics and code actions only in this slice.

## Lifecycle

Diagnostics are not workspace layout state. Closing the Problems view does not
clear collections, and new diagnostics do not open it. Closing the final editor
for a Markdown resource clears its language-service entry; reopening the file
requests a fresh result. Disabling or unloading a provider clears results that
the provider owned. Navigation focuses an existing file leaf before opening a
new one so diagnostic ownership is not churned. The browser fallback installs
only the entity-decoder contract needed when Markdownlint's parser selects its
DOM export inside a Web Worker.
