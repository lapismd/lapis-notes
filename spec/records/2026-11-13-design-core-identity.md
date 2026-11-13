# Design Core 0.12.4 identity qualification

PR #84 failed `packages/app-profile` build because WorkspaceShell and plugin
management settings resolved Design Core 0.12.4 controllers while Workspace
and File Explorer still resolved 0.12.1. AppShellController private members
make those package identities incompatible.

Workspace and File Explorer already declare compatible union ranges including
`^0.12.0`. Their lockfile resolutions now use the same released 0.12.4
identity as API, UI, Web and the private profile. Unused 0.12.1 snapshots
are removed. Legacy 0.3.5 and 0.7.4 consumer lines stay. No cast, wrapper
or relaxed check conceals the mismatch.

The exact local reproduction is `pnpm --dir packages/workspace check` after
frozen install. It must reject mixed identities before this patch and pass
after it.
