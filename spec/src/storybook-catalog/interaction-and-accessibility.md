# Storybook Catalog / Interaction and accessibility

## LN-CAT-007 — Interactive plays: assert outcomes via a demo status surface

<a id="ln-cat-007"></a>

**Requirement.** Interactive plays MUST assert outcomes via a demo status surface (`data-testid="api-ui-status"`) and use `storybook/test` helpers; portaled overlays MUST assert against `canvasElement.ownerDocument.body`.

## LN-CAT-008 — Storybook accessibility checks: fail pnpm test:storybook on axe violations: .storybook/vitest.setup.ts

<a id="ln-cat-008"></a>

**Requirement.** Storybook accessibility checks MUST fail `pnpm test:storybook` on axe violations: `.storybook/vitest.setup.ts` registers `@storybook/addon-a11y/preview`, and preview sets `parameters.a11y.test: "error"`.

## LN-CAT-079 — AI Chat: provide independent deterministic stories for requested

<a id="ln-cat-079"></a>

**Requirement.** AI Chat MUST provide independent deterministic stories for requested and accepted permissions, asked and answered questions, running/succeeded/failed tools, socket validation, failed response retry, and a rich response with thinking, usage, copy, attachments, timestamps, and filtered provider bookkeeping. Each state MUST retain public Show Code, interaction coverage, and an unapproved visual path.

## LN-CAT-104 — Populated Plugin Management stories: assert the shared wrapping title-and-chip flow, trailing

<a id="ln-cat-104"></a>

**Requirement.** Populated Plugin Management stories MUST assert the shared wrapping title-and-chip flow, trailing top-right version, visible neutral chips, and icon-backed Web and Desktop chips across Browse, Installed, and Updates. Detail interaction MUST assert the thumb-free resize separator and selected-result ring.
