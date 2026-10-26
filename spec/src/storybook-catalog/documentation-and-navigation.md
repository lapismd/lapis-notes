# Storybook Catalog / Documentation and navigation

The generated specification navigation includes
[Native indexing lifetime](../architecture/rust-indexing-lifetime.md) beside the
shared Rust architecture chapters, including the separate
[Native History indexing lifetime](../architecture/rust-history-indexing-lifetime.md)
and [Admitted native History reader](../architecture/rust-history-reader.md).
Their metadata-only MDX mirrors render canonical sources in SUMMARY order;
these documentation entries do not select an application index owner or qualify
the independent desktop/native acceptance gates.

Backlog recommendations use canonical pages and generated metadata-only mirrors
in SUMMARY order. The Legacy plugin ports page records future intake separately
from implemented plugin contracts and verification status.

Rust managed-vault intake is documented through its canonical architecture
chapter and metadata-only MDX mirror in SUMMARY order. The specification source
owns that content; this adds no alternative hosted chooser or application view.

The shared Rust application-services chapter and CORE verification table remain
browsable through generated Specification mirrors and navigation. The backup
service lifetime and durable native turn-admission chapters use that same
metadata-only mirror and SUMMARY order. Adding them does not change production
stories or their interaction/visual gates.

The optional development controller metadata bridge now lives in
`scripts/lib/controller-connection-bridge.ts`, shared by catalog preview and
live acceptance fixtures. It is excluded from the Web product; default stories
remain Fake and no controller sidecar is started.

