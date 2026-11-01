# @lapis-notes/workspace

## 0.3.2

### Patch Changes

- [#60](https://github.com/lapismd/lapis-notes/pull/60)
  [`fb2eff2`](https://github.com/lapismd/lapis-notes/commit/fb2eff2b11b4a623ea2780f5e3e0f92a0530844b)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Expose the explicit
  Notebook Design Core/UI host modules and admit Design Core 0.9 compatibility,
  including File Explorer so the host resolves one shared Core installation.
  This changes generated host admission metadata and dependency compatibility,
  not the API runtime interface; retain the 0.2 API peer cohort. Full host
  qualification remains required before release.

  Add a public Vite renderer adapter that binds plugin compiler imports to the
  admitted versioned Svelte namespace and resolves those entries through the
  shared host runtime. Expose the required Markdown and CodeMirror host modules
  while keeping private imports and renderer version mismatches rejected.
- Updated dependencies
  [[`fb2eff2`](https://github.com/lapismd/lapis-notes/commit/fb2eff2b11b4a623ea2780f5e3e0f92a0530844b)]:
  - @lapis-notes/api@0.2.4
  - @lapis-notes/ui@0.1.6

## 0.3.1

### Patch Changes

- [#44](https://github.com/lapismd/lapis-notes/pull/44)
  [`f2373ba`](https://github.com/lapismd/lapis-notes/commit/f2373baf79db19267f3422895ce321ef1fa3c78d)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Point package
  documentation to the canonical specification and remove stale package-local
  and pre-consolidation specification links.

- [#47](https://github.com/lapismd/lapis-notes/pull/47)
  [`6f315ba`](https://github.com/lapismd/lapis-notes/commit/6f315baef2bd2f0bb4942927d4e19b9e0eb2a15d)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Restore explicit
  disk-version acceptance in the shared retained conflict review, including
  preserving deletion through the captured guarded writer decision.
- Updated dependencies
  [[`f2373ba`](https://github.com/lapismd/lapis-notes/commit/f2373baf79db19267f3422895ce321ef1fa3c78d)]:
  - @lapis-notes/api@0.2.1
  - @lapis-notes/ui@0.1.5

## 0.3.0

### Minor Changes

- [`535a6cc`](https://github.com/lapismd/lapis-notes/commit/535a6cc7b39f397cf8761a06db7b831386121928)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Share the existing
  desktop vault chooser and branded startup presentation across native hosts,
  with injected profile storage and native actions.

- [`fc3ecdf`](https://github.com/lapismd/lapis-notes/commit/fc3ecdf374005e3c2e960af7d84709b92803537a)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Share the retained
  text-conflict presentation through the App-owned `bindFileConflictReviews`
  binding: one reference-counted lease for WorkspaceShell mounts and early host
  surfaces captured writer conflicts as Problems diagnostics and a three-way
  MergeEditor review leaf whose saves and refreshes run through the writer-owned
  captured actions (LN-WS-102–104).

### Patch Changes

- [`4cdbb7b`](https://github.com/lapismd/lapis-notes/commit/4cdbb7b09f2875d413bf0e3fa054ed16345866a8)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Expose the existing
  desktop Safe Mode recovery presentation through shared, host-controlled
  callbacks for Tauri.

- [`d8946b9`](https://github.com/lapismd/lapis-notes/commit/d8946b941569484b813eb0c1e8b1c5729fffc1a7)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Add owned
  diagnostic-resource navigation and themed recovery-banner actions. Accept
  Design Core 0.5.1 alongside the existing 0.4 range.

- Require released Design Core 0.6 for the close-guard, plugin-flush and
  centered panel contracts used by current source. Retain portable registry
  dependency ranges for the shared application runtime.
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
  - @lapis-notes/ui@0.1.4

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
