# @lapis-notes/desktop-electron

Partial Electron desktop host for Lapis Notes. It preserves the native lifecycle,
context-isolated preload boundary, vault services, retained sidecars, and local
macOS/Linux packaging from the legacy shell while mounting the current shared
`WorkspaceShell` over a real folder.

The package was mechanically ported from
`/Users/stevejuma/code/lapis-notes/packages/desktop-electron` at source commit
`8ec68e18`. The source checkout remains read-only.

This host intentionally does not seed demo files, mount the Editor Demo, register
bundled plugins, provide notebook/DuckDB or model runtimes, or publish releases.
Each platform distribution command writes a local-only artifact manifest with
sizes, SHA-256 checksums, and Electron Builder blockmap metadata.

## Common scripts

```sh
pnpm dev:desktop
pnpm build:desktop
pnpm package:desktop
pnpm dist:desktop:mac
pnpm dist:desktop:linux
```

See [the canonical desktop-host specification](../../spec/src/desktop-host.md)
and [the migration tracker](../../MIGRATION.md) for the retained contracts and
acceptance checklist.
