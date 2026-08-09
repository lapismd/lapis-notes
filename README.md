# Lapis Notes (minimal)

Minimal Lapis Notes monorepo: `@lapis-notes/api` + pruned `@lapis-notes/ui`,
Turbo/pnpm, mira-inspired spec-first governance, and Storybook for custom UI.

## Setup

Keep `../design-core` and `../mira-mde` checked out beside this repository.
Mira publishes local development output from `dist`, so build it before the
initial Lapis install and after Mira source changes:

```bash
pnpm --dir ../mira-mde build
pnpm install
```

Requires Node 22+, pnpm 10, and [mdBook](https://rust-lang.github.io/mdBook/)
for `pnpm spec:build`. Sibling packages are declarative `link:` dependencies:
design-core exports its live source contract, while rebuilding Mira refreshes
the linked package output without reinstalling Lapis.

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` / `pnpm storybook` | Storybook on port **7010** (one supervisor per checkout/port) |
| `pnpm storybook:stop` | Stop this checkout's Storybook supervisor and listeners |
| `pnpm storybook:restart` | Replace the owner and start a fresh Storybook |
| `pnpm build` | Turbo build packages |
| `pnpm check` | Turbo package checks |
| `pnpm test` | Turbo tests |
| `pnpm spec:first` | Spec-first gate |
| `pnpm spec:check` | Build book + run gate |

## Docs

- Agent workflow: [`AGENTS.md`](./AGENTS.md)
- Migration tracker: [`MIGRATION.md`](./MIGRATION.md)
- Canonical requirements: [`spec/src/`](./spec/src/)
