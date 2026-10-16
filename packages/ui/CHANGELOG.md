# @lapis-notes/ui

## 0.1.4

### Patch Changes

- [#36](https://github.com/lapismd/lapis-notes/pull/36)
  [`17060a1`](https://github.com/lapismd/lapis-notes/commit/17060a1df152c9fc2302c93767cd7172868ff030)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Consume published Design
  Core 0.5.0 with prepared browser CSS and bundled font assets through normal
  npm ranges.

## 0.1.3

### Patch Changes

- [#32](https://github.com/lapismd/lapis-notes/pull/32)
  [`c500f3e`](https://github.com/lapismd/lapis-notes/commit/c500f3e6530fd3b55425f9cab7bb9186f7fdb237)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Install the retained UI's
  clsx, tailwind-merge, Bits UI, and icon dependencies for package consumers.
  Clean applications can import the published UI without relying on development
  dependencies or accidentally hoisted copies.

## 0.1.2

### Patch Changes

- [#4](https://github.com/lapismd/lapis-notes/pull/4)
  [`39f886d`](https://github.com/lapismd/lapis-notes/commit/39f886d017a28d916b3f6cac7d08b7723a04f45b)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Use published Bits UI
  2.19.5 so destroyed text-selection layers stop document pointer listeners
  before reading component-owned reactive state.

  Retain the existing approved Link Preview selection-probe and listener cleanup
  when refreshing the runtime.

- [#4](https://github.com/lapismd/lapis-notes/pull/4)
  [`c1ad3c4`](https://github.com/lapismd/lapis-notes/commit/c1ad3c4acee2eac1ae87c22f66e946d2e0db3bf2)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Require published Design
  Core 0.3.2 for native window-controls spacing, bold settings headings,
  selected-tab indicators and mobile shell teardown. Consume the npm release
  through portable semver ranges and lockfile integrity.

## 0.1.1

### Patch Changes

- Define accessible shared search-highlight theme tokens for plugin-owned
  matches.

## 0.1.0

### Minor Changes

- First public npm release of the Lapis Notes Svelte UI primitives, including
  shared search, modal, confirmation dialog, sidebar customisation, table drag
  and drop helpers, and package CSS entrypoints.
