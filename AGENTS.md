# AGENTS.md

Guidance for agents working in this repository. This file applies to the whole
repo unless a more specific `AGENTS.md` is added deeper in the tree.

## Project Shape

- This is a pnpm + Turbo monorepo for a **minimal** Lapis Notes slice.
- Current packages: `@lapis-notes/api` (runtime kernel) and `@lapis-notes/ui`
  (pruned design-system surface consumed by api).
- Host apps, plugins, workspace shell, and notebook packages are **not** in this
  repo yet. Track intake in `MIGRATION.md` — do not invent them ahead of the
  spec.

## Spec First

- Canonical requirements live under `spec/src/`. Implementation must not run
  ahead of the spec.
- Update the mapped chapter(s) and `spec/src/verification.md` **before or with**
  protected implementation changes.
- Run `pnpm spec:first` after changing protected paths. The gate fails closed on
  unmapped `packages/*/src` changes.
- Authority order: `spec/src` → package interfaces / implementation → Storybook
  catalog → READMEs / this file (workflow only).

## UI And Styling

- Prefer `@lapismd/design-core` for overlapping shadcn primitives over time
  (sibling package via `link:../design-core`).
- Keep Lapis-specific compounds in `@lapis-notes/ui` until migrated; each
  retained custom family needs Storybook stories and docs.
- Every UI family consumed by `@lapis-notes/api` has an `API/<Name>` verification
  story under `stories/api/` (catalog: `stories/catalog/`). When changing
  api-used UI or migrating a family to design-core, update the matching `API/`
  story play and re-run `pnpm test:storybook` plus visual checks
  (`pnpm build-storybook` / `pnpm test:visual` or `pnpm test:visual:update`).
- New or changed visual stories ship with tag `visual-pending` and nested-import
  PNG baselines under `tests/visual/storybook.spec.ts-snapshots/`. Do not flip
  tags to `visual-approved` without human review.
- Target styling philosophy matches design-core: native CSS, public `--ui-*`
  tokens, `data-ui-*` hosts, Lapis theme via `data-ui-theme="lapis"`. Do not
  expand Tailwind-in-export surfaces.
- Track swap progress in root `MIGRATION.md`.

## Tooling

- Use Turbo (`pnpm check`, `pnpm build`, `pnpm test`). Do **not** reintroduce
  multi-script first-party import-resolution gates from the full lapis-notes
  repo. Fix resolution issues inline when adding packages.
- Storybook is the browsable docs host (`pnpm dev` / port **7010**).
- Interaction: `pnpm test:storybook`. Visual Delta: `pnpm test:visual` /
  `pnpm test:visual:update` (Playwright **1.61.1** for Docker capture parity).
- Prefer `jj` when available; otherwise git. Do not revert unrelated user edits.

## Verification

- Every workspace package exposes `check`, `build`, and `test`.
- For cross-cutting work: `pnpm check`, focused package tests, and
  `pnpm spec:check` when governance or protected surfaces change.
- For api-used UI changes: also `pnpm test:storybook` and Visual Delta as above.
