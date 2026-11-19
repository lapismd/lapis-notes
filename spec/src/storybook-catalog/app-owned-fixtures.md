# Storybook Catalog / App-owned fixtures

The Notes Session integration family mounts the production App Profile session
under LN-PKG-132, covering ready document opening, optional native Repository
registration and explicit startup Retry. Its fixture owns admitted memory
storage and awaits session cleanup; all variants remain visual-pending.
The catalog pre-optimizes the profile's public Repository and Agent UI entries
before a cold test starts, preventing dependency discovery from reloading it.

The Editor Demo's Inline Source Editor Spacing story mounts an API-owned inline
CodeMirror editor inside a full document. Its `visual-pending` acceptance proves
that document trailing space remains on the outer editor only.

## LN-CAT-118 — Declared story composition parity

<a id="ln-cat-118"></a>

**Requirement.** Every executable story family MUST declare application, component, integration or prototype coverage. Application stories MUST render the public production WorkspaceShell through their actual render path, without replacement chrome, production-style overrides or unresolved alternate composition. Components MUST identify their production subject; integration fixtures and prototypes MUST record a governing requirement and purpose. Normal and specification checks MUST reject missing declarations, stale inventories or overrides and unresolved composition; imports alone MUST NOT prove parity.

The shared App Profile session is traced through its public export, owned barrel
and Svelte source to the production shell. A public session import alone cannot
qualify a replacement body. Ready, native Repository registration and startup
retry use the same full-shell session with no presentation overrides.
Ready acceptance also verifies the seeded document's rendered heading and body;
an empty editor inside otherwise populated shell chrome cannot qualify.
The held-host-readiness scenario also proves that a mounted shell remains inert
and unready until the actual host callback settles, then opens its real document.

The CLI registration family declares the actual public AppSettingsRoot subject.
Its real declarative fields exercise UI-owned registration bindings under
LN-WS-107; fixture controls switch independent owners without replacing settings
presentation. Copied descriptor, replacement and disposal evidence remains
separate from the original Desktop public-archive acceptance.

## LN-CAT-119 — Distinct fixture controls

<a id="ln-cat-119"></a>

**Requirement.** Synthetic story controls MUST use a reusable padded, dotted-border FixtureControls surface. Application fixture controls MUST stay outside production layout. Component fixtures MAY keep controls inline. The composition audit MUST distinguish fixture setup from production presentation; visual approval, interaction and accessibility gates remain independent.

## LN-CAT-012 — Workspace shell plays: boot a real api App, exercise meaningful

<a id="ln-cat-012"></a>

**Requirement.** Workspace shell plays MUST boot a real api `App`, exercise meaningful controller-backed shell behavior, and verify the story adapter receives the expected workspace persistence update.

## LN-CAT-015 — Workspace/Shell: include a focused bottom-panel/settings story that boots

<a id="ln-cat-015"></a>

**Requirement.** `Workspace/Shell` MUST include a focused bottom-panel/settings story that boots a real api `App`, persists panel geometry through the api writer, and proves design-core's built-in settings update shell alignment and ribbon presentation without loading plugins or adding settings persistence. The play MUST open Settings from the left-ribbon bottom control.

## LN-CAT-026 — Honest imports for local fixtures

<a id="ln-cat-026"></a>

**Requirement.** An intentionally Storybook-local component MUST use its honest co-located fixture import in Show Code and identify that package-boundary exception. Documentation MUST NOT invent a public package export for a story-only component.

## LN-CAT-072 — Live Host missing-attach state: point to a seeded supervisor that starts

<a id="ln-cat-072"></a>

**Requirement.** The Live Host missing-attach state MUST point to a seeded supervisor that starts an isolated loopback host and injects an ephemeral token into Storybook without writing or logging it. Storybook itself MUST NOT start the host, and lower-level manual attachment MUST remain available.

## LN-CAT-078 — Roles and CV catalog ownership

