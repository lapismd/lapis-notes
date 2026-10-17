# Problems / Integration contracts

Plugin load failures use canonical plugin IDs even when their messages include
source paths. Successful external uninstall removes that owner's runtime
failure through `plugin-unloaded` (LN-PLUG-119). Native-service admission failures
retain their unsupported/disabled distinction (LN-PLUG-121). Problems presentation
and diagnostic collection ownership remain unchanged.

LN-PLUG-113 records rejected external plugin startup through existing runtime
diagnostics before manifest contributions or code can activate. It adds no
Problems presentation, document collection or diagnostic ownership boundary.

LN-PKG-183 adds an App-owned watch service without changing diagnostic ownership.
File changes reach existing workspace/editor lifecycles under LN-WS-097;
Problems retains its existing open-document and disposal boundaries.

Diagnostic registrations retain their component-owned disposal. The shared
Plugin disable boundary additionally drains host security cleanup; unload or
security cleanup failures propagate through the plugin failure state
(LN-ARCH-118).

Editor persistence/refresh failures under LN-ARCH-125 and LN-ARCH-127 remain
observable through the editor boundary. This does not add a diagnostic cache
or move file, buffer or Sync authority into Problems presentation.
Independent editing-session admission and cleanup failures remain observable
through LN-ARCH-129 through LN-ARCH-131. The registry does not create diagnostics
or alter Problems ownership.

File operations started by owned actions remain attached to the originating
App's admission registry. Conditional hosts drain that work before disposing
their views and diagnostic collections; Problems does not acquire file-save or
shutdown policy.

## LN-WS-025 — Design Core: own the application-independent WorkspaceDiagnostic model and WorkspaceDiagnosticsManager

<a id="ln-ws-025"></a>

**Requirement.** Design Core MUST own the application-independent `WorkspaceDiagnostic` model and `WorkspaceDiagnosticsManager`. Diagnostic data MUST remain plain, serializable, ephemeral, and free of Lapis, vault, editor, or language-service types.

## LN-WS-026 — Diagnostic collections: isolate entries by owner and support resource

<a id="ln-ws-026"></a>

**Requirement.** Diagnostic collections MUST isolate entries by owner and support resource replacement, batch replacement, lookup, deletion, clearing, iteration, and disposal. A plugin MUST NOT delete another owner's diagnostics.

## LN-WS-027 — Diagnostic resource: use an opaque URI with optional label

<a id="ln-ws-027"></a>

**Requirement.** A diagnostic resource MUST use an opaque URI with optional label, detail, and icon hints. Positions MUST be zero-based; ranges MAY be absent for resource-wide or workspace-wide issues, and a `null` resource MUST represent a shell-wide issue.

## LN-WS-028 — Generic Problems panel: provide severity counts and filters, search, sorted

<a id="ln-ws-028"></a>

**Requirement.** The generic Problems panel MUST provide severity counts and filters, search, sorted resource and Workspace groups, collapse controls, related-information rows, diagnostic tags, an empty state, and one-based line and column display.

## LN-WS-029 — Primary problem activation: delegate to a host navigation adapter. Context

<a id="ln-ws-029"></a>

**Requirement.** Primary problem activation MUST delegate to a host navigation adapter. Context menus MUST provide Copy Message and Copy Problem before collection-owned actions, including on tree group rows. Copy Problem MUST copy a JSON array of serializable problem objects. Unlocated shell failures MUST remain non-navigable.

Applications may register disposable diagnostic openers for opaque resources.
The first opener that handles a location owns navigation; unmatched resources
retain ordinary note navigation. Registration does not grant vault authority or
change diagnostic data, and disposal removes only the owning registration.

## LN-WS-030 — Required Problems presentation plugin: preserve a persisted or moved Problems leaf

<a id="ln-ws-030"></a>

