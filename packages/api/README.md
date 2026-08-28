# @lapis-notes/api

Shared runtime kernel for Lapis Notes.

This package defines the transport-neutral contracts used by Lapis hosts and
plugins: the app container, vault/storage interfaces, workspace model, commands,
settings, metadata, events, editor abstractions, plugin lifecycle, telemetry,
and portable agent-tool helpers. It intentionally does not own desktop or web
boot policy, vault selection, persistence transport, bundled plugin enablement,
or product routing.

## Public surface

- Root runtime exports for app, workspace, commands, plugins, settings, and
  shared models.
- Narrow subpaths for `app-database`, `vault`, `desktop-native`, `agent-tools`,
  `agent-skills`, `telemetry`, path helpers, workspace host integration, and the
  editor core/language-service surfaces.
- Peer dependencies for UI, Svelte, CodeMirror, Mira, and Design Core so hosts
  retain singleton control over their runtime stack.

## Usage

```ts
import "@lapis-notes/api";
import { App } from "@lapis-notes/api";
import { MemoryVaultAdapter } from "@lapis-notes/api/vault";
import type { AppDatabase } from "@lapis-notes/api/app-database";
```

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
