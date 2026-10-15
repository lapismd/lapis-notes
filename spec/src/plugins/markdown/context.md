# Markdown Plugin / Context

Daily notes remain ordinary authoritative Markdown documents. The Markdown
plugin parses and edits them through its existing file surfaces while the
API-owned daily-document provider supplies identity and path policy to domain
plugins.

The Markdown plugin owns Markdown document behavior and its integration with the
Lapis plugin, editor, metadata, and workspace APIs. Movable panel behavior is
specified separately under [Panels](panels/index.md).

The API Nostr signer facade in LN-PLUG-078 is independent of Markdown
rendering, metadata, and editor contributions; this plugin neither stores nor
interprets signer credentials.

The production plugin also owns the Tags panel. Its persisted panel IDs follow
the canonical Obsidian-compatible names governed by `LN-MD-085` and
`LN-MD-086`, while former Lapis IDs remain load-only compatibility aliases.
The Deno desktop host loads the same public Markdown package and verified asset
metadata as web; Markdown does not own a desktop-specific loader or asset URL.

File Properties value autocomplete and wikilink pills stay on the Lapis
frontmatter adapter and Mira file adapter. Live Preview and Reading receive the
same App-scoped configuration so text and list property values can be completed
from metadata across the vault; Mira owns the portalled editor UI. Metadata parse uses a Markdown
worker whose packaged import stays extensionless; heavy type widgets remain deferred. File-scoped Outline, Backlinks, and
Outgoing Links share one follow helper under `LN-MD-098` and do not rewrite
state when a leaf event repeats the same followed path.
Linked mentions paint from `getCache`/`getFileCache` even when `getAllItems()`
is still empty. Backlinks also read `resolvedLinks` for inbound sources.

## Ownership

- Reusable Plugin and Editor contracts remain in `@lapis-notes/api`.

- Markdown document policy lives in `@lapis-notes/markdown` and is implemented by Mira.

- The Lapis package owns the app-bound `MiraFileAdapter` and reuses one instance per App; portable rendering and editor behavior remain Mira-owned.

- Markdown views, renderers, frontmatter, and Mira extension factories receive that App explicitly; static compatibility entrypoints resolve only through the documented fallback.

- The diagnostics extension reference-counts open editor views and reuses the manager's cached code actions; it does not replace Mira completion or hover behavior.

- The generic Problems leaf renders its live total through Design Core's ephemeral view badge; Markdown and Markdownlint contribute diagnostics but do not construct or persist that presentation.

- Markdown also owns `notes_list`.

- That callback captures the plugin's Vault, accepts only scoped portable Markdown paths outside `.lapis`, `.lapis`, and `.trash`, and returns bounded transport-neutral records.

- The list description tells the agent to prefer it over host-cwd directory walking (LN-AI-108).

- Bounded reads and mutating file edits belong to API `read`, `write`, `edit`, and `apply_patch`.

- The narrow `@lapis-notes/markdown/agent-tools` entry exposes the list factory for package tests and explicit diagnostics; the root plugin remains responsible for registering it in production.

Panel registration, package exports, and per-panel behavior are documented in
the [Markdown panel specification](panels/index.md). Shared
workspace presentation and Storybook rules live under
[Workspace Shell / Panels](../../workspace-shell/panels.md).
The panel registry is also the command-discovery authority required by
`LN-MD-089`; document views continue to open through their file associations.

Tags and All Properties remain Markdown-owned metadata views. Their vault-wide
navigation delegates through the registered Search command described by the
[Search Plugin](../search/index.md); Markdown does not import Search internals.
These first-party views use persisted metadata facets and paged rows directly;
file-scoped Outline, File Properties, Backlinks, and Outgoing Links fetch their
current path asynchronously and discard results superseded by a later followed
file or revision. Markdown does not acquire the third-party snapshot lease.
The six canonical Markdown panels register `ViewAccess.command` openers from
their registry. Markdown and Media remain `ViewAccess.file`, and legacy panel
view types remain `ViewAccess.alias` without palette duplicates.
The canonical registry is mirrored by the generic Storybook command-panel
catalog, replacing Markdown-specific catalog arrays while retaining the same
real registrations and one instance per placement.

The generic sync-host checkpoint boundary asks the active API editor to flush
its serialized changes before a streamed read. Markdown remains the owner of
the Mira full-file surface and dirty-buffer persistence; the sync host neither
reads editor internals nor bypasses Markdown's flush contract.
Markdown panels treat database readiness as sufficient to paint persisted
metadata. Their async refresh paths react to committed revisions, retain the
newest generation, and surface query failures without snapshot fallback.
Core tag projection combines inline Markdown tags with normalized frontmatter
tags, including hierarchy ancestors, before Tags or Search facets query the
database.
