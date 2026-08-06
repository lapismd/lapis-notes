# UI Package Spec

Canonical rendered spec: [UI Package](../../spec/src/20-packages/ui/index.md).

## Purpose

`@lapis-notes/ui` is the reusable Svelte design-system package. It provides headless component wrappers, theme CSS, Tailwind utility integration, and small UI helpers for workspace and plugin packages.

## Current Functionality

- Development and test-time Vite resolution now forces first-party `@lapis-notes/*` imports, including UI self-import component subpaths, back to package source instead of the published `dist/` exports, and the repo-root `check:source-resolution` guard treats any `dist/` fallback as a contract violation. The UI package's Svelte/TypeScript check mirrors those self-import subpaths in `tsconfig.app.json` so clean workspaces do not need generated `dist/` declarations before validation.
- Exports layout primitives such as Accordion, Collapsible, Resizable, Sidebar, Sheet, and Card.
- The shared `Resizable.Handle` and sidebar `Rail` affordances keep their existing hit areas but now thicken the visible separator line from `2px` to `4px` and switch it to `var(--interactive-accent)` on hover and focus-visible.
- Exports an Item primitive with Root, Content, Title, Description, and Actions slots for shared list rows that need aligned trailing actions.
- Exports form controls such as Button, Input, Textarea, Checkbox, Switch, Slider, Select, Toggle, Toggle Group, Label, Search, and Color Picker. Neutral Button variants now use `--background-modifier-hover` for hover feedback, and Toggle/Toggle Group use `--background-modifier-hover` for hover plus `--background-modifier-active-hover` for pressed state so dark and light sidebars retain visible control contrast. The shared Slider wrapper now renders thumb labels as tooltip-like callouts with bottom arrows that appear on hover or focus so value readouts match the package's overlay styling language.
- Exports overlay and command primitives such as Dialog, Dropdown Menu, Context Menu, Popover, Hover Card, Tooltip, Modal, a shared Date Time Picker Dialog, Command, presentational Autocomplete building blocks (Root, List, Item, Empty, Footer) for standalone pickers, and Toaster-related dependencies.
- Exports data display primitives such as Table, Data Table, Badge, Progress, Skeleton, and Separator.
- Provides `cn()` class merging, shared Fuse.js search helpers (`fuzzySearch()` for batch filtering, `fuzzyMatchScore` / `createFuzzyMatchScore()` for per-item ranked filtering, and `commandFuzzyFilter` aliases for bits-ui Command `filter` props), bindable ref helpers, mobile media-query helpers, `theme.css`, `styles.css`, and `codemirror-autocomplete.css` (CodeMirror 6 completion tooltip chrome aligned with dialog/popover surfaces). Workspace-specific CodeMirror lint chrome lives in the workspace app stylesheet while consuming these shared theme tokens.
- `theme.css` is the canonical Obsidian-aligned shared theme entrypoint. It imports logically grouped partials from `src/lib/styles/theme/` for the light palette, dark overrides, semantic aliases, shared foundations, document/content roles, shared surface roles, and Tailwind bridge tokens. The combined theme still owns the shadcn/Tailwind palette, Obsidian compatibility aliases, the shared neutral compatibility ramp (`--color-base-*`), accent compatibility helpers, the blur/raised helper chain, form-field hover helpers, and shared state tokens such as selection, swatch, input-shadow, and menu-shadow values. Dark mode follows the attached Obsidian default ladder: `#1e1e1e` canvas, `#242424` alternate surface, `#262626` secondary/sidebar surfaces, `#363636` hairline/sidebar borders, `#3f3f3f` strong borders and sidebar hover surfaces, `#dadada` text, and `#b3b3b3` muted text; light mode remains supported as a restrained mirror and the shared theme resolves correctly for both `dark`/`light` and `theme-dark`/`theme-light` runtime class families.
- Shared components consume semantic theme variables and favor hairline borders, 4-8px radii, visible neutral hover states, and minimal shadows so workspace and plugin chrome inherit the same visual system.

## Package Boundary

The UI package owns reusable components and theme tokens only. It does not own app state, workspace layout decisions, plugin-specific selectors, command behavior, persistence, or runtime services.

## Build And Exports

The package builds with `svelte-package`, copies `theme.css`, `styles.css`, and `codemirror-autocomplete.css` into `dist`, and exposes component subpaths through package exports. Consumers import components directly or through the package index.

## Tests And Validation

Validation currently leans on `svelte-check`, TypeScript, package build, and downstream usage in workspace/plugin tests rather than a large dedicated UI test suite.
