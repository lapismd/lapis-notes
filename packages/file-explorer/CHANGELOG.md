# @lapis-notes/file-explorer

## 0.2.0

### Minor Changes

- [`55be8dc`](https://github.com/lapismd/lapis-notes/commit/55be8dce6f7b19b0e8036be86a3cf5305db25317)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Let file-view plugins
  contribute a fileIcon ID for their filename patterns or registered extensions.
  Add App-owned SVG and icon-pack registration with plugin lifecycle cleanup,
  preserve legacy icon registrations, and refresh Explorer artwork on editor,
  plugin and file changes.

  Release the scoped Design Core resolver first and raise the dependent minimum
  ranges to the releases containing these contracts before publishing consumers.

  Upgrade API-owned Zod to the patched package while retaining its public v3
  schema entry for compatibility.

### Patch Changes

- [`fbba8d4`](https://github.com/lapismd/lapis-notes/commit/fbba8d48498c34939fec475e6bed67a682045820)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Retain plugin-state and
  compatibility-file drafts through close and conflict recovery, drain admitted
  plugin/file operations before teardown, and preserve Properties mutations
  after initial read failures.

- [`d8946b9`](https://github.com/lapismd/lapis-notes/commit/d8946b941569484b813eb0c1e8b1c5729fffc1a7)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Add owned
  diagnostic-resource navigation and themed recovery-banner actions. Accept
  Design Core 0.5.1 alongside the existing 0.4 range.

- [`023259d`](https://github.com/lapismd/lapis-notes/commit/023259d96d4ff0414fec6427924ed917f89405a3)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Add an optional exclusive
  file-creation transport and route Explorer new-note actions through the
  FileManager creation intent. Preserve existing destinations on collisions and
  keep legacy Vault creation semantics explicit.

- [`717f0ff`](https://github.com/lapismd/lapis-notes/commit/717f0ff3956a5d33cba10311fca9c41a06e53b21)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Connect the existing
  Explorer file-drop surface to FileManager new-file creation. Preserve binary
  bytes and existing destinations, validate bounded input before reading it, and
  retain App admission through asynchronous import and projection.

- Require released Design Core 0.6 for the close-guard, plugin-flush and
  centered panel contracts used by current source. Retain portable registry
  dependency ranges when integrating the Node server and its shared application
  runtime.

- [`bac3e5e`](https://github.com/lapismd/lapis-notes/commit/bac3e5eda6f467dbc86ec88c9f27a275f2b27953)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Expose optional
  implemented system trash through the neutral native adapter with explicit
  unsupported fallback and validated acknowledgements. Attribute Explorer
  native/copy feedback to its owning App and reject unavailable clipboard
  support without reporting success.

- [`501c50e`](https://github.com/lapismd/lapis-notes/commit/501c50e049264560e13e29c75a74c089922c7297)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Project owned App notices
  through the existing workspace notification UI and retire their subscription
  on host disposal. Pass the explicit Explorer App when reporting file-action
  failures.

- [`98b333f`](https://github.com/lapismd/lapis-notes/commit/98b333f73ff5ba8d5f28c52e4e3a2ceaa5ade0fb)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Protect and flush
  registered file writers before FileManager trash or deletion, including folder
  descendants. Route Explorer deletion through that guard so failed writes
  retain the file and dirty draft until explicit recovery.
- Updated dependencies
  [[`bdd4923`](https://github.com/lapismd/lapis-notes/commit/bdd492357135de2cc0175fa42413709b2a38cd63),
  [`86e85f6`](https://github.com/lapismd/lapis-notes/commit/86e85f6e814430c1755147c913eb91090a439bf4),
  [`631aeec`](https://github.com/lapismd/lapis-notes/commit/631aeec539e2fb061dc80c5c3a30a248ee15c529),
  [`fdee7e4`](https://github.com/lapismd/lapis-notes/commit/fdee7e4defde17a1009e16138d78c93c3ead8e2f),
  [`a91d5e2`](https://github.com/lapismd/lapis-notes/commit/a91d5e2eb5ec037029f6a7a2df316a9bd9440af7),
  [`fbba8d4`](https://github.com/lapismd/lapis-notes/commit/fbba8d48498c34939fec475e6bed67a682045820),
  [`d8946b9`](https://github.com/lapismd/lapis-notes/commit/d8946b941569484b813eb0c1e8b1c5729fffc1a7),
  [`ebf033a`](https://github.com/lapismd/lapis-notes/commit/ebf033af0fc0752be5ce5ffa7d55784163d291b4),
  [`023259d`](https://github.com/lapismd/lapis-notes/commit/023259d96d4ff0414fec6427924ed917f89405a3),
  [`63a5e7f`](https://github.com/lapismd/lapis-notes/commit/63a5e7fe40eea45762b5842b588c742076c7dd1d),
  [`2bffe48`](https://github.com/lapismd/lapis-notes/commit/2bffe484b38761af197afe7ab9b0d7b3affb50d7),
  [`86f6316`](https://github.com/lapismd/lapis-notes/commit/86f63166c3d5be648c595ef4e230ea6c4081bc48),
  [`edf1d76`](https://github.com/lapismd/lapis-notes/commit/edf1d76f4f3aa0442c1d9153d812f29b7d14e5c2),
  [`b3be91d`](https://github.com/lapismd/lapis-notes/commit/b3be91daecbd43187bacf8cfdc39f8311d700720),
  [`5ef0a63`](https://github.com/lapismd/lapis-notes/commit/5ef0a6331c1b846b70357f990d919977a561112c),
  [`bac3e5e`](https://github.com/lapismd/lapis-notes/commit/bac3e5eda6f467dbc86ec88c9f27a275f2b27953),
  [`978b987`](https://github.com/lapismd/lapis-notes/commit/978b987ba4c95408a63e49fad11bc44bab020758),
  [`ad4490c`](https://github.com/lapismd/lapis-notes/commit/ad4490ca1cd808002765582a17a5c81fa5335e0d),
  [`74f544e`](https://github.com/lapismd/lapis-notes/commit/74f544e2aa8a967524c0c218f3db7e1a495a1a17),
  [`55be8dc`](https://github.com/lapismd/lapis-notes/commit/55be8dce6f7b19b0e8036be86a3cf5305db25317),
  [`501c50e`](https://github.com/lapismd/lapis-notes/commit/501c50e049264560e13e29c75a74c089922c7297),
  [`98b333f`](https://github.com/lapismd/lapis-notes/commit/98b333f73ff5ba8d5f28c52e4e3a2ceaa5ade0fb),
  [`535a6cc`](https://github.com/lapismd/lapis-notes/commit/535a6cc7b39f397cf8761a06db7b831386121928),
  [`8a27bc3`](https://github.com/lapismd/lapis-notes/commit/8a27bc36a7a7fa81594e517908a6f5ed8ca77313),
  [`109e208`](https://github.com/lapismd/lapis-notes/commit/109e208a63253dcc1a7abad3fd5a9b13c39d3def),
  [`1e64589`](https://github.com/lapismd/lapis-notes/commit/1e6458922b486c07f36a5bc7d85d020b5805cd49),
  [`f828eae`](https://github.com/lapismd/lapis-notes/commit/f828eaeba8411aa342d7ab4954393e84612af2f3)]:
  - @lapis-notes/api@0.2.0

## 0.1.3

### Patch Changes

- [#36](https://github.com/lapismd/lapis-notes/pull/36)
  [`17060a1`](https://github.com/lapismd/lapis-notes/commit/17060a1df152c9fc2302c93767cd7172868ff030)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Consume published Design
  Core 0.5.0 with prepared browser CSS and bundled font assets through normal
  npm ranges.
- Updated dependencies
  [[`17060a1`](https://github.com/lapismd/lapis-notes/commit/17060a1df152c9fc2302c93767cd7172868ff030)]:
  - @lapis-notes/api@0.1.5

## 0.1.2

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

- Reuse the active landing leaf when opening a file through File Explorer.

- Updated dependencies []:
  - @lapis-notes/api@0.1.1

## 0.1.0

### Minor Changes

- First public npm release of the reusable Lapis File Explorer plugin.