<a id="ln-cat-078"></a>

**Requirement.** Lapis Storybook MUST NOT contain Roles or CV stories, titles, fixtures, aliases, or Storybook-only imports. Roles/CV catalog acceptance belongs to `lapis-plugin-cv-roles`; production host registration remains unchanged.

## LN-CAT-086 — Terminal catalog ownership

<a id="ln-cat-086"></a>

**Requirement.** Lapis Storybook MUST NOT contain Terminal stories, titles, fixtures, aliases, or Storybook-only imports. Terminal catalog acceptance belongs to `lapis-plugin-terminal`; production host registration remains unchanged.

## LN-CAT-102 — Workspace/Plugin Management: provide one populated fixture story with rendered

<a id="ln-cat-102"></a>

**Requirement.** `Workspace/Plugin Management` MUST provide one populated fixture story with rendered rows in Installed, Browse, and Updates. Its play MUST visit all three tabs and return to Installed without mutating the fixture.

## LN-CAT-103 — Workspace/Plugin Management: provide dedicated populated Installed, Browse, and Updates

<a id="ln-cat-103"></a>

**Requirement.** `Workspace/Plugin Management` MUST provide dedicated populated Installed, Browse, and Updates row stories so each tab can be inspected directly without waiting for a multi-tab play to settle. The Browse detail fixture MUST include a realistic multi-release Changelog whose compact and expanded states are interaction-tested.

## LN-CAT-105 — Populated Installed and Updates stories: expose icon-only Update actions with accessible tooltip

<a id="ln-cat-105"></a>

**Requirement.** Populated Installed and Updates stories MUST expose icon-only Update actions with accessible tooltip copy. Installed rows MUST expose their enabled state through accessible switches and matching tooltip copy, without duplicating that state as a chip or changing the fixture during passive inspection.

## LN-CAT-069 — App-backed stories: install disposable compatibility leases while their canvases

<a id="ln-cat-069"></a>

**Requirement.** App-backed stories MUST install disposable compatibility leases while their canvases use the App they own. Multi-App acceptance MUST prove Workspace and Bases do not follow another story's compatibility alias.

## LN-CAT-070 — Storybook browser project: retain a bounded 120-second per-story ceiling

<a id="ln-cat-070"></a>

**Requirement.** The Storybook browser project MUST retain a bounded 120-second per-story ceiling and run four deterministic Chromium shards sequentially, with files serialized inside each shard, so real-App database and linked-plugin scenarios remain reliable without retaining one browser across the entire catalog. Scenario-local waits MUST remain narrower and focused runs MUST still diagnose functional failures independently.

Browser file serialization MUST be configured on the browser pool itself.

## LN-CAT-121 — Explicit Storybook browser quarantine

<a id="ln-cat-121"></a>

**Requirement.** Pull-request, reusable and local release CI MUST disable the documented Storybook Vitest quarantine and report omitted coverage; the explicitly accepted Docs history case MAY be quarantined separately. Explicit diagnostics MUST keep errors fatal. Notes validation tooling owns restoration after the documented cause is fixed and three consecutive complete cold Linux runs pass without retries. All other specification browser acceptance and enabled gates MUST remain blocking.

The [quarantine record](../../records/2026-11-01-storybook-browser-quarantine.md)
owns evidence, disabled coverage, diagnostic commands and restoration steps.
LN-CAT-070 continues to govern explicit full-catalog runs; local passes do not
replace the temporarily disabled CI coverage.

## LN-CAT-109 — Standalone first-party plugin Storybook: render Plugins/&lt;Plugin&gt;/Shell through a static @lapis-notes/workspace WorkspaceShell

<a id="ln-cat-109"></a>

**Requirement.** A standalone first-party plugin Storybook MUST render `Plugins/<Plugin>/Shell` through a static `@lapis-notes/workspace` `WorkspaceShell` import. Plays MUST require a ready app-shell host. A text fallback or App-only assertion MUST NOT pass. Lapis Storybook MUST NOT duplicate those stories.

