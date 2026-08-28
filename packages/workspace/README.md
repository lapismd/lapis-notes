# @lapis-notes/workspace

Workspace shell adapter for Lapis Notes package consumers.

This package exposes the public Svelte workspace shell that connects a host-owned
`App` to Design Core layout presentation. It stays shell-only: hosts own vault
selection, plugin boot, persistence, routing, profile management, and production
backend setup.

## Public surface

- `WorkspaceShell`, the Svelte component used by hosts and demos.
- `WorkspaceShellProps`, the public prop contract for typed Svelte consumers.

## Usage

```ts
import { WorkspaceShell } from "@lapis-notes/workspace";
```

Install `@lapis-notes/api`, `@lapismd/design-core`, and Svelte from npm with
compatible versions. `@lapis-notes/workspace@0.1.0` expects
`@lapis-notes/api@^0.1.0`.

## Common Scripts

```sh
pnpm --filter @lapis-notes/workspace build
pnpm --filter @lapis-notes/workspace check
pnpm --filter @lapis-notes/workspace test
```

## References

- [Package spec](spec.md)
- [Canonical spec](../../spec/src/20-packages/workspace/index.md)