**Requirement.** The required Problems presentation plugin MUST preserve a persisted or moved Problems leaf, including an empty missing-view placeholder, and MUST NOT seed a bottom tab on hydration. Show Problems MUST activate and reveal the existing instance wherever it lives, or create the default closable bottom-dock tab when none exists. After the required plugin starts, that leaf MUST remount as host-owned `workspace:problems` and MUST NOT remain a ghost missing-view surface.

## LN-WS-031 — App Shell: publish active static-plugin enablement and layout, configuration

<a id="ln-ws-031"></a>

**Requirement.** The App Shell MUST publish active static-plugin enablement and layout, configuration, plugin-state, and notification-persistence failures through an internal collection. It MUST clear each failure after recovery and MUST NOT mirror ordinary notices or notification history.

## LN-WS-032 — Lapis: expose structurally compatible diagnostics through app.workspace.diagnostics

<a id="ln-ws-032"></a>

**Requirement.** Lapis MUST expose structurally compatible diagnostics through `app.workspace.diagnostics` and `Plugin.createDiagnosticCollection()`. Plugin-owned collections MUST dispose automatically without requiring community plugins to import Design Core.

## LN-WS-033 — LanguageServiceManager: publish completed open-document diagnostics into one shared

<a id="ln-ws-033"></a>

**Requirement.** `LanguageServiceManager` MUST publish completed open-document diagnostics into one shared collection and cache matching code actions. For concurrent requests on one resource, only the newest request MAY publish diagnostics or cached actions. It MUST reference-count editor ownership, preserve results across a same-turn editor remount, clear a true final-close and provider-unload result, and MUST NOT scan unopened vault resources.

## LN-WS-076 — LanguageServiceManager: merge diagnostics and code actions from every

<a id="ln-ws-076"></a>

**Requirement.** `LanguageServiceManager` MUST merge diagnostics and code actions from every matching provider into the shared collection. Priority MUST order providers and MUST NOT hide a lower-priority match. A provider that does not complete MUST NOT block other matches. Completion and hover MAY stay first-match.

## LN-WS-077 — LanguageServiceManager: publish a workspace-wide (null resource) error

<a id="ln-ws-077"></a>

**Requirement.** `LanguageServiceManager` MUST publish a workspace-wide (`null` resource) error when a matching diagnostics or code-action provider throws or does not complete. It MUST keep other providers' document diagnostics. It MUST clear that failure when the provider later succeeds or unloads. New diagnostics MUST NOT open Problems.

## LN-WS-078 — Lapis: publish each plugin load or enable failure

<a id="ln-ws-078"></a>

**Requirement.** Lapis MUST publish each plugin load or enable failure as a workspace-wide error and MUST clear it after a later successful enable. It MUST NOT mirror ordinary notices or notification history. App Shell static-plugin and persistence failures remain LN-WS-031.

## LN-WS-056 — Diagnostic-owned cached actions

<a id="ln-ws-056"></a>

**Requirement.** Cached hover and Problems actions for a diagnostic MUST belong to that diagnostic. The cache MUST expose at most one action per distinct title.

## LN-WS-034 — Problems navigation: open or focus the opaque Lapis note

<a id="ln-ws-034"></a>

**Requirement.** Problems navigation MUST open or focus the opaque Lapis note resource and reveal its diagnostic range. Collection menus MUST expose cached language-service actions. An action for an open resource MUST update its CodeMirror document and vault before diagnostics refresh so both surfaces consume the same result.

## LN-WS-035 — Markdown editor: compose language-service diagnostics in Source and Live

<a id="ln-ws-035"></a>

**Requirement.** The Markdown editor MUST compose language-service diagnostics in Source and Live Preview with completion and hover disabled. Mira MUST continue to own completion and hover behavior while the CodeMirror lint gutter and Problems panel consume the same result.

## LN-WS-036 — Enabled Markdownlint static plugin: own the sole renderer provider, consume

<a id="ln-ws-036"></a>

