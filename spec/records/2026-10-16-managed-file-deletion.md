# Protected managed deletion

Source component for LN-ARCH-145 and LN-EXP-008. FileManager trash now uses the
same App-owned writer guard as managed rename. Protection covers every registered
writer, including folder descendants and retired dirty contexts, through native
removal. Failed persistence or native IO remains visible and releases protection
for retry. Target retargeting after asynchronous admission rejects before IO.
Explorer delegates to FileManager instead of low-level Vault trash.

## Targeted source evidence

- `pnpm --filter @lapis-notes/api exec vitest run
src/lib/__tests__/file-manager-trash.test.ts`: four exact before failures; four
  after passes. They cover ordering/protection, failed descendant writes, source
  retargeting, native IO failure and explicit retry.
- `pnpm --filter @lapis-notes/api exec vitest run
src/lib/__tests__/file-manager-trash.test.ts
src/lib/__tests__/file-manager.test.ts
src/lib/__tests__/file-editing-sessions.test.ts
src/lib/__tests__/editor-rename-persistence.test.ts`: 38 affected cases pass in
  four files, without new filters or skips.
- `pnpm --filter @lapis-notes/file-explorer test`: 28 cases pass in eight files.
- `pnpm --filter @lapis-notes/api check` and
  `pnpm --filter @lapis-notes/file-explorer check`: native-CSS, strict Svelte and
  types pass; zero errors and warnings in both packages.
- Both packages' normal `build` lanes pass public packaging/publint; API also
  passes its built-package type contracts. The Explorer build follows API output.
- Specification, mapped chapters and one-to-one verification retain the normal
  gates. The Explorer/editor-demo/plugin-lifecycle annotations preserve source
  ownership; no Deno host source or public manifest dependency range changes.

Node 26.9.0, pnpm 10.34.5, Vitest 4.1.11, macOS ARM64. Source and consumer
results remain distinct. Desktop records the actual WebView before failure:
with a retained dirty conflict, Explorer deletes the physical note despite its
failed writer. Cold acceptance with the verified repaired archives is pending.
The embedded native driver's right-click does not dispatch `contextmenu`, so
that fixture opens the real Bits UI menu with an explicit contextmenu event and
clicks its actual Delete item; no alternate action or test-only delete hook is
introduced.

## Remaining qualification

Complete the Desktop exact native reproduction and related conflict/teardown
acceptance. Full Notes, affected Storybook/accessibility, web and Tauri suites
remain session-deferred until M7 implementation completes. No original M5 gate
is waived; watching/App reconciliation, exclusive creation, native file actions
and HTTP representation qualification remain open. Publication, signing and
visual baselines remain deferred; the ordinary review vault/profile is preserved.
