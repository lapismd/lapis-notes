# AI Host Repository Migration

Historical, non-normative plan. Canonical consumer requirements live in
[`spec/src`](../src). Host implementation requirements live in the sibling
`ai-host` specification. This file is not part of the mdBook or QMD collection.

## Progress

| Phase | Status | Repository evidence |
| --- | --- | --- |
| Filtered AI Host history and standalone repository | Complete | Sibling `ai-host` `docs/HISTORY_MIGRATION.md`; filtered initial `main` `88bbd5ae` |
| Standalone spec and checks | Complete | Sibling `pnpm spec:check`, `pnpm check`, `pnpm test`, and `pnpm build` |
| Lapis consumer cutover | Complete | This change removes `packages/ai-host` and links `@lapismd/ai-host` |

## Extraction audit

- Source boundary: `7e61dc7d42f47ff1b24b29c7b2d2774912dd3bd9`
- Temporary exported source bookmark: `ai-host-extraction-base`
- Selected path: `packages/ai-host/` rewritten to the sibling repository root
- Selected source commits: 8; filtered `main` commits before standalone work: 8; filtered files: 29
- Representative source-to-filtered mappings and the complete audit live in the sibling repository's `docs/HISTORY_MIGRATION.md`
- `git fsck --full` passed after filtering

## Compatibility

The `lapis-ai-host` CLI name, WebSocket protocol, and public library exports
remain the same. Only the package name changes from `@lapis-notes/ai-host` to
`@lapismd/ai-host`. `@lapis-notes/ai` still MUST NOT depend on the host package.
