# UI verification

<!-- prettier-ignore -->
| ID | Chapter | Status | Evidence |
| --- | --- | --- | --- |
| LN-UI-016 | [ui-and-styling](../ui-and-styling/core-contract.md#ln-ui-016) | Implemented | sidebar-custom Input and Separator wrappers consume design-core's public named prop contracts |
| LN-UI-017 | [ui-and-styling](../ui-and-styling/core-contract.md#ln-ui-017) | Implemented | UI package manifest is public, versioned, semver-portable, and pack-tested for external consumers |
| LN-UI-001 | [ui-and-styling](../ui-and-styling/core-contract.md#ln-ui-001) | Implemented | api + stories on `@lapismd/design-core/shadcn/*`; kept compounds only in ui |
| LN-UI-002 | [ui-and-styling](../ui-and-styling/core-contract.md#ln-ui-002) | Implemented | `API/` stories under `stories/api/` |
| LN-UI-003 | [ui-and-styling](../ui-and-styling/core-contract.md#ln-ui-003) | Implemented | colocated CSS + `--ui-*` on kept compounds + api chrome; confirm-dialog keeps Design Core dialog host identity and asserts overlay/surface paint |
| LN-UI-004 | [ui-and-styling](../ui-and-styling/core-contract.md#ln-ui-004) | Implemented | policy in AGENTS + this chapter; no-TW gate |
| LN-UI-005 | [ui-and-styling](../ui-and-styling/core-contract.md#ln-ui-005) | In progress | Storybook loads design-core styles + lapis theme; production hosts still pending |
| LN-UI-006 | [ui-and-styling](../ui-and-styling/core-contract.md#ln-ui-006) | Implemented | AA-safe `--primary` / `--destructive` in design-core lapis theme |
| LN-UI-007 | [ui-and-styling](../ui-and-styling/core-contract.md#ln-ui-007) | Implemented | Published Design Core `^0.6.0` supplies prepared CSS and bundled fonts through public exports. ui `theme.css` alias-only; brand in design-core `themes/lapis.css` |
| LN-UI-008 | [ui-and-styling](../ui-and-styling/core-contract.md#ln-ui-008) | Implemented | Compounds and API chrome use native CSS; stories excluded. UI 0.1.3 packages the retained runtime imports while preserving component utility-class restrictions, markup and tokens. |
| LN-UI-009 | [ui-and-styling](../ui-and-styling/core-contract.md#ln-ui-009) | Implemented | `pnpm check:no-tailwind` in root/package `check` |
| LN-UI-010 | [ui-and-styling](../ui-and-styling/core-contract.md#ln-ui-010) | Implemented | design-core `WorkspaceStartup`; semantic source-editor classes and demo CSS |
| LN-UI-011 | [ui-and-styling](../ui-and-styling/core-contract.md#ln-ui-011) | Implemented | Mira Obsidian theme CSS and `data-mira-theme="obsidian"` on the source editor host |
| LN-UI-012 | [ui-and-styling](../ui-and-styling/core-contract.md#ln-ui-012) | Implemented | editor inline-title tokens and h1-scale filename paint |
| LN-UI-013 | [ui-and-styling](../ui-and-styling/core-contract.md#ln-ui-013) | Implemented | mono default / md-text sans via data-language; non-Markdown gutter retained; Markdown duplicate gutter hidden; outer sizer scope excludes embedded previews |
| LN-UI-014 | [ui-and-styling](../ui-and-styling/core-contract.md#ln-ui-014) | Implemented | Design Core owns owner-document portal resolution and Hover Card layering; Lapis local overlay context/export/alias retired |
| LN-UI-015 | [ui-and-styling](../ui-and-styling/core-contract.md#ln-ui-015) | Implemented | alias-only Lapis theme maps Mira Obsidian interaction variables to design-core workspace semantics |
| LN-UI-018 | [ui-and-styling](../ui-and-styling/core-contract.md#ln-ui-018) | Implemented | public native autocomplete CSS maps CodeMirror tooltips to Design Core popover and command semantics without Tailwind directives |
| LN-UI-019 | [ui-and-styling, packages](../ui-and-styling/core-contract.md#ln-ui-019) | Implemented | UI README/changelog/license plus package-tarball checks document and verify root helpers, CSS entrypoints, retained component subpaths, Design Core/Svelte peers, and built public CSS/component declarations. |
| LN-UI-020 | [ui-and-styling](../ui-and-styling/core-contract.md#ln-ui-020) | Implemented | API/Search Highlight light/dark axe cases verify workspace/sidebar normal, hover and active rows; UI check/build and consumer Catalog verify public yellow highlight defaults |