## LN-CAT-110 — ViewAccess.command view in a standalone first-party plugin: appear under Plugins/&lt;Plugin&gt;/Panels/&lt;Panel&gt; in all six governed

<a id="ln-cat-110"></a>

**Requirement.** Each `ViewAccess.command` view in a standalone first-party plugin MUST appear under `Plugins/<Plugin>/Panels/<Panel>` in all six governed placements through real workspace chrome. Isolated pane-component stories MUST NOT replace that family. Internal views MAY use App-backed shell stories without six placements.

## LN-CAT-111 — Shared Storybook interaction setup: treat Svelte runtime diagnostics from console.warn

<a id="ln-cat-111"></a>

**Requirement.** Shared Storybook interaction setup MUST treat Svelte runtime diagnostics from `console.warn` or `console.error` as fatal, including `derived_inert`, formatted messages, diagnostic URLs and Error objects. Diagnostics caught during teardown MUST remain recorded and fail the after-story or final-cleanup check. Unrelated logging MUST remain unchanged, and focused regressions MUST prove this contract.

Application panel fixtures own a full viewport even when the browser test host
omits Storybook body classes. Plays verify the actual viewport height before
checking placement; isolated Docs canvases retain their explicit 700px height.

LN-CORE-027 adds three real WorkspaceShell Problems scenarios: detached native
claim recovery/discard with saved-file Reading review, failed local admission,
and failed protected handoff with explicit retry. The catalog binds the production App, registry,
collection and menu, using only disposable transport/storage fixtures. No JSON
observer output or alternate recovery screen is visible. All stories stay
`visual-pending`; independent nested paths under
`stories/workspace/editing-recovery/` are declared without PNG capture.

Local Vitest runs also exclude only the two LinkPreviewAcceptance cases after
explicit user acceptance on 2026-11-15. Their catalog routes and other panel
coverage remain enabled. [Targeted quarantine](../../records/2026-11-15-link-preview-browser-quarantine.md)
records failed aggregates, unchanged diagnostic passes, the omitted count and
the explicit opt-in diagnostic command. The transport failure is not repaired.

The [Docs history quarantine](../../records/2026-11-15-docs-history-quarantine.md)
omits only the named history case from development and static runs, with an
explicit fatal opt-in diagnostic. Acceptance is documented quarantine, not
authorization to merge red required checks. Remaining cases stay enabled.

## LN-CAT-122 — Retired shared-AI launchers

<a id="ln-cat-122"></a>

**Requirement.** Notes tooling MUST NOT seed, start or probe the retired shared-AI controller integration. Normal checks, canonical specification checks and CI MUST reject reintroduced launcher files or root commands. The preserved standalone controller remains separately owned for its surviving consumers; the frozen Notes desktop host is retired.

## LN-CAT-123 — Retired shared-AI catalog and dependencies

<a id="ln-cat-123"></a>

**Requirement.** Notes MUST NOT import, register or require the retired shared-AI catalog, controller bridge or root package dependencies. Normal and canonical checks MUST reject reintroduction. Native Chat, API file-tools and independent Mira AI MUST remain available through their owning public boundaries.

## LN-CAT-124 — Retired-AI-free registry fixture source

<a id="ln-cat-124"></a>

**Requirement.** CI registry fixtures MUST use a pinned Plugins revision without retired shared AI. The checked-out source's retirement audit MUST pass before dependency installation, compilation or packing. An absent or rejecting audit MUST stop the fixture build before those operations.

## LN-CAT-125 — Registry acceptance without retired AI

<a id="ln-cat-125"></a>

**Requirement.** Web registry acceptance MUST exercise category, filter and detail navigation with an active fixture plugin and assert that the retired shared-AI category is absent. It MUST retain verified installation, Settings state, single-view ownership, saved navigation and cold-reload persistence assertions without requiring the retired plugin.
