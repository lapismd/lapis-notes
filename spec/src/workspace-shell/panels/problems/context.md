# Problems / Context

Daily-document provider failures remain explicit caller errors; the Problems
panel does not silently repair duplicate dates or occupied generated paths.

The API Markdown registries do not alter diagnostics ownership. Markdown live
preview composes the existing language-service extension, and domain
contributions do not create a second Problems collection or cache.

The Problems view is a reusable workspace panel. Design Core owns the generic
diagnostic model, collection lifecycle, and presentation; Lapis adapts vault,
language-service, navigation, and plugin behavior at its public API boundary.
The experimental Deno desktop spike does not add a language-service sidecar.
Nostr signer denial and unavailability remain direct operation errors under
LN-ARCH-099; they do not expose credentials through diagnostic records.

The Lapis façade, plugin-owned disposal, open-document bridge, cached actions,
navigation adapter, diagnostics-only Markdown composition, and default
Markdownlint provider are implemented.

Skill parse and discovery diagnostics stay in the AI plugin and do not enter
Problems collections. `registerIndexProjection` does not add Problems
diagnostics or language-service apply paths.

`Plugin.registerAgentTool` and `Plugin.registerAgentResultView` are independent
from diagnostic collections and do not add callbacks or agent-specific fields
to serializable diagnostics.

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
  ignore-word titles. Diagnostics requested while Harper is warming complete
  empty; setup failures still surface through the provider-failure Problems row.
  Its status item refreshes from configuration and MUST NOT upsert on
  `layout-change`.
- Mira continues to own Markdown completion and hover behavior. The language
  service contributes diagnostics and code actions only in this slice.
  Lint hover cards open only on the underlined range or gutter marker, not the
  rest of the line. Cached code actions appear behind one Quick Fix control
  that opens the same portaled workspace menu as Problems (LN-WS-079).

## Lifecycle

For LN-WS-046, editor-demo acceptance checks the leaf badge and rendered rows
against the complete current diagnostics snapshot, including other providers and
workspace-wide collections. The long-form Markdownlint scenario keeps its exact
17-rule-result assertion separate from that total and exercises addition and
disposal of another collection without changing the note.

- Diagnostics are not workspace layout state.

- Closing the Problems view does not clear collections, and new diagnostics do not open it.

- Hydration reapplies a persisted Problems leaf, including a leftover empty missing-view placeholder, and does not insert a quiet bottom tab.

- After the required plugin starts that leaf remounts as host-owned `workspace:problems` instead of a ghost missing-view surface.

- API compatibility projection keeps that type so a later file open or other API layout commit cannot replace it with an empty placeholder.

- Closing the final editor for a Markdown resource clears its language-service entry; reopening the file requests a fresh result.

- Disabling or unloading a provider clears results that the provider owned.

- Navigation focuses an existing file leaf before opening a new one so diagnostic ownership is not churned.

- The browser fallback installs only the entity-decoder contract needed when Markdownlint's parser selects its DOM export inside a Web Worker.

- That shim reports standards-mode `compatMode` so shared worker chunks cannot treat the worker as quirks.

The Deno desktop consumer uses the same provider-neutral diagnostics and actions
through `@lapis-notes/language-service/markdownlint/runtime`. Its child process
accepts Markdown documents only, exposes capability probing, update,
diagnostics, and code actions, and uses bounded request timeouts plus restart
and shutdown handling. The desktop host exposes that bounded service but does
not register a renderer provider during partial-shell startup. Plugin activation
registers the sole provider and forwards the current vault rules.

Plugin view ownership retained for disable and re-enable recovery remains
separate from diagnostic collection ownership. Both use the API `Plugin`
registration lifecycle, and neither permits one plugin to dispose another
plugin's contributions. Search-document providers use the same plugin-owned
cleanup mechanism but remain separate from diagnostic collections and Problems
presentation.
The generic Plugin API also carries explicit `ViewAccess` classification for
first-party view registrations; the Problems command remains governed by its
own required-panel lifecycle above.
Problems is a required core surface and therefore follows the query-native
plugin lifecycle: enabling it never requests the community metadata snapshot
lease. Diagnostic collections remain independent of metadata index revisions.

A denied sync unlock, network grant, invalid capability request, or plugin
activation failure continues through the existing plugin-failure diagnostic
path. Problems does not receive secret values, broker request bodies, headers,
or key material, and it does not become the owner of sync recovery policy.
App `app:rebuild-vault-cache` and `app:rebuild-generated-state` report file
progress through notifications, not Problems collections (LN-PKG-097,
LN-PKG-098).
Metadata query failures remain owned by the requesting panel and its retry
surface. They do not become editor diagnostics or Problems collection entries.
