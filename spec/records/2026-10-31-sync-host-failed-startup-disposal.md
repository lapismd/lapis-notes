# Sync host cleanup after failed initialization

Owner: API `SyncHostService`. Contract: LN-ARCH-118. Consumer: Lapis Desktop
revoked-vault native close. Public exports and signatures remain unchanged.

Desktop's cold diagnostic confirms that Terminal's authoritative scoped release
and every plugin unload succeed. `SyncHostService.dispose()` then repeats an
earlier native `Vault folder changed; select it again` initialization failure.
Its cached rejected disposal prevents a guarded retry from completing. The
original native assertion requires normal exit within ten seconds; no deadline,
permission, assertion or cleanup failure has been waived.

Resource disposal now waits for initialization and admitted file events to
settle independently of readiness success. `ready()` retains its original
failure. Runtime revocation, late-result rejection and delegated cleanup still
run, and real cleanup failures still reject disposal. No operation reacquires a
revoked vault or retries a failed write.

## Source regression and checks

- `pnpm --filter @lapis-notes/api exec vitest run
src/lib/__tests__/sync-host-disposal.test.ts`: corrected source reproduction
  **1 failure, 1 pass** before implementation, then **2 passes**. The first
  test-authoring attempt expected the wrong revoked-runtime message; it was
  corrected to the existing exact contract before reproducing the defect.
- The exact two cases plus startup ordering, delegated security and local
  provider families: **36 passes**. Negative control retains delegated cleanup
  failure after failed initialization.
- `pnpm --filter @lapis-notes/api test`: **170 files, 1,725 tests pass**.
- `LAPIS_NOTES_VALIDATION_RUNTIME=native pnpm --filter @lapis-notes/api check`:
  **zero errors or warnings**, TypeScript passes.
- The first package-check dispatch encountered a stale Docker lease before
  source checking. Every owned worker was confirmed exited; the repository's
  scoped `releaseLease` mechanism safely released the lease. No worker or cache
  was deleted. The explicit native package check is separate from Docker parity.
- Latest registry Spec Validator is 0.2.0, matching the repository dependency.
  Doctor passes and semantic QMD search succeeds. Specification mirrors refresh
  through the existing generator.
- The first specification attempt rejected a five-sentence requirement. The
  retained concerns now fit the four-sentence contract without losing any
  constraint. Spec-first then required the mapped package lifecycle chapter;
  it now references LN-ARCH-118.

## Remaining qualification

The first shared Docker aggregate stopped before starting a worker because its
image selector still required the removed root `Cargo.lock`. A focused selector
regression reproduces one failure. The framework aggregates now select the UI
image, consistent with native-service source ownership in lapis-server; explicit
native lane selection is unchanged. Validate the exact selector and its complete
runner regression suite, then rerun the original Docker aggregate. This is an
owning-tool repair, without a host fallback.

The selector regression now passes; all **46 validation-runner tests pass**.
API packaging, publint and packed declaration checks also pass.

Public API packaging, publint, packed declarations and all six specification
lanes pass, along with the App/source audits and 67 specification regressions.
The registry-only Docker check/test/build aggregate passes all 16 check tasks,
16 test tasks (2,050 tests) and nine build tasks. Its immutable snapshot is
`e42571e91f2a451b5cb12fd8d99612714020d1fa`. The source change retains the
parent's generated host-module registry rather than including unrelated version
metadata churn; normal prepack still refreshes that metadata from the versioned
package manifests. Later authored changes refine mapped contracts and evidence.
Reports remain in `.local/validation/runs/` under
`lapis-notes-validation-83c0de4e-356d-4a49-b30b-113b4e6dd287`.

Full cold registry-only Storybook passes **268 cases across 61 files**, with
zero failures, errors or skipped cases. Shards pass 98/67/46/57 cases, each with
a real task-cache miss and live browser execution. Its source is
`601884d75d2d4d27cdaa386afe4557dc79fdde23`; collected proof is
`lapis-notes-validation-3469bc9e-9ef2-4017-99db-4adc3a0be39c/result.json` and
four JUnit receipts under that run's `.release_ci-results/` directory. Both
Docker runs use four CPUs, 12 GiB RAM and the pinned UI image
`sha256:a4ffd16112f050b63d0e53c22ce7f6e8790872c0cdcfb2d8c85d5a6df0bc8345`.

Read-only lifecycle review confirms that runtime invalidation and observation
stop remain synchronous; cleanup drains fully and genuine failures remain
blocking. `ready()` retains its original failure. A never-settling startup still
delays disposal, preserving the existing drain boundary.

The Changeset plan contains only public API 0.2.1 to 0.2.2. Publish through its
governed PR and verify the actual registry artifact, then rebuild and cold-test
the original Desktop consumer.
The current source result does not qualify a Desktop merge or distribution.

Desktop retains failed attempts and passive diagnostic roots in E-CI-013. Its
temporary stage logging is restored and will not enter the source change.
