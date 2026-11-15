# Optional view state projection qualification

LN-WS-098 now compares live and persisted view state after omitting undefined
optional top-level fields. JSON removes those keys; equivalent projection must
retain the existing view and its pending interaction. Explicit changed values
still use the ordinary view transition.

The exact regression is
`pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/workspace.test.ts -t "preserves a view when projection omits undefined optional state"`.
Before the correction it failed once; afterward it passed once. The complete
API suite passes 1,804 tests. No assertions or timeouts were weakened.

With Node 24.10.0 and `LAPIS_NOTES_VALIDATION_RUNTIME=native`:

- `pnpm check`: 16 successful tasks, zero failures.
- `TURBO_CONCURRENCY=2 VITEST_MAX_WORKERS=2 pnpm test`: 16 successful tasks,
  zero failures. Earlier concurrent runs encountered a declaration-emission
  timeout; that exact test and the final full lane pass unchanged.
- `pnpm build`: 9 successful tasks, including public API packaging/publint and
  the Web application build.
- `pnpm test:storybook`: four cold bounded shards, 63 files and 282 interaction
  and accessibility cases passed, zero failures.
- `pnpm spec:check` and App ownership pass. Spec-validator doctor passes with
  the existing script-alias warning.

The direct consumer reproductions are the History repository stories for
multiple operation heads and recovery actions in Plugins. All 68 History cases
and the complete Plugins catalog (392 passed, 57 existing skips) pass against
the built public API archive, SHA-256
`1912572d28ba92e402033c11ad33bcf1efb171d7c410f4539615229c7c932641`.
An ignored pnpm hook supplies this temporary validation archive; committed
manifests and lockfiles continue to use registry ranges. Registry adoption,
host integration and deployment remain separate gates. No visual baseline was
changed.
