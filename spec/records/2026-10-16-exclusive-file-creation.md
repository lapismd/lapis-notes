# Exclusive new-file creation

LN-PKG-178 and LN-PKG-179 source component. The native adapter exposes an
optional exclusive-create capability for complete text or binary bytes. Vault
admits the operation through IO, cache/tree projection and creation events;
FileManager creation intent chooses this boundary when advertised. Explorer
toolbar and landing actions use the intent owner. Unsupported legacy adapters
retain their existing low-level create behavior. An advertised but incomplete
port fails closed instead of silently falling back to overwriting.

## Exact and affected evidence

```sh
pnpm --filter @lapis-notes/api exec vitest run \
  src/lib/__tests__/exclusive-native-create.test.ts \
  src/lib/__tests__/new-file-creation.test.ts
```

Before implementation: seven failures. The first repaired run passes six cases
and exposes one case-local fixture assuming a microtask order. Waiting for its
actual IO gate with `vi.waitFor` preserves the assertion and passes all seven.
An additional incomplete-provider regression fails once before the correction
and passes afterward. It proves an advertised capability with no write port
cannot select the legacy overwrite path.

```sh
pnpm --filter @lapis-notes/api exec vitest run \
  src/lib/__tests__/exclusive-native-create.test.ts \
  src/lib/__tests__/new-file-creation.test.ts \
  src/lib/__tests__/vault.test.ts \
  src/lib/__tests__/pending-vault-operations.test.ts \
  src/lib/__tests__/file-manager.test.ts \
  src/lib/__tests__/desktop-native-storage.test.ts
```

All 34 affected cases in six files pass. Explorer's complete targeted package
suite passes 28 cases in eight files. API and Explorer `check` and normal
`build` pass, including zero Svelte diagnostics, publint and API built types.
The first specification validation reports one five-sentence requirement;
rephrase it into four sentences without removing constraints and rerun the
exact validator. Source specification and App ownership checks pass before
the source commit.
Node 26.9.0, pnpm 10.34.5, Vitest 4.1.11, macOS ARM64.

Consumer evidence belongs to Desktop E-CREATE-001 after packing fresh API and
Explorer public outputs. Shared API tests do not establish native no-replace
publication or the actual WebView flow.

## Scope and remaining lanes

Attachment import integration and App-owned external-change reconciliation
remain separate source boundaries. Under the session-only deferral, full
Notes, Storybook/accessibility, web and Desktop qualification runs after M7
implementation. The aggregate M4–M7 gates remain open. Deno host source stays
frozen; publication, signing, visual baselines and review profiles are unchanged.
