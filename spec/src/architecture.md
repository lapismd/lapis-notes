# Architecture

## Requirements

| ID | Requirement |
| --- | --- |
| LN-ARCH-001 | The repository MUST be a pnpm workspace orchestrated by Turbo. |
| LN-ARCH-002 | Workspace packages MUST live under `packages/*` and expose `build`, `check`, and `test` scripts. |
| LN-ARCH-003 | The browsable docs host MUST be Storybook on port 7010 (`pnpm dev`). |
| LN-ARCH-004 | The monorepo MUST NOT reintroduce multi-script first-party import-resolution gates; resolution issues MUST be fixed inline when packages are added. |
| LN-ARCH-005 | `@lapismd/design-core` MUST be consumed as a sibling link (`link:../design-core`), not vendored. |

## Package graph

```text
@lapis-notes/ui  (leaf UI)
       ↑ peer
@lapis-notes/api (kernel)
       ↑ (future hosts / plugins)

@lapismd/design-core (sibling; gradual UI swap target)
```

## Tooling policy

Root scripts stay thin: Turbo for package tasks, `spec:first` for governance,
and Storybook for docs. Do not grow a parallel script forest for import path
syncing.