**Requirement.** The enabled Markdownlint static plugin MUST own the sole renderer provider, consume the public `@lapis-notes/language-service` package through built npm exports, prefer the probed native Markdown capability, and fall back to its worker. The reusable language-service client MUST construct that fallback from its package-stable emitted JavaScript URL as a module worker, without a Vite query-suffix import. It MUST preserve `markdown-lint.disabledRules`, fixes, and ignore actions through the existing provider contract. The desktop host MUST NOT register a competing provider.

## LN-WS-037 — Storybook acceptance: prove an invalid open Markdown note appears

<a id="ln-ws-037"></a>

**Requirement.** Storybook acceptance MUST prove an invalid open Markdown note appears in the lint gutter and bottom Problems panel, filters and navigates correctly, and applies a fix. It MUST restore the invalid fixture before completion and wait until both surfaces report the same diagnostics. New Problems stories MUST retain literal `visual-pending` metadata without creating a baseline.

## LN-WS-038 — CodeMirror lint gutter markers: use the same severity glyphs and semantic

<a id="ln-ws-038"></a>

**Requirement.** CodeMirror lint gutter markers MUST use the same severity glyphs and semantic colours as the Problems panel. Each marker MUST remain centered within its gutter element alongside Mira-owned gutter controls.

Storybook acceptance resolves the current connected gutter and marker together
inside one readiness assertion. It verifies the glyph mask and flex centering
against that same DOM snapshot, since CodeMirror measurement can replace gutter
children between asynchronous checks.

## LN-WS-039 — Diagnostic hover card: keep its message, source, and code on

<a id="ln-ws-039"></a>

**Requirement.** A diagnostic hover card MUST keep its message, source, and code on one compact row. Its copy action MUST remain at the row's right edge without increasing the row height.

## LN-WS-040 — Diagnostic hover card: remain open while the pointer crosses

<a id="ln-ws-040"></a>

**Requirement.** A diagnostic hover card MUST remain open while the pointer crosses from its marked source or gutter marker into the card. During handoff, it MUST retain the originating diagnostic and stable placement even when the pointer crosses another marked range. The card MUST close only after the pointer leaves both surfaces and their handoff corridor.

## LN-WS-072 — Diagnostic hover card: open only when the pointer is over

<a id="ln-ws-072"></a>

**Requirement.** A diagnostic hover card MUST open only when the pointer is over the underlined diagnostic range or that diagnostic's gutter marker. It MUST NOT open from the rest of the line, including empty space after the mark.

## LN-WS-041 — Problems panel: default to its grouped tree and provide

<a id="ln-ws-041"></a>

**Requirement.** The Problems panel MUST default to its grouped tree and provide an upper-right action that switches between tree and table presentations. A host MAY select table as the initial mode, but the choice MUST remain transient and MUST NOT mutate workspace layout.

## LN-WS-042 — Problems table: expose Code, Message, File, and Source columns

<a id="ln-ws-042"></a>

**Requirement.** The Problems table MUST expose Code, Message, File, and Source columns. It MUST retain the tree presentation's severity filters, search, navigation, related information, tags, and context actions.

## LN-WS-043 — Problems table overflow: use the shared shadcn Scroll Area

<a id="ln-ws-043"></a>

**Requirement.** Problems table overflow MUST use the shared shadcn Scroll Area for both axes. The table MUST NOT introduce a separate native panel scrollbar when moved into a constrained workspace surface.

## LN-WS-044 — Activating View Problem: render a compact inline problem beneath

<a id="ln-ws-044"></a>

**Requirement.** Activating `View Problem` MUST render a compact inline problem beneath the diagnostic line. The surface MUST expose a warning pointer and accent, a distinct header and body, source and rule metadata, and an accessible close control.

## LN-WS-045 — View Problem: hand off from its hover card

<a id="ln-ws-045"></a>

**Requirement.** `View Problem` MUST hand off from its hover card to the inline problem without retaining stale hover state. After the inline problem closes, hovering a diagnostic MUST show its card again.

## LN-WS-046 — Owning Problems leaf: show the live total as a shared

<a id="ln-ws-046"></a>

