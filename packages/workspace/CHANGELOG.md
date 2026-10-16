# @lapis-notes/workspace

## 0.2.2

### Patch Changes

- [#36](https://github.com/lapismd/lapis-notes/pull/36)
  [`17060a1`](https://github.com/lapismd/lapis-notes/commit/17060a1df152c9fc2302c93767cd7172868ff030)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Consume published Design
  Core 0.5.0 with prepared browser CSS and bundled font assets through normal
  npm ranges.
- Updated dependencies
  [[`17060a1`](https://github.com/lapismd/lapis-notes/commit/17060a1df152c9fc2302c93767cd7172868ff030)]:
  - @lapis-notes/api@0.1.5

## 0.2.1

### Patch Changes

- [#15](https://github.com/lapismd/lapis-notes/pull/15)
  [`57996c6`](https://github.com/lapismd/lapis-notes/commit/57996c6d26c1e7ed723df1291b415ee94d3a58e5)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Retain selected plugin
  releases in navigation and persisted Plugins views so application links can
  open a specific version. Fail closed for unavailable versions and keep
  historical installation bound to the selected release.

## 0.2.0

### Minor Changes

- [#4](https://github.com/lapismd/lapis-notes/pull/4)
  [`08a9e4b`](https://github.com/lapismd/lapis-notes/commit/08a9e4bc671c87484e1fbb7c3271b2aad3f176e5)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Add the Plugins workspace
  browser with a category homepage, update listings, responsive filters, and
  verified install/update actions shared with Settings. Settings Browse and
  Updates now open shared plugin details directly. Details include a Back
  action, fixed navigation, themed media, image loading and failure states,
  release notes, download counts, and linked authors.

### Patch Changes

- [#4](https://github.com/lapismd/lapis-notes/pull/4)
  [`c1ad3c4`](https://github.com/lapismd/lapis-notes/commit/c1ad3c4acee2eac1ae87c22f66e946d2e0db3bf2)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Require published Design
  Core 0.3.2 for native window-controls spacing, bold settings headings,
  selected-tab indicators and mobile shell teardown. Consume the npm release
  through portable semver ranges and lockfile integrity.

- Updated dependencies
  [[`39f886d`](https://github.com/lapismd/lapis-notes/commit/39f886d017a28d916b3f6cac7d08b7723a04f45b),
  [`c1ad3c4`](https://github.com/lapismd/lapis-notes/commit/c1ad3c4acee2eac1ae87c22f66e946d2e0db3bf2),
  [`1e949fc`](https://github.com/lapismd/lapis-notes/commit/1e949fc9d51b795a50760e1146a9599602746c6b)]:
  - @lapis-notes/api@0.1.2

## 0.1.1

### Patch Changes

- Support verified static V2 catalogs alongside Nostr sources, retain
  installation source provenance, and render themed registry images and
  structured release notes.
- Updated dependencies []:
  - @lapis-notes/api@0.1.1

## 0.1.0

### Minor Changes

- First public npm release of the Lapis Notes workspace shell that composes the
  API workspace model with Design Core layout presentation.
