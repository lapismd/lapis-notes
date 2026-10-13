# Storybook Catalog / Build and process

## LN-CAT-002 — @lapis-notes/ui family consumed by @lapis-notes/api (direct imports: have an API/&lt;Name&gt; Storybook story under stories/api/

<a id="ln-cat-002"></a>

**Requirement.** Every `@lapis-notes/ui` family consumed by `@lapis-notes/api` (direct imports; excluding type-only surfaces such as sheet `Side`) MUST have an `API/<Name>` Storybook story under `stories/api/` with a play that exercises meaningful behavior.

## LN-CAT-006 — Visual stories under API/: ship Visual Delta PNG baselines (baselinePathMode: nested-import)

<a id="ln-cat-006"></a>

**Requirement.** Visual stories under `API/` MUST ship Visual Delta PNG baselines (`baselinePathMode: nested-import`) tagged `visual-pending` until human review promotes them to `visual-approved`. Stories tagged `skip-visual` are exempt.

## LN-CAT-009 — Storybook: load design-core styles.css + Lapis theme as

<a id="ln-cat-009"></a>

**Requirement.** Storybook MUST load design-core `styles.css` + Lapis theme as style authority, import `@lapis-notes/ui/theme.css` (Obsidian alias tokens only), expose an Obsidian/Default brand selector with Obsidian initially selected, and expose design-core's independent light/dark colour-mode toggle. Host `@tailwindcss/vite` MAY remain for story/demo layout only — not for component paint.

## LN-CAT-060 — Focused Bases Editable Cells story: open Sort and Filter in the same

<a id="ln-cat-060"></a>

**Requirement.** The focused Bases Editable Cells story MUST open Sort and Filter in the same viewport and assert their computed outer widths match within sub-pixel tolerance.

## LN-CAT-066 — Storybook Vite: resolve @lapis-notes/ai/runtimes through the installed plugin package

<a id="ln-cat-066"></a>

**Requirement.** Storybook Vite MUST resolve `@lapis-notes/ai/runtimes` through the installed plugin package export.

## LN-CAT-116 — Generated output: exclude it from source watching

<a id="ln-cat-116"></a>

**Requirement.** Storybook source watching MUST exclude generated book, build, cache, runtime-fixture, log, and test-output directories. Canonical Markdown and authored runtime and story sources MUST remain watched. Compiled package or startup changes MUST receive a cold restart when required by the refresh policy.