Plugins app-link stories demonstrate the public App URL registry and Workspace
navigator under [LN-PLUG-106](../plugin-model/app-ownership.md#ln-plug-106).
Historical and unavailable release cases retain independent `visual-pending`
paths under `workspace/plugins/app-link-release-selection` and
`workspace/plugins/app-link-unavailable-version`; capture remains pending.
The shared installation fixture retains the requested version and replaces an
existing record so acceptance verifies the resulting installed state.

The guarded document loading/rename editor-demo scenario maps LN-ARCH-137
through LN-ARCH-139. Its Show Code includes public App construction, vault seed,
Source Editor loading, layout restoration and disposal under LN-CAT-024.
The authored description and independent visual-pending declaration remain
governed by LN-CAT-016 and LN-CAT-017.
Rename acceptance snapshots the original path before the managed operation
mutates the public file object. Installation-failure acceptance identifies the
detail's titled alert independently of the simultaneous notification toast.

## LN-CAT-001 — Repository Storybook catalog: run on port 7010 as the workspace

<a id="ln-cat-001"></a>

**Requirement.** The repository Storybook catalog MUST run on port 7010 as the workspace docs host. Authorized plugin packages MAY host an additional Storybook on a dedicated port for package-local UI and MUST NOT replace the 7010 catalog.

## LN-CAT-004 — Canonical specification links in Docs

<a id="ln-cat-004"></a>

**Requirement.** Story and MDX docs MUST link to canonical `spec/src` chapters instead of copying normative prose.

## LN-CAT-013 — Workspace shell stories: use design-core's shared full-viewport catalog layout, including

<a id="ln-cat-013"></a>

**Requirement.** Workspace shell stories MUST use design-core's shared full-viewport catalog layout, including an unconstrained mobile canvas, and MUST NOT load Lapis/community plugins. They MUST include the minimal design-core notifications chrome plus Lapis version/About metadata. Their Autodocs embeds MUST use the shared isolated 700px padding-free shell viewport rather than inheriting Storybook's default preview height, and authored MDX MUST render each scenario's canonical story description.

## LN-CAT-016 — Workspace/Lapis Editor Demo: boot a real api App and required

<a id="ln-cat-016"></a>

**Requirement.** `Workspace/Lapis Editor Demo` MUST boot a real api `App` and required Storybook-local core plugins over the public memory vault, use one canonical seed, and cover runnable, same-file sync, Markdown frontmatter, Explorer mutation, editor settings, startup, failure, and opening-vault states. Its full-shell Autodocs embeds MUST use the same shared isolated 700px padding-free viewport as `Workspace/Shell` and panel shell Docs, and authored MDX MUST render each scenario's canonical story description.

## LN-CAT-017 — Workspace catalog metadata: enumerate each editor-demo scenario, map it

<a id="ln-cat-017"></a>

**Requirement.** Workspace catalog metadata MUST enumerate each editor-demo scenario, map it to this specification, and retain nested-import `visual-pending` coverage until human approval.

## LN-CAT-018 — Storybook: resolve every design-core workspace entry point

<a id="ln-cat-018"></a>

**Requirement.** Storybook MUST resolve every design-core workspace entry point and `@lapismd/storybook-addon-visual-delta` through their installed sibling links and public exports. Docker visual capture MUST exercise those same linked packages from ignored staged copies, avoiding a mixed installed/source runtime without consumer-owned source aliases.

## LN-CAT-019 — Storybook's Vite aliases: resolve @lapis-notes/api/editor with the root API source

<a id="ln-cat-019"></a>

**Requirement.** Storybook's Vite aliases MUST resolve `@lapis-notes/api/editor` with the root API source so editor interactions and accessibility checks exercise the protected implementation under test.

## LN-CAT-020 — Storybook: resolve @lapis-notes/markdown and linked Mira through built

<a id="ln-cat-020"></a>

**Requirement.** Storybook MUST resolve `@lapis-notes/markdown` and linked Mira through built public package exports, without source aliases. It MUST provide focused `Plugins/Markdown/Panels/*` integration stories for all six Markdown command panels and prebundle dependencies introduced by governed panel interactions.

## LN-CAT-021 — Storybook: expose each non-summary chapter indexed by spec/src/SUMMARY.md

<a id="ln-cat-021"></a>

**Requirement.** Storybook MUST expose each non-summary chapter indexed by `spec/src/SUMMARY.md` as a first-positioned `Specification/*` documentation page in summary order. Nested mdBook chapters MUST retain the same hierarchy in the Storybook sidebar, including Workspace Shell / Panels and each Markdown Plugin / Panels page. Each page MUST render its canonical `spec/src` Markdown through a metadata-only MDX adapter using a raw import and Storybook's `Markdown` block; normative prose MUST NOT be copied into Storybook-owned files.

## LN-CAT-022 — Plugins/Markdown/Panels/All Properties: group six focused child stories for Middle

<a id="ln-cat-022"></a>

**Requirement.** `Plugins/Markdown/Panels/All Properties` MUST group six focused child stories for Middle (Top Tabs), Stacked Tabs, Left Sidebar, Right Sidebar, Bottom Panel, and Sidebar As A Group.

## LN-CAT-023 — Six placements for each Markdown panel

<a id="ln-cat-023"></a>

**Requirement.** File Properties, Outline, Backlinks, Outgoing Links, and Tags MUST each follow the `LN-CAT-022` six-surface pattern in their own nested group.

## LN-CAT-024 — Storybook Docs Show Code panel: present copy-pasteable usage of the real documented

<a id="ln-cat-024"></a>

**Requirement.** Every Storybook Docs Show Code panel MUST present copy-pasteable usage of the real documented component boundary. Public components MUST use public package imports and include the props, state, composition, or persisted layout needed to reproduce the scenario. Show Code MUST NOT present a story-only demo component, harness, decorator, fixture selector, or inferred story args as the consumer API.

## LN-CAT-025 — Story whose render path differs from consumer: define explicit parameters.docs.source with code, language,

<a id="ln-cat-025"></a>

**Requirement.** A story whose render path differs from consumer usage MUST define explicit `parameters.docs.source` with `code`, `language`, and `type: "code"`. Nontrivial source SHOULD be colocated in `*.example-sources.ts` and MUST derive from the same canonical fixture or layout builder as the story.

## LN-CAT-027 — All Properties component metadata

<a id="ln-cat-027"></a>

**Requirement.** All Properties stories MUST declare the real exported `AllProperties` component as Autodocs authority and expose only `app: App`. Harness-only kind and layout selection MUST remain outside args, Controls, and Properties.

## LN-CAT-030 — App-backed panel Autodocs: use isolated 700px iframes and remove Storybook

<a id="ln-cat-030"></a>

**Requirement.** App-backed panel Autodocs MUST use isolated 700px iframes and remove Storybook story padding so each shell owns its preview and application state.

## LN-CAT-031 — File-scoped panel stories: retain one minimal active Markdown leaf. Document-independent

<a id="ln-cat-031"></a>

**Requirement.** File-scoped panel stories MUST retain one minimal active Markdown leaf. Document-independent Tags stories MUST remain document-free.

## LN-CAT-032 — Specialist-panel play: verify one panel, its placement host

<a id="ln-cat-032"></a>

**Requirement.** Each specialist-panel play MUST verify one panel, its placement host and paint, real grouped chrome where applicable, its documented source boundary, and its defining interaction.

## LN-CAT-037 — Production Markdown panel Autodocs, including Tags: use their public @lapis-notes/markdown app-only components

<a id="ln-cat-037"></a>

**Requirement.** Production Markdown panel Autodocs, including Tags, MUST use their public `@lapis-notes/markdown` app-only components.

## LN-CAT-038 — Search panel catalog: expose consumer-usable source importing @lapis-notes/search, retain independent

<a id="ln-cat-038"></a>

**Requirement.** The Search panel catalog MUST expose consumer-usable source importing `@lapis-notes/search`, retain independent pending visual paths for six placements, and exercise its real indexed App.

## LN-CAT-050 — Plugins/Bases/Shell: boot a real App with File Explorer

<a id="ln-cat-050"></a>

**Requirement.** `Plugins/Bases/Shell` MUST boot a real App with File Explorer, retained collapsed Search, and an opened Bases file over the canonical seed. Bases file-view, Markdown-embed, and disable/restore scenarios MUST live beneath `Plugins/Bases`, verifying associations, source/preview switching, persistence, reopen, invalid YAML, cleanup, managed settings, and missing-view recovery.

## LN-CAT-051 — Bases stories: share one canonical seeded vault fixture, use

<a id="ln-cat-051"></a>

**Requirement.** Bases stories MUST share one canonical seeded vault fixture, use `BasesViewSurface` as focused Autodocs authority, hide harness state from Controls, and provide explicit public-package Show Code. App stories MUST use isolated 700px iframes; every story remains `visual-pending` with an independent nested-import baseline until review.

## LN-CAT-062 — Plugins/AI/Chat: demonstrate a Fake rich turn with visible

<a id="ln-cat-062"></a>

**Requirement.** `Plugins/AI/Chat` MUST demonstrate a Fake rich turn with visible thinking, expandable tool input and output, Markdown assistant text, a date divider, timestamps, a Copy response action, Design Core Composer Drawer attachment chips, a streamed context-usage bar, filtered provider bookkeeping statuses, an active-turn working indicator, and checked Model and Thinking submenus. Deterministic failure scenarios MUST cover both composer top validation and a failed assistant message with Retry. It MUST use public Show Code and retain a `visual-pending` nested-import baseline.

## LN-CAT-063 — Focused Bases Editable Cells and real editor-shell: enter advanced-filter edit mode, open CodeMirror completions

<a id="ln-cat-063"></a>

**Requirement.** The focused Bases Editable Cells and real editor-shell stories MUST enter advanced-filter edit mode, open CodeMirror completions, and assert the inline editor has no default outline while the completion surface has opaque, rounded, shadowed Lapis popover chrome.

## LN-CAT-067 — Fake runtimes in default AI stories

<a id="ln-cat-067"></a>

**Requirement.** Default `Plugins/AI` stories MUST stay Fake. Storybook MUST NOT start an AI controller as a sidecar. Preview MAY publish the web host's thin controller connection bridge using an explicit URL and token. The AI plugin MUST use the installed shared client package, without a controller source alias.

## LN-CAT-093 — App-backed Graph panel placements

<a id="ln-cat-093"></a>

**Requirement.** `Plugins/Graph/Panels/Graph` and `Plugins/Graph/Panels/Local Graph` MUST each render the registered App-backed view in middle-tab, stacked-middle, left, right, bottom-group, and sidebar-group placements. They MUST use public `@lapis-notes/graph` Show Code, isolated 700px Docs, deterministic indexed fixtures, independent visual paths, and `visual-pending`. Plays MUST assert disclosure headers, muted idle paint, explicit active-file focus, immediate labels, delayed emphasis, and scoped hover-label paint.

## LN-CAT-094 — Focused Graph plays: exercise shared filter and Group autocomplete

<a id="ln-cat-094"></a>

**Requirement.** Focused Graph plays MUST exercise shared filter and Group autocomplete through real portals, compact add/reorder/recolour/diagnose/remove behavior within the viewport-clamped 300px panel, including Design Core colour presets and unrestricted native picking plus right-padding remove controls that do not overlap query or colour controls, both hover-delay controls, modifier Markdown preview positioning and pointer handoff, Animate/Stop, governed force and thickness ranges, and all seven semantic colour roles. They MUST assert interaction and hit-testing independently from visual-baseline approval.

## LN-CAT-095 — Focused Graph plays: assert balanced handle spacing, divider- and shadow-free

<a id="ln-cat-095"></a>

**Requirement.** Focused Graph plays MUST assert balanced handle spacing, divider- and shadow-free idle rows, the absence of a handle mouse-hover outline in the active browser stylesheet, rounded whole-row focus paint covering every control while retaining an outer trailing gap, a visible and hit-testable close action with a trailing gutter and token-driven hover paint, and non-overlapping query, colour, and right-padding close geometry. Changed visuals MUST remain `visual-pending`.

## LN-CAT-096 — Workspace/Lapis Editor Demo/Yaml Source: find the seeded YAML file through Go

<a id="ln-cat-096"></a>

**Requirement.** `Workspace/Lapis Editor Demo/Yaml Source` MUST find the seeded YAML file through Go to file, open it through the production Source Editor, and assert the real YAML CodeMirror host. The new visual MUST remain `visual-pending` until human review.

## LN-CAT-097 — Storybook Vite: use one Svelte transform pipeline, inline

<a id="ln-cat-097"></a>

**Requirement.** Storybook Vite MUST use one Svelte transform pipeline, inline its compiled component CSS, and exclude registry-installed Design Core Svelte source from dependency optimization so rune modules and styles remain valid when focused browser stories start from a cold dependency cache.

## LN-CAT-098 — Plugins/AI/Shell/JSONL Preview: boot the real AI plugin, open

<a id="ln-cat-098"></a>

**Requirement.** `Plugins/AI/Shell/JSONL Preview` MUST boot the real AI plugin, open a seeded portable `transcript.jsonl` through its registered default file view, and assert user and Markdown assistant messages, reasoning, tool activity, file-association metadata, and the absence of a composer. Its visual MUST remain `visual-pending` until human review.

## LN-CAT-074 — Plugin catalog hierarchy

<a id="ln-cat-074"></a>

**Requirement.** Story titles and physical catalog paths for bundled plugins MUST use `Plugins/<Plugin>`. Command-access panels MUST use `Plugins/<Plugin>/Panels/<Panel>` and full app examples MUST use `Plugins/<Plugin>/Shell`; `Workspace/Panels` and `Workspace/Plugins` are forbidden. The nested `Specification` group MUST be the first top-level Storybook menu item and preserve SUMMARY order.

## LN-CAT-075 — Explorer, Bookmarks, Search, History, AI Chat, AI: each demonstrate Middle Top Tabs, Stacked Tabs

<a id="ln-cat-075"></a>

**Requirement.** Explorer, Bookmarks, Search, History, AI Chat, AI History, AI Catalog, and the six Markdown command panels MUST each demonstrate Middle Top Tabs, Stacked Tabs, Left Sidebar, Right Sidebar, Bottom Panel, and Sidebar As a Group through real workspace chrome. Standalone previews MUST fill the viewport with no canvas padding or document scrolling; only Docs canvases use the isolated 700px height.

## LN-CAT-076 — Plugin Shell family: provide Desktop and Mobile stories with Explorer

<a id="ln-cat-076"></a>

**Requirement.** Every plugin Shell family MUST provide Desktop and Mobile stories with Explorer visible on the left and Search retained on the collapsed right. Standalone shells MUST fill the viewport without canvas padding or page scrolling while only Docs canvases use the isolated 700px height. Plays MAY reveal Search but MUST collapse it before completion.

## LN-CAT-077 — Workspace Shell PersistedDesktop and Mobile: load Markdown, Markdown Lint, Explorer, Bookmarks, Search

<a id="ln-cat-077"></a>

**Requirement.** Workspace Shell PersistedDesktop and Mobile MUST load Markdown, Markdown Lint, Explorer, Bookmarks, Search, History, Bases, AI, and Word Count as enabled bundled plugins. The AI runtime MUST remain deterministic Fake. Those stories MUST assert F-Mode is present and disabled.

## LN-CAT-080 — SUMMARY chapter: have one exact metadata-only Storybook mirror

<a id="ln-cat-080"></a>

**Requirement.** Every SUMMARY chapter MUST have one exact metadata-only Storybook mirror and Storybook configuration MUST include that mirror path. A post-build check MUST compare `storybook-static/index.json` with SUMMARY and fail when any specification chapter did not render.

## LN-CAT-082 — Storybook Vite: resolve File Explorer, Language Service, and portable

<a id="ln-cat-082"></a>

**Requirement.** Storybook Vite MUST resolve File Explorer, Language Service, and portable API subpaths from framework workspace sources while extracted plugins resolve through installed npm exports. Local development MAY install checksum-verified sibling tarballs through the ignored pnpm hook. Storybook MUST NOT alias extracted plugin source directories.

## LN-CAT-099 — Source-aliased framework packages and packages that own: remain outside Storybook dependency optimization. Linked framework

<a id="ln-cat-099"></a>

**Requirement.** Source-aliased framework packages and packages that own emitted workers MUST remain outside Storybook dependency optimization. Linked framework identities MUST be deduplicated. Deep Mira modules, pure catalog and Nostr leaves, the accessibility runtime, and transitive CommonJS leaves from installed plugins MUST be pre-bundled.

Cold workspace acceptance MUST pre-bundle statically used recovery icons so late
dependency discovery cannot reload an active interaction or its accessibility
runtime.

## LN-CAT-100 — Workspace/Plugin Management/Browse Details And Readme: provide valid structured Overview and Changelog Markdown

<a id="ln-cat-100"></a>

**Requirement.** `Workspace/Plugin Management/Browse Details And Readme` MUST provide valid structured Overview and Changelog Markdown plus signed release-history fixtures from one story-owned fetch boundary. Its play MUST exercise all three populated detail tabs, icon-backed platforms, summary links, and both result and tab Design Core Scroll Areas without relying on network state. It MUST inherit the catalog viewport and fill the available vertical surface instead of forcing Desktop. Changed visuals MUST remain `visual-pending`.

## LN-CAT-101 — Normal Workspace/Plugin Management stories: fill the available viewport without setting

<a id="ln-cat-101"></a>

**Requirement.** Normal `Workspace/Plugin Management` stories MUST fill the available viewport without setting a Desktop global. Their Docs canvases MUST use an isolated fixed 760px height.

## LN-CAT-106 — Populated uninstall-confirmation interaction: assert a compact dialog, resolved plugin summary

<a id="ln-cat-106"></a>

**Requirement.** The populated uninstall-confirmation interaction MUST assert a compact dialog, resolved plugin summary row, styled destructive action, and styled cancel path so the selected target is unambiguous without triggering removal.

## LN-CAT-084 — Workspace/Shell PersistedDesktop: show File Explorer, Search, then Bookmarks on

<a id="ln-cat-084"></a>

**Requirement.** `Workspace/Shell` PersistedDesktop MUST show File Explorer, Search, then Bookmarks on the left and Outline, File Properties, then Tags on the right after bundled plugins load. The Bookmarks left-sidebar play MUST cover toolbar actions, typed rows, filter, add/remove group refresh, row inset, toolbar hover, Explorer tree geometry, leaf indent, drag reparent, search activation, and graph persistence.

## LN-CAT-085 — Inverted tooltips in the persisted shell

<a id="ln-cat-085"></a>

**Requirement.** `Workspace/Shell` PersistedDesktop MUST keep Design Core tooltip paint inverted in light mode after bundled Markdown loads Mira styles. Hovering File Explorer chrome MUST show a dark surface and light text.

## LN-CAT-089 — Plugins/AI/Panels/Catalog: cover the nested owner and kind tree

<a id="ln-cat-089"></a>

**Requirement.** `Plugins/AI/Panels/Catalog` MUST cover the nested owner and kind tree, a row-click tool description expand, expand-all, a filter, a persisted tool checkbox, Open on a vault `SKILL.md`, Open on a vault command Markdown file, public Show Code, and all six governed placements.

## LN-CAT-112 — Plugin Management Sources story: render both a Nostr source

<a id="ln-cat-112"></a>

**Requirement.** The Plugin Management Sources story MUST render both a Nostr source and the legacy HTTPS source through the production settings page. It MUST assert visible Nostr transport, relay count, and install-quorum readiness while remaining `visual-pending` until human review.

## LN-CAT-113 — Useful On this page outline

<a id="ln-cat-113"></a>

**Requirement.** Specification Docs MUST provide a populated On this page outline containing topic and requirement headings. Repeated acceptance-detail headings MUST NOT clutter the outline.

## LN-CAT-114 — Canonical chapter routes and stable anchors

<a id="ln-cat-114"></a>

**Requirement.** Canonical Markdown chapter links MUST navigate to the matching Storybook Docs route while preserving fragments, browser history, external links, and static deployment subpaths. Requirement permalinks MUST use stable ID-based anchors.

## LN-CAT-115 — SUMMARY-derived navigation and unique mirrors

<a id="ln-cat-115"></a>

**Requirement.** Specification Docs MUST derive chapter hierarchy, breadcrumbs, and previous/next navigation from SUMMARY. Every indexed canonical page MUST have exactly one metadata-only mirror and one unique built Docs route.

The host compatibility story retains signed snapshot discovery and real PluginBrowser
installation state under LN-PLUG-113. Its independent visual path is
`workspace/plugins/desktop-only-ai`; review and capture remain
pending without baseline changes.

## Shared R3 source navigation

The native daily Task lifecycle chapter is a canonical topic alongside indexing
and History. SUMMARY, specification MDX mirrors and preview navigation retain
the same chapter order when the qualified source lanes are integrated. This
source intake adds documentation navigation; it does not add application
screens, approve visual baselines or close the separate host-adoption gates.

## Admitted Tasks specification navigation

The [native Task port chapter](../architecture/rust-task-host-port.md) is indexed inside Architecture. Its metadata-only mirror and specification-first sidebar order are generated from SUMMARY alongside the existing service-lifetime chapters. Source service, API and owning-plugin evidence remain distinct from actual host catalog acceptance.
