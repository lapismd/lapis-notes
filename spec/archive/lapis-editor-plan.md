# Lapis Source Editor Storybook Demo

Historical, non-normative plan. Canonical requirements live in
[`spec/src/editor-demo.md`](../src/editor-demo.md). This file is not part of
the mdBook or QMD collection.

## Goal

Create an additive `Workspace/Lapis Editor Demo` that boots a real
`@lapis-notes/api` `App` over a public in-memory vault, loads required core
plugins, restores the design-core shell with Explorer, and supports source
editing for Markdown, text, and JSON files.

The demo is an intake proving ground, not a production host. Reusable storage,
view, configuration, and workspace bridges belong in `@lapis-notes/api`;
generic startup presentation belongs in `@lapismd/design-core`; Lapis policy
and seed data remain Storybook-local until a production plugin or host package
is specified.

## Public contracts

### API

- Export `MemoryVaultAdapter` implementing `VaultAdapter` and
  `VaultIdentityAdapter`. It accepts string/binary seed data and optional
  deterministic name, vault id, and clock values. It implements the complete
  adapter contract while reporting non-persistent capabilities.
- Export `SourceTextFileView`, a concrete `TextFileView` which mounts the
  existing `NoteEditor`, exposes search, and accepts an application-supplied
  view type and extension list.
- Add atomic `Configuration.updateConfigurationOptions(changes)`. Validate the
  whole batch before one write, preserve unrelated values and plugin data,
  emit per-key updates after success, and no-op unchanged batches.
- Persist the API-owned design-core settings controller through API
  configuration and reconcile external configuration changes without a save
  feedback loop.
- Mirror API editor-view contributions into the API-owned design-core registry
  so Editor Associations uses the live API registrations.

### Design-core

- Export `WorkspaceStartup` and its task/failure types from the workspace
  surface.
- A task has `pending`, `active`, `complete`, or `failed` status. The component
  derives progress and `Step N of M`, and accepts generic failure actions.
- The component owns presentation only and has no Lapis, vault, or plugin
  imports.

## Implementation slices

1. Establish this plan, [`lapis-editor-tasks.md`](lapis-editor-tasks.md),
   canonical `LN-ED-*` requirements, verification mappings, and the
   Storybook-only intake boundary in [`MIGRATION.md`](../../MIGRATION.md).
2. Add `WorkspaceStartup` to design-core using native CSS, public
   `--ui-workspace-startup-*` tokens, semantic `data-ui-*` hosts, existing
   design-core primitives, focused tests, docs, and `visual-pending` stories.
3. Implement `MemoryVaultAdapter`, `SourceTextFileView`, configuration batching,
   settings persistence, and editor-registry mirroring in the API. Remove
   Tailwind-like utility strings encountered in the touched editor surface.
4. Add a Storybook-local required source-editor plugin which registers
   Markdown (`md`, `markdown`), text (`txt`, `text`), and JSON (`json`, `data`)
   views with source-only CodeMirror extensions.
5. Add Editor settings for line numbers, fold indent, wrapping, indentation
   guides, spellcheck, tabs/spaces, and indent width (2-8, default 4).
6. Add a Storybook-local Explorer view/plugin which lists the API vault, hides
   `.obsidian` and `.trash`, handles open/create/rename/move/delete, follows the
   active file, and persists auto-reveal through API configuration.
7. Seed a canonical in-memory vault and workspace. Provide functional Create
   note and Go to file landing actions; Close remains the built-in design-core
   action. Boot through real vault, configuration, required-plugin, and layout
   tasks, with deterministic failure/retry teardown.
8. Add Ready, Same-file split sync, Explorer mutations, Editor settings,
   Loading plugins, Startup failure, and Explorer opening-vault stories. Keep
   existing shell stories unchanged and mark new visual stories
   `visual-pending`.
9. Consume sibling `@lapismd/mira` for the default source-editor CodeMirror
   shell and Obsidian theme. This originally landed through `file:`; the current
   dependency policy supersedes that transport with a `link:` package reference
   and public exports. Keep Lapis
   vault/view/sync ownership; Markdown stays source-only language highlighting
   without Mira live-preview, toolbars, or rich Markdown surfaces.
10. Restore product-like inline filename title paint and contribute file-path
    breadcrumbs plus leaf history through API `getChrome` into the design-core
    tab title bar; enable both appearance flags in the editor demo seed.

## Acceptance

- Supported extensions resolve to their registered source views and syntax
  extensions.
- Editing writes through the existing 500 ms debounce. Two panes for the same
  file mirror immediately and result in one target-file write; a pane switched
  to another file remains independent.
- Explorer operations immediately update the tree and vault, and auto-reveal
  follows the active file.
- Editor settings update mounted CodeMirror instances and survive a controller
  restart against the same in-memory adapter.
- Startup exposes real progress, required-plugin failure, and retry. Landing
  actions are functional.
- New component paint uses native CSS/public tokens/data hosts with no Tailwind
  utility strings. New visual baselines stay pending human review.

## Validation

In `lapis-notes`, run `pnpm spec:check`, `pnpm check`, focused API/workspace
tests, `pnpm test`, `pnpm test:storybook`, `pnpm build-storybook`, and visual
update/compare restricted to the new pending stories. In design-core, run
focused unit/Storybook checks followed by `pnpm checks`. Record exact evidence
and Jujutsu changes in [`lapis-editor-tasks.md`](lapis-editor-tasks.md) after
each verified slice.

## Boundaries and risks

- Story state resets per mount; cross-browser-tab synchronization and durable
  browser storage are excluded.
- Markdown reading/live-preview/parity, recent files, vault selection/recovery,
  external OS import, and production plugin packaging are excluded.
- Equality guards and atomic writes must prevent API/controller configuration
  loops. Demo teardown must unload plugins/editors/controller and restore the
  previous global API app binding.
- The sibling design-core change is committed and verified independently before
  the Lapis Storybook integration consumes it.
