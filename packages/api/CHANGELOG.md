# @lapis-notes/api

## 0.1.2

### Patch Changes

- Use published Bits UI 2.19.5 so destroyed text-selection layers stop document pointer listeners before reading component-owned reactive state. Retain the existing approved Link Preview selection-probe and listener cleanup when refreshing the runtime.
- Require published Design Core 0.3.2 for native window-controls spacing, bold settings headings, selected-tab indicators and mobile shell teardown. Consume the npm release through portable semver ranges and lockfile integrity.
- Expose the existing optional App argument in the Notice declaration so app-owned callers can use the public constructor without falling back to compatibility state.

## 0.1.1

### Patch Changes

- Own the transport-neutral registry schema and portable Turso build helper,
  removing the Community dependency from static registry producers and hosts.

- Expose host-owned secure sync capabilities and controlled declarative plugin settings.

- Allow indexed consumers to select metadata fingerprint inputs. Preserve native
  filesystem error codes and reconcile files removed during startup as deletions
  while retaining unexpected read failures.

- Support verified static V2 catalogs alongside Nostr sources, retain installation
  source provenance, and render themed registry images and structured release notes.
- Updated dependencies []:
  - @lapis-notes/ui@0.1.1

## 0.1.0

### Minor Changes

- First public npm release of the Lapis Notes runtime kernel, including the app
  container, vault contracts, workspace model, plugin lifecycle, commands,
  settings, metadata, editor, telemetry, and agent-tool public subpaths.
