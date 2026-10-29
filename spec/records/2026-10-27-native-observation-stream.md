# Native hosted observation and retained chat state

This main-workspace R7 slice follows the user's cutover-first instruction:
focused regressions before commit, final broad validation on the landed mains.
No default, container/deployment or complete cutover gate is claimed.

## Reproduction and implementation

Native exact target:

```sh
pnpm rust:core -- test -p lapis-server --test database_stream --locked -- --nocapture
```

Frozen23a2160b/deba705e reproduces zero passes/one404 failure. The new admitted
SSE route subscribes to the existing bounded native commit channel, validates
client/vault/generation and protocol/principal, and resets to the current revision
on initial/reconnected/lagged observation. Reader admission is bounded64 and
frames256KiB; oversized path sets become reset, never replayed mutations.

The first implementation1d4c8e28/142439a3 reports1pass/2fail: Axum adds no-cache
but the contract requires no-store; the protocol fixture also appended a second
header rather than presenting one wrong version. Set explicit no-store and send
one invalid header. The guard assertion stays409. Snapshotb165a435/6772ca1b
stops before tests on a missing mapped hosted chapter; the chapter is updated.

Frozen0a2388f9/0769c797 passes all5native cases: scoped commits and foreign-vault
isolation, protocol/Origin/scope/future-cursor rejection, reconnect reset without
replaying values, idle session revocation,64reader bound and passive shutdown.
It exits0/noOOM at2026-10-27T12:43:13UTC; progress127 and formatting pass with
zero tracked worker changes. Native receivers hold no work lease or writer.

The hosted provider replaces revision polling with one cancellable fetch reader.
It validates UTF8/framing/IDs/domain/path/revision bounds, reconnects using its
last revision, stops after permanent auth/protocol errors and aborts when the
last listener, view or admitted client closes. Native admission and principal
are revalidated before frames and while idle. No service scheduler is moved to
the browser.

Exact new reader target initially fails import resolution (one failed suite/no
cases). Reader3 plus provider4 pass after implementation; two reconnect/client
lifetime cases extend the reader to5. With existing HTTP client9 cases, all16
affected Web cases pass. Fresh owner builds and Web strict checks pass.

## Retained chat restoration repair

The previous combined native-profile browser run has5pass/6fail. Four failures
refuse shutdown with retained editor claims; tests must use real guarded disposal
before requesting a clean restart, preserving those guards. Both participant
failures lose their selected saved conversation after reload.

`pnpm --filter @lapis-notes/app-profile exec vitest run src/native-chat/view-state.test.ts`
reproduces0pass/1fail: pre-mount getState replaces saved conversation/scope with
undefined/empty presentation defaults. The view now retains those saved values
until a real selection exists. A second case proves an actual new draft clears
conversation identity intentionally. Exact2 and all37directly affected chat cases
pass; final original mounted participant/browser targets remain pending.

A local strict run first reports8errors because its existing AppProfile dist
predates the participant/queue contract. The required five-package source build
refresh passes, including public pack/type guards; Web strict then passes with
zero errors/warnings. No shim, alias or dependency source edit is used.

## Landed tooling closure

Main33846705/3e2e5a85 independently passes native delivery5, install-policy3,
complete validation72 and release101, zero tracked mutations. Effective security
override preservation repairs the original real Git guards; the former98/3
aggregate remains failed historically. Final broad/native/browser/container
qualification and temporary-workspace consolidation remain explicitly pending.
