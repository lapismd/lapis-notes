# Background network controls and v1 closure

LN-PLUG-141–143 v1 delivery is complete. Notes PR201 and package release PR202
published API0.6.15, Workspace0.4.11 and App Profile0.3.1. Server PR155/157
adopted the released graph and qualified authenticated controls, detach and cold
recovery. Desktop PR68 qualified native defaults and lifecycle with eleven
actual GTK/WebKit cases and complete source/catalog CI. The signed Tasks0.4.0
archive was exercised unchanged on both hosts and published through registry
PR210/211. Its SHA256 is
`04953bda8012f50263ac2224a649a64d0892a43b0a70cd6d92132985af2eee3b`. Earlier
receipts retain their original then-pending gates. Actual macOS alert delivery
and new network/credential capabilities have separate acceptance.

## Network and credential extension

LN-PLUG-145/146 add optional native protocol fields and explicit shared
controls. Origin, private-network and credential-binding grants start
unapproved. Native custody is scoped to the runner, vault, plugin and job. The
UI accepts write-only replacement/removal, clears submitted text and observes
configured/locked state. Neither snapshots nor transfer receipts accept stored
values. The guest receives only a native request method and opaque binding IDs;
Web gets no scheduler or network fallback.

Beancount's production plan is the reference for bank integration: native Rust
owns provider requests, credentials stay opaque and imports retain its reviewed,
revision-checked ledger boundary. This generic extension does not implement its
Monzo, Starling or Lunch Flow production backlog.

## Source qualification so far

All executable checks use Docker context `omarchy`.

- `pnpm test --filter=@lapis-notes/api --task-args src/lib/__tests__/background-jobs.test.ts`:
  thirteen passes, zero failures; native snapshots reject stored credential
  values.
- `pnpm test:storybook -- stories/workspace/BackgroundJobs.stories.ts`: six
  cold interaction/accessibility cases pass, including separate origin,
  private-network, opaque key replacement/removal, locked-custody controls and
  changed-code reapproval. The added reapproval case failed once before the
  fix (five passes, one failure), then all six passed on source
  `be8aa0c11cacd97c6635ad94ba586c703948920e` in retained Omarchy run
  `lapis-notes-validation-bbaed061-e5e0-4e35-b880-2e7ac6271116`.
  A local stdout collection error did not invalidate the worker's successful
  result; its result JSON and logs were recovered unchanged.
- The first API invocation passed the path as a Turbo task and ran no tests. The
  corrected attempt ran out of local space preparing its remote snapshot; the
  next exact corrected invocation passed. Those setup failures remain logged.

Publication, host generated-contract/source pinning and actual Server/Desktop
acceptance remain open. No visual baseline was changed;
stories retain `visual-pending`.

## Completed portable source lanes

The initial full Omarchy run passed `spec:check`, `check`, `test` and `build`.
Its carousel story failure and setup correction are retained in the
[carousel receipt](2026-11-26-registry-carousel-qualification.md). On source
`cec5e417b5992686883e629a5ebb93dc6740c967`, retained run
`lapis-notes-validation-4f804395-ad25-4e4a-8388-9e2273d0493a` then passed the
canonical four-shard `test:storybook`, `build-storybook` and
`validation:consumer-pack` lanes plus `spec:check`. The source unit regression
remains thirteen passes and the background-job story family six passes.
Publication and actual host adoption remain separate gates.
