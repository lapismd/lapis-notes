# Plugin file icons in File Explorer

Status: **Planned; implementation has not started.**
Source audit: **2026-10-26**, Notes parent `f705ff72`.

Plugins should be able to declare an icon for the file extensions or filename
patterns served by their editor views. File Explorer should display that icon
without opening the file, constructing a view or activating a plugin merely
to paint a row. Existing plugins retain today's filename-based icons.

This is a saved implementation plan, not evidence of a shipped API. The
[plugin model](spec/src/plugin-model/editor-contributions.md),
[Workspace API](spec/src/packages/workspace-apis.md) and
[Explorer contract](spec/src/plugins/explorer/index.md) remain authoritative.
Add their atomic requirements and Planned verification rows before runtime work.
This feature is separate from the R3–R7 Rust migration and adds no migration gate.

## Existing boundaries

| Owner                          | Current behavior                                                                                                                                         | Planned change                                                                               |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `@lapis-notes/api`             | `EditorViewContribution`, `Plugin.registerEditorView` and `Workspace.editorViews` describe editor choices without a file icon.                           | Add optional metadata and an App-owned path resolver.                                        |
| API compatibility registration | `registerExtensions` normalizes suffixes and adds patterns to the editor registry.                                                                       | Add optional icon metadata while preserving existing calls.                                  |
| API manifest/distribution      | `LapisEditorViewContribution` and `installManifestEditorView` install declarative editor metadata; distribution/catalog summaries have separate schemas. | Carry and validate the same field through each boundary that preserves editor contributions. |
| `@lapis-notes/file-explorer`   | Its controller receives vault entries and listens for load/create/delete/rename. It supplies no `getIcon` callback.                                      | Bind the public icon resolver and subscribe to presentation changes.                         |
| `@lapismd/design-core`         | `ExplorerController.getIcon` already overrides file icons; an absent override uses `FileTypeIcon`.                                                       | Reuse the existing contract. No shared UI change is currently required.                      |

Source touchpoints are `packages/api/src/lib/editor-view-registry.ts`,
`plugin.ts`, `workspace.svelte.ts`, `lapis-extension.ts`,
`plugin-distribution/{types,schemas}.ts`, `registry-schema/catalog-v1.ts`, and
`packages/file-explorer/src/lib/{index,explorer-tree-subscription}.ts`.
Public exports and generated package declarations need the corresponding checks.

## Proposed public API

Add `fileIcon?: string` to both runtime and manifest editor-view contributions.
The name distinguishes Explorer presentation from an instantiated view's tab
icon. The value applies to that contribution's `filenamePatterns`.

Illustrative plugin usage after implementation:

```ts
this.registerView("diagram", (leaf) => new DiagramView(leaf), {
  kind: "file",
});
this.registerEditorView({
  id: "example.diagram",
  viewType: "diagram",
  label: "Diagram",
  filenamePatterns: ["*.diagram", "*.diagram.json"],
  priority: "default",
  fileIcon: "workflow",
});
```

Manifest `contributes.editorViews` accepts the same optional `fileIcon` field.
Plugins wanting different icons for different suffixes declare separate
contribution IDs/patterns; those contributions may share a `viewType`.

Keep the existing two-argument extension API and add a third options argument:
`registerExtensions(extensions, viewType?, { fileIcon }?)`. Export a named
`ExtensionRegistrationOptions` type. For example,
`this.registerExtensions(["diagram"], "diagram", { fileIcon: "workflow" })`.
Implement its metadata through the same registry, with ownership per
registration; do not let one suffix's icon overwrite another suffix's icon just
because both use the same view type. Existing calls without options retain
their routing behavior and acquire no implicit icon.

Expose `Workspace.getFileIconForPath(path): string | undefined` plus a disposable
subscription such as `Workspace.onFileIconsChanged(listener): () => void`.
Keep these contracts in the API; plugins need no Design Core import and Explorer
needs no access to registry implementation details. Lookup is synchronous and
side-effect-free. A change notification may be coalesced per lifecycle turn.

