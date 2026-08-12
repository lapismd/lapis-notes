# Problems

The Problems view is a reusable workspace panel. Design Core owns the generic
diagnostic model, collection lifecycle, and presentation; Lapis adapts vault,
language-service, navigation, and plugin behavior at its public API boundary.

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
| LN-WS-034 | Problems navigation MUST open or focus the opaque Lapis note resource and reveal its diagnostic range. Collection menus MUST expose cached language-service actions through the existing vault mutation path and refresh diagnostics after a successful action. |
| LN-WS-035 | The Markdown editor MUST compose language-service diagnostics in Source and Live Preview with completion and hover disabled. Mira MUST continue to own completion and hover behavior while the CodeMirror lint gutter and Problems panel consume the same result. |
| LN-WS-036 | The enabled Markdownlint core plugin MUST prefer the probed native Markdown language-service capability and fall back to its worker. It MUST preserve `markdown-lint.disabledRules`, fixes, and ignore actions through the existing provider contract. |
| LN-WS-037 | Storybook acceptance MUST prove an invalid open Markdown note appears in the lint gutter and bottom Problems panel, filters and navigates correctly, applies a fix, and clears. New Problems stories MUST retain literal `visual-pending` metadata without creating a baseline. |

## Ownership

- Design Core owns diagnostics data structures, owner isolation, generic
  sorting/filtering, copy actions, and movable Problems presentation.
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
the provider owned.
