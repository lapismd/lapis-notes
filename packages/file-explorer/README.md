# @lapis-notes/file-explorer

Reusable File Explorer plugin for applications built on the Lapis framework.

The package owns Explorer views, commands, palette entries, and presentation
settings. Applications retain vault selection, session boot, persistence
policy, and host integration.

## Public surface

- `FileExplorerPlugin`
- `createFileExplorerPlugin`
- `ExplorerPanel`
- `FileExplorerViewType`
- `FILE_EXPLORER_SELECTION_CHANGE_EVENT`

## Usage

```ts
import { FileExplorerPlugin } from "@lapis-notes/file-explorer";
```

Install `@lapis-notes/api`, `@lapismd/design-core`, and Svelte from npm with
compatible versions.

## Common scripts

```sh
pnpm --filter @lapis-notes/file-explorer build
pnpm --filter @lapis-notes/file-explorer check
pnpm --filter @lapis-notes/file-explorer test
```
