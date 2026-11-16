# @lapis-notes/app-profile

## 0.2.3

### Patch Changes

- [#136](https://github.com/lapismd/lapis-notes/pull/136)
  [`d51d6ac`](https://github.com/lapismd/lapis-notes/commit/d51d6acbabbbef1d6a04c187c696432705340661)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Fence and drain App-owned
  native Sync calls before session writer protection, restore live leases after
  refused leave, and await presentation transport detachment without closing
  native-owned work.

- [#139](https://github.com/lapismd/lapis-notes/pull/139)
  [`4e3407c`](https://github.com/lapismd/lapis-notes/commit/4e3407cac6daacecaea62618309e464a0517c2ab)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Expose a bounded
  startup-operation marker so pending vault discovery, Sync readiness and
  state-directory creation can be distinguished in browser acceptance
  diagnostics.
- Updated dependencies
  [[`d51d6ac`](https://github.com/lapismd/lapis-notes/commit/d51d6acbabbbef1d6a04c187c696432705340661)]:
  - @lapis-notes/api@0.6.6

## 0.2.2

### Patch Changes

- [#133](https://github.com/lapismd/lapis-notes/pull/133)
  [`ea9e45b`](https://github.com/lapismd/lapis-notes/commit/ea9e45b69f7d2dbf01404afa09894684881d16c0)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Consume History 0.5's
  passive native synchronization observer alongside shared repository remotes
  and credentials. Hosts retain transport, custody and native operation
  ownership.

## 0.2.1

### Patch Changes

- [#130](https://github.com/lapismd/lapis-notes/pull/130)
  [`6b2d021`](https://github.com/lapismd/lapis-notes/commit/6b2d021da8213bb73ba41ff795abd65f600a7dcb)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Qualify the shared
  application profile against the current published plugin cohort and byte-safe
  skill-management API.
- Updated dependencies
  [[`6b2d021`](https://github.com/lapismd/lapis-notes/commit/6b2d021da8213bb73ba41ff795abd65f600a7dcb)]:
  - @lapis-notes/api@0.6.5

## 0.2.0

### Minor Changes

- [#127](https://github.com/lapismd/lapis-notes/pull/127)
  [`40fd72e`](https://github.com/lapismd/lapis-notes/commit/40fd72ee9581ab804acbe1736a985d33e451c009)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Restore the complete
  shared workspace session and optional native Repository registration to built
  public exports. Consume the released API and History remotes cohort through
  normal registry ranges while retaining current browser appearance, native Chat
  startup/retry and guarded session lifetime.

### Patch Changes

- [#128](https://github.com/lapismd/lapis-notes/pull/128)
  [`acdb5bc`](https://github.com/lapismd/lapis-notes/commit/acdb5bc6a3636fd536b21eb3c1409ee3418f1e15)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Keep the mounted
  workspace inert and its session-ready marker false until initial layout
  projection and the host readiness callback finish.
- Updated dependencies
  [[`2645d4b`](https://github.com/lapismd/lapis-notes/commit/2645d4ba3689a6a153d8fe2face6773589ccb1c0)]:
  - @lapis-notes/api@0.6.4
  - @lapis-notes/workspace@0.4.6

## 0.1.0

- Prepare the shared Notes application profile and workspace session for public
  package consumption. Publication remains a separate release gate.
