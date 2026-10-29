# Watch registration readiness

LN-PKG-177 closes the gap between asynchronous native registration and an
App-owned initial reconciliation. The optional public `ready` promise resolves
after registration; DirectoryWatcher and array subscriptions preserve it.
Existing adapters without readiness remain source-compatible. The Deno host is
frozen and unchanged.

`pnpm --filter @lapis-notes/api exec vitest run
src/lib/__tests__/directory-watcher.test.ts -t 'registration readiness'` has one
before failure: the subscription reports ready before native registration.
After the source fix, the same case passes. The final affected command is:

```sh
pnpm --filter @lapis-notes/api exec vitest run \
  src/lib/__tests__/directory-watcher.test.ts \
  src/lib/__tests__/native-watch-adapter.test.ts \
  src/lib/__tests__/browser-storage.test.ts \
  src/lib/__tests__/desktop-native-storage.test.ts
```

All 52 cases pass across four files, including pending/rejected native readiness,
array preservation and all previous retirement/polling/native storage cases.
`pnpm --filter @lapis-notes/api check` and `build` pass their normal strict
Svelte/types, native-CSS, public-package/publint and built-type contracts.
`pnpm spec:first` and `pnpm spec:validate` retain the existing mapping and
verification gates. Node 26.9.0, pnpm 10.34.5, Vitest 4.1.11, macOS ARM64.

Full Notes, affected Storybook/accessibility, web and Tauri qualification remains
session-deferred until M7 implementation completes. Desktop records native
start/stop and consumer archive evidence separately. This small source component
does not qualify App reconciliation or complete M5. Signing/publication remain
deferred; no visual baselines change.
