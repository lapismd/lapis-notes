# CLI settings declarative review

The shared `@lapis-notes/ui/cli` registration now composes the production
Design Core Settings surface as declarative `General` groups and fields. The
stories include the built-in Workspace and Appearance navigation so review uses
the same application context as Desktop and Server rather than an isolated
component card.

## Covered behavior

- Advanced, Browser installation and optional Desktop access are separate
  Settings groups. Design Core owns the cards, row labels, control columns and
  dividers.
- Desktop status uses a Design Core badge with a state icon and bundled version;
  Installed uses the semantic success colour, and the host-owned command path
  occupies the full row below it in Settings-description typography. Install, repair
  and uninstall are aligned secondary actions, while Refresh remains the single
  filled primary action. Repair uses warning paint. Installation failures use
  the Design Core destructive Alert with an icon and span the full row beneath
  the action.
- Browser setup infers an unambiguous browser OS and architecture, uses the
  Design Core Select with OS icons and truncating labels, and keeps the archive
  download action beside the selection. Unknown and ambiguous platforms require
  explicit selection.
- SHA-256 uses the public Settings `CopyableValue`. Installation instructions
  use the Design Core `CodeBlock` with `language="bash"`, span highlighting and
  the workspace-background token.

## Regression and qualification evidence

- Before editing, the exact CLI Storybook target passed 6 of 6 cases but showed
  one application-owned full-width custom field rather than declarative rows.
- Focused CLI units: 9 passed, 0 failed.
- Complete `@lapis-notes/ui` units: 24 passed, 0 failed.
- UI Svelte and TypeScript checks pass with 0 errors and 0 warnings.
- UI public build, package generation and publint pass.
- Exact app-like CLI Storybook interaction/axe target: 6 passed, 0 failed after
  a cold Storybook restart. The focused failure-alert regression passes 1 of 1
  and verifies destructive Alert composition, description typography, icon and
  full-row width. The first clean full lane exposed late CLI icon discovery;
  the dependency-optimization inventory now prevents that in cold acceptance.
- The complete Storybook interaction/accessibility lane and static Storybook
  build pass from clean validation snapshots after the CLI icon imports were
  added to Storybook dependency optimization. The static build renders all 174
  specification chapters. The four interaction/axe shards pass 96, 50, 41 and
  53 cases respectively (240 total), including the six CLI scenarios and the
  independent CLI registration story. The browser-download assertion derives
  its expected action label from the browser-selected platform so Linux CI and
  macOS review prove the same inference contract.
- Root `check`, `test` and `build` pass across the complete workspace. Focused
  CLI evidence remains green: 9 unit cases and the exact browser-download
  interaction case pass, along with the Svelte and TypeScript checks.

The stories remain `visual-pending`. No screenshot baseline, package release,
consumer adoption, deployment or installed-app replacement is included in this
review slice.
