# Declarative General CLI settings

The desktop CLI settings registration previously supplied a custom General
page. Its content bypassed Design Core's schema renderer and missed the normal
Advanced heading, card and setting row styling.

`@lapis-notes/ui/cli` now registers General with an Advanced group and a custom
field. The field presents the existing host-owned CLI actions; installation and
credentials remain outside the settings values.

Qualification:

- Focused registration test: 1 failure before (`page` was present), 2/2 pass
  after with the declarative group and no stored host value.
- `pnpm --filter @lapis-notes/ui check`: pass, 0 Svelte errors or warnings.
- `pnpm --filter @lapis-notes/ui test`: 17/17 pass.
- `pnpm spec:check`: pass.
- `pnpm build`: 9/9 tasks pass, including the UI package and Web consumer.
- `pnpm check`: 16/16 tasks pass.
- `pnpm test`: 16/16 tasks pass.
- `pnpm exec vitest run --project storybook stories/api/CliSettings.stories.ts`:
  6/6 CLI interactions pass.
- `pnpm test:storybook`: 6/6 Storybook tasks pass, including interaction and
  accessibility coverage.

Desktop adoption waits for the patch package release through its npm range.
