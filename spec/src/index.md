# Lapis Notes (Minimal)

This mdBook is the canonical specification for the minimal Lapis Notes monorepo.

## Authority order

1. Requirements under `spec/src/`
2. Published package interfaces and conforming implementation
3. Storybook catalog metadata and fixtures
4. READMEs and `AGENTS.md` (onboarding and workflow only)

Implementation and specification must change together. Storybook may explain or
demonstrate a requirement, but it must link to the canonical chapter instead of
copying normative prose.

## Scope

This repository currently contains:

- `@lapis-notes/api` — shared runtime kernel
- `@lapis-notes/ui` — pruned UI surface required by api
- Storybook host and specification governance

Host applications, plugins, and workspace chrome are tracked for later intake in
root `MIGRATION.md` and must not be invented ahead of these chapters.
