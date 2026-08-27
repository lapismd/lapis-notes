# Lapis Notes

Lapis Notes monorepo for the application shell, public API/UI/workspace
packages, bundled plugins, Deno desktop host, web host, spec-first governance,
and Storybook acceptance.

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

## Docs

- Agent workflow: [`AGENTS.md`](./AGENTS.md)
- Migration tracker: [`MIGRATION.md`](./MIGRATION.md)
- Canonical requirements: [`spec/src/`](./spec/src/)
- Supporting records: [`spec/records/`](./spec/records/)
- Completed plans: [`spec/archive/`](./spec/archive/)
