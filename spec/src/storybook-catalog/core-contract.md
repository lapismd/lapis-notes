# Storybook Catalog / Catalog policy

## LN-CAT-003 — Catalog metadata under stories/catalog/: list API UI verification ids, governing spec

<a id="ln-cat-003"></a>

**Requirement.** Catalog metadata under `stories/catalog/` MUST list API UI verification ids, governing spec links, public surfaces, and story ids.

## LN-CAT-005 — Shared shadcn families destined for design-core: Do not duplicate full design-core Storybook coverage

<a id="ln-cat-005"></a>

**Requirement.** Shared shadcn families destined for design-core SHOULD NOT duplicate full design-core Storybook coverage; document status in `MIGRATION.md`.

## LN-CAT-010 — Story / demo Svelte under stories/: use host Tailwind for layout; that usage

<a id="ln-cat-010"></a>

**Requirement.** Story / demo Svelte under `stories/` MAY use host Tailwind for layout; that usage MUST remain excluded from `pnpm check:no-tailwind`.
