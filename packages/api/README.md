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

`@lapis-notes/api/registry/schema` provides catalog schemas, types, normalization,
media resolution, and structured release-note extraction for registry producers
and consumers. It imports only Zod and does not boot the application.
`@lapis-notes/api/build/vite` provides the portable Turso browser-build helper.

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
- [Canonical spec](../../spec/src/packages.md)
- [App state model](../../spec/src/packages/workspace-apis.md)

### Plugin file icons

File-view plugins may set `fileIcon` on `registerEditorView` contributions, or
pass `{ fileIcon }` as the third `registerExtensions` argument. The value is an
icon ID: built-in Lucide names, existing `addIcon` IDs, and registered icon-pack
entries work through the same resolver.

Use `const fileIcon = this.registerIcon("diagram", diagramSvg)` to register
custom SVG artwork in the owning App. The returned ID is namespaced and the
plugin automatically releases it on unload. `this.registerIconPack({ name,
icons })` or an asynchronous `loader` returns the owned pack prefix; reference
its entries as `prefix:icon`. Legacy global registrations retain their existing
shared-name behavior and caller-owned cleanup.

Explorer uses editor associations and pattern priority to choose the
contribution, then resolves artwork through `app.icons`. Pending, missing or
failed artwork retains the filename icon. Changes repaint existing rows;
rendering an icon never activates a plugin or constructs its file view.

### Versioned renderer builds

Use the public build adapter when producing renderer plugins or embedding their
npm exports in a Vite host. Pass the exact installed Svelte version; the generated
host catalog rejects unknown modules and incompatible compiler/runtime versions.

```ts
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { rendererHostModulePlugin } from "@lapis-notes/api/build/vite";

export default defineConfig({
  plugins: [
    rendererHostModulePlugin({ mode: "host", svelteVersion: "5.56.10" }),
    svelte(),
  ],
});
```

Plugin producers choose `mode: "plugin"` and let the adapter externalize Svelte
imports; do not pre-externalize them or copy private host build helpers. The
versioned providers retain the host's single Svelte runtime. Other imports still
need explicit host admission and the plugin's normal manifest audit.
