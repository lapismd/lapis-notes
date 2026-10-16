# Native system trash and owned Explorer feedback

LN-PKG-184 and LN-EXP-009 source component. Native adapters expose system trash
only when advertised by an implemented host. They normalize the admitted path,
reject root removal, validate boolean acknowledgement and return explicit
unavailability for absent capability or ENOTSUP. Other native errors propagate
without local fallback. Existing Vault projection does not delete a handled
item twice and preserves unrelated canonical resources.

Explorer's existing menu and controller actions now pass their owning App to
all copy and OS-action notices. Missing clipboard support rejects before any
success notice. Existing UI callers report that failure through the same App;
M7 still owns native clipboard implementation.

## Exact and affected evidence

`pnpm --filter @lapis-notes/api exec vitest run
src/lib/__tests__/native-system-trash.test.ts` initially passes two cases and
fails three: no capability/invocation, no provider-error distinction and no
root rejection. The initial repaired five cases pass. An added invalid-native-
acknowledgement regression fails once; validate the response rather than treating
an object as success. The final exact file passes all six cases.

```sh
pnpm --filter @lapis-notes/api exec vitest run \
  src/lib/__tests__/native-system-trash.test.ts \
  src/lib/__tests__/desktop-native-storage.test.ts \
  src/lib/__tests__/vault.test.ts \
  src/lib/__tests__/vault-reconciliation.test.ts \
  src/lib/__tests__/file-manager-trash.test.ts
```

All 35 affected cases in five files pass. API strict `check`, normal public
`build`, publint and built type contracts pass with zero Svelte diagnostics.

`pnpm --filter @lapis-notes/file-explorer exec vitest run
src/lib/native-explorer-actions.test.ts` reports three before failures and four
passes. All seven pass after explicit App feedback and truthful clipboard
availability. The complete Explorer package suite passes 31 cases in eight
files; its strict check and normal build/publint pass after API output refresh.

Canonical validation (1,472 requirements), spec-first, App ownership and changed
source/document formatting pass before the source commit. Node 26.9.0,
pnpm 10.34.5, Vitest 4.1.11, macOS ARM64. Logs remain in ignored
`.local/m5-actions`.

## Consumer and remaining qualification

Desktop owns admitted physical identity, OS dispatch, capability advertisement
and actual native acceptance. Pack fresh API and Explorer public outputs before
consumer types/build/UI tests. Preserve a separate explicit-unavailable native
scenario for local-trash fallback, and qualify real system trash independently.
This source record alone does not establish Finder/default-app dispatch or an
OS-trash move.

After M7 implementation, run all session-deferred full source, Storybook/axe,
web and Desktop lanes and original M4–M7 gates. Deno host source is frozen;
publication, signing, baselines and ordinary review profiles are unchanged.
