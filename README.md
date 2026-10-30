# Lapis Notes

[![Lapis CI](https://github.com/lapismd/lapis-notes/actions/workflows/lapis-ci.yml/badge.svg)](https://github.com/lapismd/lapis-notes/actions/workflows/lapis-ci.yml)
[![Release](https://github.com/lapismd/lapis-notes/actions/workflows/release.yml/badge.svg)](https://github.com/lapismd/lapis-notes/actions/workflows/release.yml)
[![Storybook](https://img.shields.io/badge/storybook-live-ff4785?logo=storybook&logoColor=white)](https://lapismd.github.io/lapis-notes/)

Lapis Notes monorepo for the application shell, reusable framework packages,
an app-owned plugin profile, frozen Deno desktop host, Node server host, web host, spec-first governance,
and Storybook acceptance.

## Public packages

The reusable framework packages are independently versioned and released from
this monorepo through normal npm semver ranges. Changesets and the release
workflow prepare, publish, verify, and document subsequent releases.

| Package                         | Purpose                                                                                                  | npm                                                                                                                                         |
| ------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `@lapis-notes/ui`               | Shared Svelte UI primitives and CSS entrypoints for Lapis package consumers.                             | [![npm](https://img.shields.io/npm/v/@lapis-notes/ui?label=npm)](https://www.npmjs.com/package/@lapis-notes/ui)                             |
| `@lapis-notes/api`              | Runtime kernel for app, vault, workspace, plugin, metadata, editor, telemetry, and agent-tool contracts. | [![npm](https://img.shields.io/npm/v/@lapis-notes/api?label=npm)](https://www.npmjs.com/package/@lapis-notes/api)                           |
| `@lapis-notes/language-service` | Provider-neutral Markdown language-service and Markdownlint runtime contracts.                           | [![npm](https://img.shields.io/npm/v/@lapis-notes/language-service?label=npm)](https://www.npmjs.com/package/@lapis-notes/language-service) |
| `@lapis-notes/file-explorer`    | Reusable File Explorer plugin for Lapis application profiles.                                            | [![npm](https://img.shields.io/npm/v/@lapis-notes/file-explorer?label=npm)](https://www.npmjs.com/package/@lapis-notes/file-explorer)       |
| `@lapis-notes/workspace`        | Host-owned workspace shell adapter over API and Design Core presentation.                                | [![npm](https://img.shields.io/npm/v/@lapis-notes/workspace?label=npm)](https://www.npmjs.com/package/@lapis-notes/workspace)               |

## Public plugins

Lapis Notes is an application assembled from the framework packages and an
app-owned static plugin profile. Its default profile is exactly Source Editor,
Markdown, File Explorer, and Search. These plugins are enabled by default and
can be disabled by the user; the other first-party plugins are optional rather
than silently bundled into every Lapis-based application.

File Explorer remains in this repository as a reusable framework plugin. The
other independently versioned first-party plugins are released from
[`lapismd/lapis-plugins`](https://github.com/lapismd/lapis-plugins). Application
authors consume their npm packages through semver ranges, while end users can
install signed `.lapis-plugin` archives from the
[Lapis plugin registry](https://registry.lapis.md/) or through the in-app plugin
manager.

| Plugin        | Package                      | Lapis Notes default | npm                                                                                                                                   |
| ------------- | ---------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Source Editor | `@lapis-notes/source-editor` | Yes                 | [![npm](https://img.shields.io/npm/v/@lapis-notes/source-editor?label=npm)](https://www.npmjs.com/package/@lapis-notes/source-editor) |
| Markdown      | `@lapis-notes/markdown`      | Yes                 | [![npm](https://img.shields.io/npm/v/@lapis-notes/markdown?label=npm)](https://www.npmjs.com/package/@lapis-notes/markdown)           |
| File Explorer | `@lapis-notes/file-explorer` | Yes                 | [![npm](https://img.shields.io/npm/v/@lapis-notes/file-explorer?label=npm)](https://www.npmjs.com/package/@lapis-notes/file-explorer) |
| Search        | `@lapis-notes/search`        | Yes                 | [![npm](https://img.shields.io/npm/v/@lapis-notes/search?label=npm)](https://www.npmjs.com/package/@lapis-notes/search)               |
| AI            | `@lapis-notes/ai`            | No                  | [![npm](https://img.shields.io/npm/v/@lapis-notes/ai?label=npm)](https://www.npmjs.com/package/@lapis-notes/ai)                       |
| Bases         | `@lapis-notes/bases`         | No                  | [![npm](https://img.shields.io/npm/v/@lapis-notes/bases?label=npm)](https://www.npmjs.com/package/@lapis-notes/bases)                 |
| Bookmarks     | `@lapis-notes/bookmarks`     | No                  | [![npm](https://img.shields.io/npm/v/@lapis-notes/bookmarks?label=npm)](https://www.npmjs.com/package/@lapis-notes/bookmarks)         |
| Graph         | `@lapis-notes/graph`         | No                  | [![npm](https://img.shields.io/npm/v/@lapis-notes/graph?label=npm)](https://www.npmjs.com/package/@lapis-notes/graph)                 |
| History       | `@lapis-notes/history`       | No                  | [![npm](https://img.shields.io/npm/v/@lapis-notes/history?label=npm)](https://www.npmjs.com/package/@lapis-notes/history)             |
| Markdown Lint | `@lapis-notes/markdown-lint` | No                  | [![npm](https://img.shields.io/npm/v/@lapis-notes/markdown-lint?label=npm)](https://www.npmjs.com/package/@lapis-notes/markdown-lint) |
| Spellcheck    | `@lapis-notes/spellcheck`    | No                  | [![npm](https://img.shields.io/npm/v/@lapis-notes/spellcheck?label=npm)](https://www.npmjs.com/package/@lapis-notes/spellcheck)       |
| Word Count    | `@lapis-notes/wordcount`     | No                  | [![npm](https://img.shields.io/npm/v/@lapis-notes/wordcount?label=npm)](https://www.npmjs.com/package/@lapis-notes/wordcount)         |

## Setup

Install dependencies from the repository root:

```bash
pnpm install
```

Requires Node 22+, pnpm 10, and [mdBook](https://rust-lang.github.io/mdBook/)
for `pnpm spec:build`. Desktop work also requires Deno 2.9.5. Published
`@lapismd/*` and `@lapis-notes/*` dependencies resolve from npm semver ranges.
Keep adjacent source checkouts only when actively fixing those packages; after
release, update this repository to the published registry version.

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
| `pnpm ci:packages`                           | Run the bounded Turbo build, check, and test graph            |
| `pnpm ci:release`                            | Run release, package, Storybook, and policy validation        |
| `pnpm ci:container`                          | Run release validation in the pinned Linux CI image           |

## CI and local parity

Package builds, checks, and tests run through a bounded Turbo wrapper. It uses
half the available processors, capped at four, unless `TURBO_CONCURRENCY` is
set to a positive number or percentage. CI fans out after one build-cache job
into governance, quality, unit, static Storybook, interaction/accessibility,
and release-artifact lanes, then reports one stable `validate` result. Visual
comparison stays wired but is not a deployment-blocking lane.

The organization remote cache is signed and fail-open: missing credentials or
an unavailable cache falls back to normal execution. To test it locally, copy
`.env.example` to the ignored root `.env` and provide:

- `TURBO_API`
- `TURBO_TEAM`
- `TURBO_TOKEN`
- `TURBO_REMOTE_CACHE_SIGNATURE_KEY`

Never commit the local `.env` or cache credentials. `pnpm ci:container` uses
the immutable `ghcr.io/lapismd/lapis-notes-ci` digest recorded in
`.ci/images.json`. That lockfile-specific image warms only the pnpm store;
every run still installs the checked-out workspace with
`pnpm install --frozen-lockfile --prefer-offline`. See [`.ci/README.md`](./.ci/README.md)
for image refresh and local-container details.

## Docs

- Agent workflow: [`AGENTS.md`](./AGENTS.md)
- Release process: [`RELEASING.md`](./RELEASING.md)
- Outstanding work: [`spec/src/backlog.md`](./spec/src/backlog.md)
- Canonical requirements: [`spec/src/`](./spec/src/)
- Supporting records: [`spec/records/`](./spec/records/)
- Historical evidence and provenance: [`spec/records/`](./spec/records/)

## Local test caching

Package unit tests already run through Turbo, as in `lapis-plugins`. Repository
Storybook, release-tooling, specification, and browser test commands now use the
same bounded runner. Successful deterministic results are reused from the local
disk cache; configured signed remote caching is optional. Source, configuration,
dependency, runtime, and test-argument changes invalidate those results. Failed
tests run again. Cache hits suppress replayed suite logs so they are visibly
different from new execution.

```sh
pnpm test --filter=@lapis-notes/workspace
pnpm test:storybook
pnpm test:spec-validation
pnpm release:test
pnpm test:specification:static
```

To prove a cold run or repeat a previously successful suite, use `--force`:

```sh
pnpm test --force
pnpm test:storybook --force
pnpm test:specification:dev --force
```

Live-server pointer checks, packaged desktop smoke checks, Web end-to-end
checks, and visual staging or baseline updates run through Turbo with caching
disabled. They depend on state outside the tracked task inputs. Storybook runs
with an external base URL or live controller/terminal configuration also disable
cache reads and writes. Visual baseline updates still require approval.
`pnpm storybook:installed` starts the catalog using already installed packages.
The development Docs tests use this path in standalone CI; sibling-tarball
preparation remains an explicit local-development choice.

The `:run` scripts are internal raw runners; use the public commands above for
local caching. Direct `pnpm exec vitest` or `pnpm --filter <package> test` invokes
the underlying runner directly; use the root Turbo commands for cached runs.

## Hosted server

The hosted server, its image, and its browser client live in the lapis-server
repository. This repository does not build that image or run server acceptance.
The retired `@lapis-notes/server-deno` package is deprecated: it has no
manifest, and check, test, build, and CI do not select it. The `deno-server`
session value remains a compatibility alias for `node-server`.

## Local checks

Portable checks, builds and tests default to Docker. See [validation](docs/validation.md)
for image preparation, remote execution, explicit native runs and story composition checks.
