# @lapis-notes/api

Shared runtime kernel for Lapis Notes. This package defines the application services, vault and
workspace model, commands, settings, metadata, events, and plugin lifecycle that the rest of the
repo builds on.

## Common Scripts

```sh
pnpm --filter @lapis-notes/api build
pnpm --filter @lapis-notes/api check
pnpm --filter @lapis-notes/api test
```

## References

- [Package spec](spec.md)
- [Canonical spec](../../spec/src/20-packages/api/index.md)
- [App state model](../../spec/src/20-packages/api/app-state-and-workspace-model.md)
