# Shared search-highlight contrast

The retained desktop AI Catalog reproduced a dark highlighted match at 3.25:1
contrast on a hovered row, below WCAG AA's 4.5:1 text requirement. The shared
`@lapis-notes/ui` theme owns this paint (LN-UI-020).

`API/Search Highlight` exercises the public `useTextHighlight` helper and theme
tokens on normal, hovered and active rows over both workspace and sidebar
surfaces. Its Light case passed and Dark failed before the correction. Both
pass after reducing only dark yellow opacity from 42% to 24%; light defaults,
public token identities and consumer customization remain intact. No app-owned
CSS override or lowered accessibility threshold is used.

Verified so far:

- `STORYBOOK_PORT=7160 pnpm exec vitest run --project storybook stories/api/SearchHighlight.stories.ts`: 1 pass/1 fail before, 2 passes after.
- `pnpm --filter @lapis-notes/ui check`: strict Svelte/types and native CSS audit pass.
- `pnpm --filter @lapis-notes/ui test`: 15 passes.

- `pnpm check`: all 18 tasks pass, including strict types, ownership and metadata audits.
- `STORYBOOK_PORT=7160 pnpm test:storybook`: 261 interaction/axe cases pass over all four canonical shards (93 + 71 + 42 + 55).
- `pnpm test`: serialized rerun passes 1,734 cases with one existing skipped fixture. Two build-side helper suites repeat another 126 passing cases; these are not added to the unique count.

Retained failed attempts:

- The first full `pnpm test` overlapped dependency builds from other root lanes; API publint observed 38 missing output exports. The serialized unchanged target passes; no API implementation, exports, assertions or type gates were modified.
- The first `pnpm spec:check` rejected the missing mapped Packages chapter. Updated that chapter alongside the UI contract; the final unchanged spec check passes.
- Root Prettier had no Svelte parser for the new demo. Formatted that file with the desktop's installed Prettier Svelte plugin; no package or formatter configuration changed.

Final source qualification:

- `pnpm build`: all 10 tasks pass, including ordinary Web and frozen desktop builds.
- `STORYBOOK_PORT=7160 pnpm build-storybook`: static output and all 172 rendered specification chapters pass.
- `pnpm spec:check`: validation, mdBook, mapped spec-first, ownership and metadata audits pass; all 38 specification regression cases pass.

The source fix is qualified. Desktop public-archive acceptance is recorded in
lapis-desktop E-AI-015 after refreshing only the UI archive. No publication, signing, visual baseline update or
Deno-host change is part of this fix.
