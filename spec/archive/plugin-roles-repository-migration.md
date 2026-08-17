# Plugin Roles Repository Migration

Historical, non-normative plan. Canonical requirements live in
[`spec/src`](../src). This file is not part of the mdBook or QMD collection.

## Progress

| Phase | Status | Repository evidence |
| --- | --- | --- |
| Plugin taxonomy and managed settings contract | Complete | Design Core `qzzunnty` / `6f3b33f2`; Lapis `nkyzmurq` / `5c00187e` |
| Versioned host dependency closure | Complete | Design Core `rtstlmmm` / `480402d3`, `msqozpps` / `b38002a0`; Lapis `norrxzos` / `76a912a2` |
| Filtered Roles history and standalone repository | Complete | `lapis-plugin-cv-roles` `nyxrlmll` / `fa8a07a2`, `kmmkwopl` / `3473d46e`, `yrntpmqw` / `8b27dd00`; filtered initial tip `870178ce` |
| Lapis consumer cutover | Complete | Lapis Jujutsu change `lxtkmknv` / `a57a5611` |
| Registry-backed independent CI | Awaiting dependency releases | API, UI, Design Core, and Mira manifests are versioned and packed; publication is external to this source migration |

## Extraction audit

- Source boundary: `31ba0cbf1018031d9dc9aad9f7f0ef53acaafa50`
- Both `packages/plugins/plugin-cv` and `packages/plugins/plugin-roles` histories were selected explicitly in a fresh temporary clone.
- Selected source commits: 20; filtered `main` commits before standalone work: 20; filtered files: 94.
- Representative source-to-filtered mappings and the complete audit live in the sibling repository's `docs/HISTORY_MIGRATION.md`.
- `git fsck --full` passed after filtering and after the standalone commits.

## Validation evidence

- Design Core: specification, Svelte/type check, managed-plugin unit and Storybook checks, static Storybook, and cache-free package inventory passed. The broader catalog retained one unrelated Complete CV Form failure.
- Lapis API/UI: 476-requirement specification, type/Svelte checks, all 576 API tests, build, `publint`, and package inspection passed.
- Roles: 56-requirement standalone spec, 33 unit tests, 16 Storybook/axe tests, static Storybook, build, `publint`, portable tarball, and clean packed-artifact consumer compilation passed.
- Consumer acceptance: desktop and web production builds, root static Storybook, the focused Roles shell interaction, existing-tab activation, grouped settings, optional-plugin disable/re-enable, missing-view recovery, and final collapsed Search state passed. The in-app browser confirmed Included and First-party groups and the terminal collapsed state at the governed viewport.
- Cross-repository refresh: `@lapismd/mira` rebuilt and passed `publint`. The full Mira workspace remains blocked by an unrelated CodeMirror 6.43.3/6.43.8 declaration mismatch in `mira-plugin-ai`; the Lapis root Turbo check likewise rejects linked workspaces outside the repository root. Direct checks for every modified Lapis package passed.
- Visual Delta: governed 1280 by 900 story remains `visual-pending`; no baseline is created or replaced by this migration.

## Compatibility

The plugin ID remains `roles`, and view types remain `roles`, `role`, and `cv`; command IDs, filenames,
`Roles/<slug>/role.md`, and plugin-data paths are unchanged. Existing array and
object forms of `.obsidian/core-plugins.json` remain readable. The removed
in-tree package is recoverable from Lapis history and the filtered repository;
the working-copy backup is retained at `/tmp/lapis-plugin-roles-removed.JFVl74`.
No vault migration is required.
