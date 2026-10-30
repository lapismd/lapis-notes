# Private profile Markdown dependency intake

The Desktop dependency audit found that App Profile still required Markdown
`^0.1.7`. That installed the former Mira dependency line and its vulnerable
KaTeX version alongside the current renderer cohort. The owning private profile
now requests the published Markdown `^0.2.0` package. No public API, static plugin
selection, routing, lifecycle, or trust contract changes (LN-WEB-002).

Validation passed in an isolated JJ workspace under Node 24.10.0/pnpm 10.34.5:

- `pnpm install --ignore-pnpmfile --frozen-lockfile`.
- `pnpm --filter '@lapis-notes/app-profile^...' build`.
- `pnpm --filter @lapis-notes/app-profile build`: public native-chat build and
  type checking, zero errors and warnings.
- `pnpm --filter @lapis-notes/app-profile test`: 74 tests across 13 files.
- `LAPIS_NOTES_VALIDATION_RUNTIME=native pnpm spec:check`: all six specification
  lanes, App ownership, metadata query audit and 67 validation cases pass.
- `pnpm spec:first --base main@origin --head @`: two protected files and six
  mapped canonical chapters pass after completing the dependency contract notes.

The initial specification attempts exposed missing mapped-topic updates; those
attempts remained failures until the mapped contract notes were present. API
prepack regenerated its version metadata for the built exports; unrelated tracked
API generated-source drift is excluded from this private-profile change.
Desktop packed-public-export, audit and hosted qualification remain separate.
This record does not publish a package or qualify native product behavior.