**Requirement.** The owning Problems leaf MUST show the live total as a shared workspace badge with visible non-hover paint. The persisted title MUST remain `Problems`, and the panel toolbar MUST NOT duplicate the total.

The Markdown Problems fixture enables Markdownlint and Harper. Its acceptance
verifies both required Markdownlint codes independently, rejects workspace-wide
provider failures, and compares the painted badge with the complete App-owned
diagnostic snapshot rather than one provider's count.

## LN-WS-047 — Problems severity toggles: compact checkbox items in an untitled filter

<a id="ln-ws-047"></a>

**Requirement.** Problems severity toggles MUST be compact checkbox items in an untitled filter menu triggered by an inline `list-filter` action inside the search field. The menu MUST retain semantic severity icon colours and show `Errors`, `Warnings`, `Infos`, and `Hints` with unclipped totals in one aligned count column.

## LN-WS-048 — Problems panel toolbar: omit duplicate Problems title text because

<a id="ln-ws-048"></a>

**Requirement.** The Problems panel toolbar MUST omit duplicate Problems title text because the owning leaf supplies the label. It MUST align the search, filter, presentation, and collapse controls at the toolbar's right edge.

## LN-WS-066 — Markdownlint Settings: seed disabledRules with MD013/line-length, matching vscode-markdownlint. Other

<a id="ln-ws-066"></a>

**Requirement.** Markdownlint Settings MUST seed `disabledRules` with MD013/line-length, matching vscode-markdownlint. Other default rules MUST stay enabled until listed. The plugin provider MUST pass that list to both worker and native runtimes instead of hardcoding MD013 or accepting an unconfigured host duplicate.

## LN-WS-067 — LanguageServiceManager: publish markdownlint code as { value, target

<a id="ln-ws-067"></a>

**Requirement.** `LanguageServiceManager` MUST publish markdownlint `code` as `{ value, target }` whose target is the public rule documentation URL. Other sources MAY keep a string or number code.

## LN-WS-069 — Design Core Problems plugin: show a right-aligned status item

<a id="ln-ws-069"></a>

**Requirement.** The Design Core Problems plugin MUST show a right-aligned status item with the circle-alert icon and the live diagnostics total as its chip. Click MUST run the same reveal-or-create path as Show Problems. The item MUST NOT open the dock when the count changes.

## LN-WS-073 — Serializable language-service commands

<a id="ln-ws-073"></a>

**Requirement.** `LanguageServiceCodeAction` MAY carry a serializable `command`. Apply paths MUST run provider `applyCommand` after any document edit. Diagnostic objects MUST NOT carry callbacks.

## LN-WS-074 — Problems tree and table rows: use the severity-icon slot as the quick-fix

<a id="ln-ws-074"></a>

**Requirement.** Problems tree and table rows MUST use the severity-icon slot as the quick-fix control when the collection contributed actions. Hover or focus MUST show a Lucide lightbulb. Click MUST open the portaled workspace menu of those actions. The Copy-first context menu MUST remain.

## LN-WS-079 — Diagnostic hover card: expose one Quick Fix control for cached

<a id="ln-ws-079"></a>

**Requirement.** A diagnostic hover card MUST expose one Quick Fix control for cached code actions instead of listing each action. That control MUST open the portaled workspace-styled menu of those actions without depending on a menu primitive context owned by another package instance. View Problem MAY remain a separate control.

## LN-WS-094 — API language-service manager: expose diagnostic invalidation for registered providers. Attached

<a id="ln-ws-094"></a>

**Requirement.** The API language-service manager MUST expose diagnostic invalidation for registered providers. Attached editors whose language matches MUST request diagnostics again without a document edit, keeping the gutter and Problems collection consistent. Unknown or unloaded providers MUST NOT trigger invalidation. Editor subscriptions MUST dispose with the owning view.

Problems and editor acceptance hosts seed `.lapis` configuration and layout
through the shared application state default under LN-ARCH-140. Diagnostic
registration, code-action ownership, and save failure contracts still apply.
