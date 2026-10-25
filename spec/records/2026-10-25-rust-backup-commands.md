# Shared backup host control

Parent: Notes `a466c8d4`. This is the native host-control prerequisite for
R1.3.10 Tauri adoption, reusing the existing `jj-vault::Backup` engine. It does
not implement a second coordinator or claim Desktop selection.

## Changes and exact acceptance

`Client::with_backup` admits service-owned command work. A native caller can
borrow the selected engine without owning its lifetime. Cancelling or ceasing
to poll the reply cannot cancel an accepted command or retain its work/engine
guard after completion. An observer still cannot close the owner by disposal.

`Client::stop_backup` is explicit disable, separate from observer detach. A
successful stop removes the drained engine and watch, permitting explicit
restart with the same retained history. Repeated/concurrent stops succeed;
failed final capture retains the original engine and status for repair/retry.

The selected provider forwards the existing history, adoption, sync and restore
methods directly to `NativeRepository`. Saved-file restore and AI Undo respect
unresolved editors. An optional installation-owned external file gate is taken
before the Core vault gate, matching native host file-publication order.

The exact target is:

```sh
CARGO_BUILD_JOBS=2 pnpm rust:core -- test -p lapis-app-core --test backup_commands --locked
```

Its initial compile fails with five missing command API errors. The first
implementation passes four command cases. Adding a consecutive-stop assertion
then makes
`explicit_disable_and_restart_keep_the_same_retained_history` fail once with
Unsupported / "Automatic backup has not started". Atomic slot selection repairs
it; the exact case passes. One intermediate borrow-check compilation failure is
repaired by retaining the selected owner while draining it.

The final exact target passes all six cases (1.48 seconds). It covers
cancellation, unpolled replies and controlled Quit,
concurrent/repeated disable and explicit restart, failed-disable repair/retry,
existing restore with dirty-editor refusal, and external host gate ordering.
The file-gate case releases its blocking holder before assertions and verifies
that ordinary Core reads remain available while capture waits.

The first failed-disable fixture replaced the root before admission and correctly
received an admission error, leaving status Ready. The final fixture instead
holds an admitted engine command, admits stop, then replaces the root before
releasing the engine. It tests failure of accepted final capture, retains the
Failed state and proves the same status stream reaches Closed after repair.
One test compilation error copying a non-Copy phase is also repaired.

## Qualification checkpoint

The exact six-case target passes. Final source qualification also passes:

- `CARGO_BUILD_JOBS=2 pnpm check`: all 20 package checking tasks, strict
  workspace/all-target Clippy, protocol drift, formatting and architecture gates.
- `CARGO_BUILD_JOBS=2 pnpm test`: 251 ordinary Rust cases, zero failures,
  five existing real-model cases explicitly ignored; all 20 package tasks pass.
  Unchanged JavaScript tasks use valid Turbo cache entries. Existing actual-model
  evidence remains unchanged; this slice does not alter inference.
- `CARGO_BUILD_JOBS=2 pnpm build`: native workspace and all 11 package builds.
- `pnpm spec:check`: configured specification lanes and all 49 validator
  regressions. Ten validators cover 176 chapters and 1,511 requirements.
- `pnpm --filter @lapis-notes/web test:e2e:rust-server`: one cold built-renderer
  login/open/edit/save/reload journey passes (9.0 seconds) against the rebuilt
  Rust server. Vite serves built assets; production Rust static delivery stays R7.

Full HTTP acceptance includes the real hosted backup detach/final-capture case.
No product UI or catalog presentation changed, so this Rust-only slice does not
repeat unrelated Storybook interactions. Desktop's exact headless consumer command also passes two cases:

```sh
CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --test core_file_service --locked
```

This rebuild takes 2m42s and the tests take 0.42s. The linker reports its existing
large `__eh_frame` compact-unwind warning; compilation and both cases succeed.
The consumer is Desktop's uncommitted database change `tnnyuvsv` on parent
`a5b936e0`, with clean `lapis-ai` source at `6548afe0`. This is compilation and
file-service compatibility, not database/backup adoption acceptance. No native
windows are opened. Tauri backup adoption remains unimplemented. Tauri backup selection/lifecycle, original
native application acceptance and the remaining hosted parity gates stay open.
The separate Desktop database slice still awaits disposition of its pre-existing
Markdown image failure. No `lapis-ai` or frozen Deno source changes.
