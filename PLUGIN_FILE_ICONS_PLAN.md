# Plugin file icons in File Explorer

Status: **Planned; implementation has not started.**
Source audit: **2026-10-26**, Notes parent `f705ff72`.
Custom-icon scope added on **2026-10-26**, extending plan `feee7333`.

Plugins should be able to declare an icon for the file extensions or filename
patterns served by their editor views. File Explorer should display that icon
without opening the file, constructing a view or activating a plugin merely
to paint a row. This includes any custom SVG or icon-pack entry registered
through the Lapis icon API. Files without a contribution retain today's
filename-based icons.

This is a saved implementation plan, not evidence of a shipped API. The
[plugin model](spec/src/plugin-model/editor-contributions.md),
[Workspace API](spec/src/packages/workspace-apis.md) and
[Explorer contract](spec/src/plugins/explorer/index.md) remain authoritative.
Add their atomic requirements and Planned verification rows before runtime work.
This feature is separate from the R3–R7 Rust migration and adds no migration gate.

## Existing boundaries

| Owner                          | Current behavior                                                                                                                                         | Planned change                                                                                        |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `@lapis-notes/api`             | `EditorViewContribution`, `Plugin.registerEditorView` and `Workspace.editorViews` describe editor choices without a file icon.                           | Add optional metadata and an App-owned path resolver.                                                 |
| API compatibility registration | `registerExtensions` normalizes suffixes and adds patterns to the editor registry.                                                                       | Add optional icon metadata while preserving existing calls.                                           |
| API manifest/distribution      | `LapisEditorViewContribution` and `installManifestEditorView` install declarative editor metadata; distribution/catalog summaries have separate schemas. | Carry and validate the same field through each boundary that preserves editor contributions.          |
| `@lapis-notes/file-explorer`   | Its controller receives vault entries and listens for load/create/delete/rename. It supplies no `getIcon` callback.                                      | Bind the public icon resolver and subscribe to presentation changes.                                  |
| `@lapismd/design-core`         | `ExplorerController.getIcon` already overrides file icons; an absent override uses `FileTypeIcon`.                                                       | Retain icon selection and add a generic, instance-scoped resolver for host-provided artwork upstream. |

Source touchpoints are `packages/api/src/lib/editor-view-registry.ts`,
`plugin.ts`, `workspace.svelte.ts`, `lapis-extension.ts`,
`plugin-distribution/{types,schemas}.ts`, `registry-schema/catalog-v1.ts`, and
`packages/file-explorer/src/lib/{index,explorer-tree-subscription}.ts`.
Also cover API `icons/index.ts` and its tests, plus Design Core
`src/shared/workspace/icon` and `src/shared/workspace/explorer`. Public exports
and generated package declarations need the corresponding checks.

## Proposed public API

Add `fileIcon?: string` to both runtime and manifest editor-view contributions.
The name distinguishes Explorer presentation from an instantiated view's tab
icon. The value applies to that contribution's `filenamePatterns`.

Illustrative plugin usage after implementation:

```ts
// Proposed lifecycle-owned helper; diagramSvg is plugin-provided SVG content.
const diagramIcon = this.registerIcon("diagram", diagramSvg);
this.registerView("diagram", (leaf) => new DiagramView(leaf), {
  kind: "file",
});
this.registerEditorView({
  id: "example.diagram",
  viewType: "diagram",
  label: "Diagram",
  filenamePatterns: ["*.diagram", "*.diagram.json"],
  priority: "default",
  fileIcon: diagramIcon,
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
needs no access to registry implementation details. Path-to-icon-ID lookup is
synchronous and side-effect-free; artwork resolution can await an already
registered icon-pack loader. A change notification may be coalesced per
lifecycle turn.

## Custom icon registration and rendering

The first version supports built-in Lucide names and **all custom artwork the
Lapis icon API can register**: `addIcon(id, svg)`, its `custom:id` spelling,
qualified `pack:icon` names, aliases, and synchronous or asynchronous
`registerIconPacks` entries. No Lucide-only allowlist is introduced. `fileIcon`
remains a serializable ID, never inline markup or a component in the manifest.
Preserve existing name precedence and Lucide compatibility spellings.

Existing plugin code can keep `addIcon("example-diagram", diagramSvg)` and use
`fileIcon: "example-diagram"`. Its existing `removeIcon` cleanup remains valid.
Introduce `Plugin.registerIcon(localId, svg): IconName` as the recommended
lifecycle-owned API: it returns a namespaced ID, registers with the explicit
App's icon resolver and automatically disposes on unload. Provide the equivalent
owned icon-pack registration using the existing `IconLoader` input model.
These helpers extend the API's existing resolver, rather than creating an
Explorer-only registry. Namespaced IDs cannot overwrite built-in packs or
another plugin's registrations; stale disposers cannot remove a replacement.

Today `addIcon`/`registerIconPacks` mutate a module-global registry, while
Design Core's separate `registerWorkspaceIcon` registry expects Svelte
components. Preserve the legacy global icon API as an explicit compatibility
fallback beneath the owned App registry; do not pretend it provides App
isolation or infer an owner from ambient state. Owned registrations are isolated;
legacy shared artwork retains its existing shared-name behavior. A global icon
registration alone never gives another App an editor/file-icon contribution.
New first-party adoption uses the owned helper. Legacy cleanup remains the
caller's responsibility; automatic owner-safe disposal applies to owned helpers.

Add a public, instance-scoped icon-resolution service in Design Core and thread
it through Explorer's existing file-icon rendering, including rename rows.
The service accepts an icon ID, resolves normalized SVG/icon data synchronously
or asynchronously, and reports invalidation. It contains no Lapis App, plugin
or vault types. The API adapter resolves through its public icon boundary;
plugins never import Design Core or register their artwork a second time.
Do not mutate Design Core's global registry or replace its Explorer component.

Design Core owns the row markup, dimensions, decorative accessibility and
fallback presentation. The API owns icon lookup, registration lifetime,
normalization and validation of plugin SVG input. Parsing SVG alone is not a
sanitizer: define a safe normalized rendering payload at that boundary and test
that executable attributes or external references cannot enter the new SVG
rendering path. Preserve valid paths, viewBox, aliases, transforms, colours and
local definitions, including unique SVG IDs across repeated rows.

Add a public resolution result that distinguishes found, missing and failed
artwork. The current `getSvg` silently returns an unknown-icon SVG, so its raw
result cannot decide whether to retain Explorer's filename fallback. Reuse the
owning icon lookup internals behind that result rather than probing rendered
markup or duplicating candidate-name rules in Explorer. Existing `getSvg`
callers retain their fallback behavior.

Omitted or blank metadata means no override; non-string manifest metadata is
invalid. Missing, pending or failed artwork shows `FileTypeIcon`. Late icon
registration or successful pack loading replaces that fallback; removal returns
to it. Cache/deduplicate loads per registry and revision, invalidate both positive
and negative results on changes, and fence late results after replacement,
rename, plugin disable or disposal. A rejected loader must not create a retry
loop or one request per file row. Permit recovery on an explicit registry
revision/re-registration; no row paint triggers plugin activation.

A lazy plugin's manifest can refer to its custom icon before its code registers
it: retain the filename fallback until normal activation supplies the artwork.
Built-in or already registered artwork can display immediately. This plan does
not add a new manifest asset-delivery system or automatic fetching of arbitrary
icon URLs. Existing registered loaders keep their admitted plugin behavior.
Direct raster/URL contributions, content-based rules and folder icons remain
outside the file-extension contribution scope.

## Matching and lifecycle decisions

1. Resolve the editor contribution using the existing user association,
   contribution priority and pattern-specificity rules. Reuse the existing
   matching helpers and stable tie behavior; do not create an independent
   extension-priority table. Compound suffixes such as `.diagram.json` must
   retain their specificity against broader patterns at equal priority.
2. Select only the chosen contribution's icon ID. If that contribution has no
   ID or its artwork cannot yet resolve, retain the built-in filename icon;
   do not borrow an icon from a
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
   changes, icon registration/removal and icon-pack completion notify the
   affected Explorer instances. Rename/move re-resolves the path through existing
   vault notifications. Do not persist resolved icons
   into vault files, metadata or workspace layouts.
6. Disposers are idempotent and remove only their own contribution. Explicitly
   cover runtime/manifest overlap, duplicate IDs and stale cleanup after
   replacement. Compatibility registrations sharing a view type must keep
   independent pattern/icon ownership; unloading one cannot erase the other.
7. Separate Apps must never share file-icon contributions or owned icon
   registrations. Legacy shared artwork keeps the compatibility behavior above.
   Explorer teardown removes all listeners and fences pending icon resolutions.
   Repainting icons preserves row selection, expanded folders, scrolling, focus
   and an in-progress rename.

The implementation should factor selection where needed rather than making
`getFileIconForPath` instantiate `View` or call plugin activation. Preserve
current behavior for unavailable saved editor associations and prove it against
the existing routing tests before adding lazy-metadata eligibility.

## Delivery slices

| Slice                                          | Work                                                                                                                                                                                                        | Completion evidence                                                                                                                                      |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Specify and reproduce                       | Add atomic API/plugin/Explorer and Design Core requirements with Planned verification rows. Reproduce metadata, custom SVG/pack resolution, ownership and fallback gaps.                                    | Record test commands, names and failing counts before implementation.                                                                                    |
| 2. API and manifest support                    | Add metadata, owned icon helpers, compatibility resolution, explicit resolution results, invalidation and lifecycle cleanup. Update public examples/declarations.                                           | Exact regressions pass; all affected API and distribution suites pass; no file-open or App-isolation regression.                                         |
| 3. Upstream rendering and Explorer integration | First add the generic scoped resolver in Design Core; then bind API icon resolution and invalidation in Explorer. Keep native row rendering and filename fallback.                                          | Design Core source checks and public archive pass; real plugin stories prove custom SVGs/packs, late results, fallback and live transitions in Explorer. |
| 4. First-party adoption                        | Select a real file-view plugin after inspecting its owning repository, then add its owned custom icon and metadata there. Prefer a plugin with a distinct custom suffix for an unambiguous acceptance case. | Its source suites/build/catalog and public archive pass; an installed-plugin example exercises the metadata without host-specific maps.                  |
| 5. Consumer qualification                      | Validate Design Core public exports and build/pack API and Explorer, then refresh the current Web/hosted and Tauri Desktop consumers through public exports.                                                | Cold real-shell acceptance and complete affected interaction/accessibility lanes; separate source and consumer evidence.                                 |

No production implementation, dependency refresh, package publication or first-party
plugin changes belong to this planning slice. Do not retrofit the frozen Deno
host. The scoped custom-artwork renderer is an explicit Design Core prerequisite;
implement and verify it upstream before the smallest Explorer adaptation.

## Acceptance and validation

Start with focused API tests in `editor-view-registry.test.ts`, `plugin.test.ts`,
`workspace.test.ts`, `icons.test.ts`, manifest/distribution tests and a focused
path-resolver file if the implementation is extracted. Cover:

- ordinary and compound suffixes, legacy normalization, unmatched paths,
  explicit associations, all priorities and equal-priority ties;
- absent/blank/unknown icons, malformed manifest fields and old plugins;
- actual custom SVG geometry through bare and qualified IDs, pack aliases,
  asynchronous loading/failure/recovery, concurrent request deduplication, late
  registration after a cached miss and icon replacement/removal;
- valid SVG viewBox/transforms/colours/local definitions, repeated-row ID
  isolation, rejected executable markup and decorative icons excluded from
  accessible names;
- different icons sharing one view type, duplicate owners, stale disposers,
  enable/disable/re-enable, manifest/runtime overlap and lazy metadata without
  activation, vault-content reads or view construction;
- two independent Apps with different owned artwork for the same local ID,
  intentional legacy shared-name behavior, association-change notifications,
  stale asynchronous results and full teardown.

Extend the Explorer subscription tests and real
`stories/plugins/explorer/panels/Explorer.stories.ts` family. Include a mounted
row showing real custom geometry that changes on replacement, enable/disable
and rename; include delayed pack success/failure, a sibling App with independent
owned artwork, normal file activation, built-in fallback, keyboard navigation,
rename focus, folder expansion and accessible file labels. Decorative icons
must remain excluded from accessible names. Run all six existing placements
and any affected editor-association/plugin-management families.

In Design Core, first prove its exact scoped-resolver/Explorer regressions, then
run all affected icon and Explorer stories and the owning full type, unit,
interaction/accessibility, browser, static-build and package checks. Skip
screenshot comparison and baseline updates. The generic renderer change must
be qualified through public exports before Notes adoption.

In Notes, after the exact regressions, run all directly affected package suites
and root
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

Prepare additive Design Core, API and Explorer release notes/Changesets during
implementation. Publish any required Design Core extension before its consumers,
then API before dependent Explorer/plugins and raise consumer minimum ranges
to the first release containing the contract. During the current migration, use
documented, checksummed local archives through ignored validation overlays and
defer publication to its separate authorized gate. Publishable manifests and
lockfiles stay portable registry ranges. Commit each verified owning-repository
slice with Jujutsu.

## Planning verification

Before editing, the Notes working copy was clean and Prettier passed for
`MIGRATION.md` and `spec/migration-progress.json` with zero formatting failures.
No product regression test was run or claimed: this slice adds a plan only.

Initial plan checks at `feee7333` passed:

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

Custom-icon revision: documentation-only; the initial Lucide-only restriction
is removed. Baseline formatting passes for all three documents with zero
failures. Runtime, SVG, browser and accessibility acceptance remain future
implementation work; this revision does not claim those tests have run.
Revision checks pass: Prettier, all three plan links, document size limits,
`pnpm progress:generate`, sequential `pnpm check:progress` (101 unchanged tasks)
and `pnpm spec:check` (ten lanes, 78 governance and six Rust-boundary tests,
zero failures). No application or Design Core implementation changed.