## Icon vocabulary and fallback

The first version accepts locally available Lucide names, including the
existing `lucide-` and `lucide:` spelling conventions. Omitted or blank metadata
means no override. Non-string manifest values are invalid; an unknown name
produces no override and a bounded diagnostic, preserving `FileTypeIcon` rather
than accidentally forcing the generic `file` glyph. Validate availability using
a public icon boundary, without depending on Design Core internals.

API `addIcon` and Design Core `registerWorkspaceIcon` currently use different
registries. This first version does **not** claim that arbitrary API custom SVG
IDs work in Explorer. Custom SVG/image assets, remote URLs, icon packs, per-file
content-based rules and folder icons are deferred. Supporting custom artwork
later requires a generic upstream rendering contract and explicit ownership;
it must not be hidden in a consumer wrapper or global registration bridge.

## Matching and lifecycle decisions

1. Resolve the editor contribution using the existing user association,
   contribution priority and pattern-specificity rules. Reuse the existing
   matching helpers and stable tie behavior; do not create an independent
   extension-priority table. Compound suffixes such as `.diagram.json` must
   retain their specificity against broader patterns at equal priority.
2. Return only the chosen contribution's icon. If that contribution has no
   usable icon, retain the built-in filename icon; do not borrow an icon from a
   competing, lower-priority editor. A one-off Open With choice in a leaf does
   not change every Explorer row; a saved editor association does.
3. Normalize legacy extension input exactly as `registerExtensions` does today,
   including leading dots and case. Preserve existing glob/path case semantics.
   Do not match only `TFile.extension`, which loses compound suffixes.
4. Enabled, admitted lazy manifest metadata may provide an icon before its view
   factory loads. An installed-but-disabled, removed, rejected or merely
   catalog-discovered plugin cannot supply an override. Inspect the current
   manifest activation/install lifecycle and factor metadata selection from
   activation without changing file-open admission or activation behavior.
5. Registration, replacement, disposal, enable/disable and saved association
   changes notify every Explorer owned by the same App. Rename/move re-resolves
   the path through existing vault notifications. Do not persist resolved icons
   into vault files, metadata or workspace layouts.
6. Disposers are idempotent and remove only their own contribution. Explicitly
   cover runtime/manifest overlap, duplicate IDs and stale cleanup after
   replacement. Compatibility registrations sharing a view type must keep
   independent pattern/icon ownership; unloading one cannot erase the other.
7. Separate Apps must never share file-icon contributions or subscriptions.
   Explorer teardown removes all listeners. Repainting icons preserves row
   selection, expanded folders, scrolling, focus and an in-progress rename.

The implementation should factor selection where needed rather than making
`getFileIconForPath` instantiate `View` or call plugin activation. Preserve
current behavior for unavailable saved editor associations and prove it against
the existing routing tests before adding lazy-metadata eligibility.

## Delivery slices

| Slice                       | Work                                                                                                                                                                                  | Completion evidence                                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Specify and reproduce    | Add atomic API/plugin/Explorer requirements and Planned verification rows. Add exact tests for metadata, precedence, compatibility ownership and fallback.                            | Record test commands, names and failing counts before implementation.                                                                   |
| 2. API and manifest support | Add types, validation, registry ownership, resolver, notifications and lifecycle cleanup. Update public examples and declaration output.                                              | Exact regressions pass; all affected API and distribution suites pass; no file-open or App-isolation regression.                        |
| 3. Explorer integration     | Supply `getIcon` for file nodes, return no override for folders, and bind the disposable presentation subscription. Keep Design Core's native rendering and fallback.                 | Real registered-plugin stories prove icons, fallback and live transitions in the existing Explorer.                                     |
| 4. First-party adoption     | Select a real file-view plugin after inspecting its owning repository, then add its metadata there. Prefer a plugin with a distinct custom suffix for an unambiguous acceptance case. | Its source suites/build/catalog and public archive pass; an installed-plugin example exercises the metadata without host-specific maps. |
| 5. Consumer qualification   | Build/pack API and Explorer, then refresh the current Web/hosted and Tauri Desktop consumers through public exports.                                                                  | Cold real-shell acceptance and complete affected interaction/accessibility lanes; separate source and consumer evidence.                |

