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

Installed extensions may declare command-backed `ribbonItems` and
`markdownViewMenuItems` in `lapis.contributes`. Each entry supplies an `id`,
`title`, and owned manifest `command`; ribbon items also require an `icon`.
Markdown items accept optional `icon` and `section` fields. These controls remain
discoverable before runtime loading. Invoking one awaits owned activation,
then executes the registered command. Markdown actions retain their source
leaf and file while activation is pending. Disabled extensions remove their
discovery controls.

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

### Native editing-intent observation

Native hosts may implement `NativeEditingIntents.observe(invalidate, error)`.
Return an idempotent disposer, notify after registration and every reconnect or
missed notification, and report observation failures through `error`. The port
carries invalidations only; the existing App recovery controller lists current
claims and owns Problems recovery actions.

Shells share one observation per App. Supporting hosts avoid idle claim polling;
hosts without the optional method retain the existing polling behavior. Disposal
stops notifications and reconnection. Observing never recovers claims, discards
buffers or writes files.

## Plugin background jobs

Native Desktop and Server hosts accept opt-in `lapis.contributes.backgroundJobs`
manifest declarations. Bundle each declared `.js` entry as self-contained ESM
with a named `run` export; type-only imports disappear during bundling:

```ts
import type { BackgroundJobHandler } from "@lapis-notes/api/background-jobs";

export const run: BackgroundJobHandler = (context) => {
  const previous = context.state.load() as { date?: string } | null;
  if (previous?.date === context.localDate) return;
  context.notifications.notify({
    id: `daily-${context.localDate}`,
    message: "Your daily plugin check is complete.",
  });
  context.state.save({ date: context.localDate });
};
```

The matching declaration requests only the access the handler uses:

```json
{
  "backgroundJobs": [
    {
      "id": "daily-check",
      "title": "Daily check",
      "description": "Add a daily Lapis notification.",
      "entry": "jobs/daily-check.js",
      "schedule": {
        "kind": "daily",
        "hour": 9,
        "minute": 0,
        "timezone": "UTC"
      },
      "permissions": {
        "metadataRead": false,
        "frontmatterRead": false,
        "notifications": true,
        "frontmatterFields": []
      }
    }
  ]
}
```

Users approve capabilities and choose the time, timezone and runner in
Background jobs settings. Fixed intervals use `{ "kind": "interval", "seconds":
3600 }`. Run now shares native single-flight admission. Changing installed code
requires permission review again. Checkpoints stay private to the installation;
use the explicit handoff receipt to move them to another runner.

Each invocation has bounded memory, execution time and broker calls. The context
supports synchronous saved-metadata pages, version-guarded note-property changes,
private checkpoints and persistent Lapis notifications. It provides no DOM,
network, credentials, process access or module imports. Desktop work requires a
running Lapis process; Quit drains it. Server work continues after browser detach.
The Tasks plugin's overdue digest provides a complete bundled example.
