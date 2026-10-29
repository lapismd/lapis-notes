# Shared desktop presentation qualification

The user requests the existing Deno screens and styling in Tauri. The private
Deno chooser and branded startup are moved to public Workspace components;
both native hosts consume them. Native CSS replaces the chooser's utility
strings with the same layout, spacing, labels and Design Core controls.

The host injects profile storage and native actions. Deno retains its existing
profile operations; Tauri exposes only supported actions. Both retain search,
appearance, branding and drag exclusions. Tauri chooses and opens Notes directly.

## Before and exact source evidence

- `pnpm --filter @lapis-notes/workspace test src/lib/desktop-presentation.test.ts`:
  four failures before public extraction, then four passes.
- `pnpm --filter @lapis-notes/desktop-deno test src/desktop-window-drag.test.ts
src/desktop-workspace-startup.test.ts`: two passes.
- Initial Workspace check finds two missing SVG type declarations. Use Vite's
  asset types in the owning package; the exact check then passes without warnings.
- Initial root check finds one private LauncherStatus re-export error. Deno now
  imports the public component and status type directly; final root check passes
  all 18 tasks.
- The first focused Storybook run has one import failure after late Lucide
  optimization and two passing startup cases. Declare the six new imports in
  the existing optimization list; no aliases or dependency edits are used.
- Cold interaction run has two failures: recent search has a default command-menu
  accessible name; the next story also encounters its open overlay. Use the
  public Command View Root label for the original search name. Exact recent
  search then passes. A subsequent seven-case run has one overlay-close timing
  failure; await actual overlay release before completing each owning play.
  Final cold focused interaction/axe run passes all seven cases.
- Running root check and test together races their shared dist generation and
  produces one Workspace publint failure. Run the canonical lanes sequentially;
  final root check, test and build pass (18, 18 and 10 tasks respectively).

## Final qualification

Pending complete Storybook, packaged Deno, web/server and native Tauri acceptance.
No visual baselines are changed. Publication and distribution signing remain
explicitly deferred. M4 remains incomplete until Properties/metadata writers and
the full writer audit are qualified.
