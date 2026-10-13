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
- `@lapis-notes/workspace` — thin design-core workspace host
- `@lapis-notes/desktop-deno` — native-folder Deno desktop host
- `@lapis-notes/desktop-deno` — experimental Deno desktop vault-open spike
- `@lapis-notes/web` — local-first browser/PWA consumer host
- `@lapis-notes/bases` — bundled metadata-query views and Markdown embeds
- `@lapis-notes/ai` — bundled provider-agnostic agent runtime and chat panel
- `@lapis-notes/lapis-plugin-cv-roles` — vault-native role workflows plus retained CV views
- `@lapis-notes/lapis-plugin-tasks` — sibling Tasks plugin; hosts register the plugin class
- Storybook host and specification governance

The notebook and remaining unlisted bundled plugins remain tracked for later
intake in root `MIGRATION.md` and must not be invented ahead of their canonical
requirements. The authorized web host remains a consumer of API and workspace
contracts rather than moving browser policy into reusable packages.
