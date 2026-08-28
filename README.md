# Lapis Notes

[![Lapis CI](https://github.com/lapismd/lapis-notes/actions/workflows/lapis-ci.yml/badge.svg)](https://github.com/lapismd/lapis-notes/actions/workflows/lapis-ci.yml)
[![Release](https://github.com/lapismd/lapis-notes/actions/workflows/release.yml/badge.svg)](https://github.com/lapismd/lapis-notes/actions/workflows/release.yml)
[![Storybook](https://img.shields.io/badge/storybook-live-ff4785?logo=storybook&logoColor=white)](https://lapismd.github.io/lapis-notes/)

Lapis Notes monorepo for the application shell, public API/UI/workspace
packages, bundled plugins, Deno desktop host, web host, spec-first governance,
and Storybook acceptance.

## Public packages

The reusable public packages are released from this monorepo. The first public
version for each package is `0.1.0`; the initial npm publication is manual from
reviewed tarballs, and future releases use Changesets plus the release workflow.

| Package | Purpose | npm |
| --- | --- | --- |
| `@lapis-notes/ui` | Shared Svelte UI primitives and CSS entrypoints for Lapis package consumers. | [![npm](https://img.shields.io/npm/v/@lapis-notes/ui?label=npm)](https://www.npmjs.com/package/@lapis-notes/ui) |
| `@lapis-notes/api` | Runtime kernel for app, vault, workspace, plugin, metadata, editor, telemetry, and agent-tool contracts. | [![npm](https://img.shields.io/npm/v/@lapis-notes/api?label=npm)](https://www.npmjs.com/package/@lapis-notes/api) |
| `@lapis-notes/workspace` | Host-owned workspace shell adapter over API and Design Core presentation. | [![npm](https://img.shields.io/npm/v/@lapis-notes/workspace?label=npm)](https://www.npmjs.com/package/@lapis-notes/workspace) |

## Setup

Install dependencies from the repository root:

```bash
pnpm install
```

Requires Node 22+, pnpm 10, and [mdBook](https://rust-lang.github.io/mdBook/)
for `pnpm spec:build`. Desktop work also requires Deno 2.9.5. Published
`@lapismd/*` packages resolve from npm semver ranges. Keep adjacent source
checkouts only when actively fixing those packages; after release, update this
repository to the published registry version.

## Scripts

| Command                                      | Purpose                                                       |
| -------------------------------------------- | ------------------------------------------------------------- |
| `pnpm dev` / `pnpm storybook`                | Storybook on port **7010** (one supervisor per checkout/port) |
| `pnpm storybook:stop`                        | Stop this checkout's Storybook supervisor and listeners       |
| `pnpm storybook:restart`                     | Replace the owner and start a fresh Storybook                 |
| `pnpm restart:web`                           | Free Vite port **4174**, then start `dev:web`                 |
| `pnpm build`                                 | Turbo build packages                                          |
| `pnpm check`                                 | Turbo package checks                                          |
| `pnpm test`                                  | Turbo tests                                                   |
| `pnpm spec:first`                            | Spec-first gate                                               |
| `pnpm spec:check`                            | Validate specification, build book, and run gate              |
| `pnpm spec:search -- "<query or LN-ID>"`     | Refresh and search the canonical specification                |
| `pnpm spec:search -- --semantic "<concept>"` | Refresh embeddings and run semantic specification search      |
| `pnpm spec:index [-- --semantic]`            | Prewarm the local specification index                         |
| `pnpm packages:check`                        | Validate public package boundaries and release configuration  |
| `pnpm packages:pack`                         | Build and pack reviewed npm release tarballs                  |
| `pnpm release:plan`                          | Compare package versions with the npm registry                |

## Docs

- Agent workflow: [`AGENTS.md`](./AGENTS.md)
- Release process: [`RELEASING.md`](./RELEASING.md)
- Migration tracker: [`MIGRATION.md`](./MIGRATION.md)
- Canonical requirements: [`spec/src/`](./spec/src/)
- Supporting records: [`spec/records/`](./spec/records/)
- Completed plans: [`spec/archive/`](./spec/archive/)
