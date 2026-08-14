# Plugin Roles Repository Migration

## Progress

| Phase | Status | Repository evidence |
| --- | --- | --- |
| Plugin taxonomy and managed settings contract | Complete | Design Core `qzzunnty` / `6f3b33f2`; Lapis `nkyzmurq` / `5c00187e` |
| Versioned host dependency closure | Complete | Design Core `rtstlmmm` / `480402d3`, `msqozpps` / `b38002a0`; Lapis `norrxzos` / `76a912a2` |
| Filtered Roles history and standalone repository | Complete | `lapis-plugin-cv-roles` `nyxrlmll` / `fa8a07a2`; filtered initial tip `870178ce` |
| Lapis consumer cutover | In progress | Current Jujutsu change; final change and commit IDs are recorded after validation |
| Registry-backed independent CI | Awaiting dependency releases | API, UI, Design Core, and Mira manifests are versioned and packed; publication is external to this source migration |

## Extraction audit

- Source boundary: `31ba0cbf1018031d9dc9aad9f7f0ef53acaafa50`
- Both `packages/plugins/plugin-cv` and `packages/plugins/plugin-roles` histories were selected explicitly in a fresh temporary clone.
- Selected source commits: 20; filtered `main` commits before standalone work: 20; filtered files: 94.
- Representative source-to-filtered mappings and the complete audit live in the sibling repository's `docs/HISTORY_MIGRATION.md`.
- `git fsck --full` passed after filtering and after the standalone commit.

## Validation evidence

- Design Core: specification, Svelte/type check, managed-plugin unit and Storybook checks, static Storybook, and cache-free package inventory.
- Lapis API/UI: specification, type/Svelte checks, 141 focused lifecycle/workspace tests, build, publint, and package inspection.
- Roles: 55-requirement standalone spec, 33 unit tests, 16 Storybook/axe tests, static Storybook, build, publint, portable tarball, and clean packed-artifact consumer compilation.
- Consumer acceptance: recorded after desktop, web, root Storybook, existing-tab activation, disable/re-enable, and restart checks complete.
- Visual Delta: governed 1280 by 900 story remains `visual-pending`; no baseline is created or replaced by this migration.

## Compatibility

Runtime IDs remain `roles`, `role`, `roles`, and `cv`; command IDs, filenames,
`Roles/<slug>/role.md`, and plugin-data paths are unchanged. Existing array and
object forms of `.obsidian/core-plugins.json` remain readable. The removed
in-tree package is recoverable from Lapis history and the filtered repository;
no vault migration is required.