No production implementation, dependency refresh, package publication or first-party
plugin changes belong to this planning slice. Do not retrofit the frozen Deno
host. Discovery of a missing generic Design Core capability requires an upstream
source fix before the smallest Explorer adaptation.

## Acceptance and validation

Start with focused API tests in `editor-view-registry.test.ts`, `plugin.test.ts`,
`workspace.test.ts`, manifest/distribution tests and a focused path-resolver file
if the implementation is extracted. Cover:

- ordinary and compound suffixes, legacy normalization, unmatched paths,
  explicit associations, all priorities and equal-priority ties;
- absent/blank/unknown icons, malformed manifest fields and old plugins;
- different icons sharing one view type, duplicate owners, stale disposers,
  enable/disable/re-enable, manifest/runtime overlap and lazy metadata without
  activation, file reads or view construction;
- two independent Apps, association-change notifications and full teardown.

Extend the Explorer subscription tests and real
`stories/plugins/explorer/panels/Explorer.stories.ts` family. Include a mounted
row whose icon changes on enable/disable and rename, a sibling App that stays
unchanged, normal file activation, built-in fallback, keyboard navigation,
rename focus, folder expansion and accessible file labels. Decorative icons
must remain excluded from accessible names. Run all six existing placements
and any affected editor-association/plugin-management families.

After the exact regressions, run all directly affected package suites and root
`pnpm check`, `pnpm test`, `pnpm build`, `pnpm test:storybook`,
`pnpm build-storybook` and `pnpm spec:check`. Registration/lifecycle work requires
a cold Storybook process. Record exact before/after functional, interaction and
accessibility failure counts; explain unrelated failures separately. Retain
`visual-pending`; no screenshot comparison or baseline update is part of this
plan's Design Core scope.

Verify public packed exports, declaration compatibility and actual Web/hosted
and Desktop runtime intake, including an admitted installed-plugin manifest.
API/Explorer changes require each consumer's complete relevant interaction lane.
Source-aliased catalog success alone does not qualify built-package consumers.
Keep host selection, file persistence and plugin admission host-owned.

Prepare additive API and Explorer release notes/Changesets during implementation.
Publish API before dependent Explorer/plugins and raise consumer minimum ranges
to the first release containing the contract. During the current migration, use
documented, checksummed local archives through ignored validation overlays and
defer publication to its separate authorized gate. Publishable manifests and
lockfiles stay portable registry ranges. Commit each verified owning-repository
slice with Jujutsu.

## Planning verification

Before editing, the Notes working copy was clean and Prettier passed for
`MIGRATION.md` and `spec/migration-progress.json` with zero formatting failures.
No product regression test was run or claimed: this slice adds a plan only.

Planning checks passed:

- Prettier for all three changed documents; three local plan links resolve and
  the plan remains within 400 lines/32,768 bytes.
- `pnpm progress:generate` and `pnpm check:progress`: all 101 existing Rust task
  rows remain unchanged and the tracker projection is current.
- `pnpm spec:check`: all ten specification lanes, App ownership and metadata
  audits pass; 78 governance tests and six Rust-boundary tests pass with zero
  failures. Product, browser and accessibility suites were not run for this
  documentation-only slice.

The initial concurrent `pnpm check:progress` launch failed before its checker
ran because `pnpm spec:check` acquired the same Docker workspace lease. After
that command completed, the exact progress command passed on a sequential
rerun. No validation infrastructure or application source was changed.
