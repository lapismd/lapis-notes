# App-owned search result providers

LN-SRCH-051 adds generic result registration beside existing document providers.
API owns registration/lifetime; domain providers retain target interpretation,
activation, optional context expansion and underlying data authority.

## Verification

- `pnpm --filter @lapis-notes/api exec vitest run src/lib/search-result-provider.test.ts`: 2 passed.
- `pnpm --filter @lapis-notes/api exec vitest run src/lib/search-result-provider.test.ts src/lib/__tests__/plugin.test.ts`: 23 passed.
- `pnpm --filter @lapis-notes/api check:types`: passed.
- `pnpm --filter @lapis-notes/api check:svelte`: zero errors/warnings.
- `pnpm --filter @lapis-notes/api build`: passed, including publint and packed declarations.
- Specification validation initially rejected a verification row separated from its table; the row was joined to that table.
- Spec-first initially required all owning chapters mapped to the App/Plugin public exports. Dedicated boundary confirmations now accompany the registry; existing database, Markdown, workspace and Problems contracts are unchanged.
- Focused specification and App ownership verification is recorded after these repairs.

## Delivery review

This is the first source slice of unified history Search. No history index,
Desktop provider or shared Search UI is qualified by these API results.
Desktop M14.6 remains open at its existing native gate. Full repository/browser,
provider, platform and publication lanes remain outside this focused slice.
Unrelated concurrent file-configuration changes are excluded from this commit.
