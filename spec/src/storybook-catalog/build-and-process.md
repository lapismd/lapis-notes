# Storybook Catalog / Build and process

The browser test cohort uses Storybook 10.6.5, Vitest/browser 5.0.5 and Vite 7.3.7, with the same interaction, axe and fatal-runtime gates. The former 4.1 runner’s final-file RPC disconnect remains recorded; current-tool acceptance must complete without debug hooks, traces or timing changes.

Normal interaction tests use addon-vitest’s automatic preview/addon annotation initialization exactly once. The setup retains its fatal Svelte diagnostic guard after story teardown; a temporary unnamed-button probe verifies that automatic axe checks reject violations.

Workspace pointer acceptance starts the already-installed Storybook graph through `storybook:installed`, preserving the exact registry/archive inputs. The normal catalog interaction CI lane includes this browser suite, including the shared Notes session remaining mounted after play completion. A single browser worker serializes cold source compilation and pointer gestures within the bounded validation container.

## LN-CAT-002 — @lapis-notes/ui family consumed by @lapis-notes/api (direct imports: have an API/&lt;Name&gt; Storybook story under stories/api/

<a id="ln-cat-002"></a>

**Requirement.** Every `@lapis-notes/ui` family consumed by `@lapis-notes/api` (direct imports; excluding type-only surfaces such as sheet `Side`) MUST have an `API/<Name>` Storybook story under `stories/api/` with a play that exercises meaningful behavior.

## LN-CAT-006 — Visual stories under API/: ship Visual Delta PNG baselines (baselinePathMode: nested-import)

<a id="ln-cat-006"></a>

**Requirement.** Visual stories under `API/` MUST ship Visual Delta PNG baselines (`baselinePathMode: nested-import`) tagged `visual-pending` until human review promotes them to `visual-approved`. Stories tagged `skip-visual` are exempt.

## LN-CAT-009 — Design Core styles and Lapis theme

<a id="ln-cat-009"></a>

**Requirement.** Storybook MUST load design-core `styles.css` + Lapis theme as style authority, import `@lapis-notes/ui/theme.css` (Obsidian alias tokens only), expose an Obsidian/Default brand selector with Obsidian initially selected, and expose design-core's independent light/dark colour-mode toggle. Host `@tailwindcss/vite` MAY remain for story/demo layout only — not for component paint.

## LN-CAT-060 — Focused Bases Editable Cells story: open Sort and Filter in the same

<a id="ln-cat-060"></a>

**Requirement.** The focused Bases Editable Cells story MUST open Sort and Filter in the same viewport and assert their computed outer widths match within sub-pixel tolerance.

## LN-CAT-066 — Storybook Vite: resolve @lapis-notes/ai/runtimes through the installed plugin package

<a id="ln-cat-066"></a>

**Requirement.** Storybook Vite MUST resolve `@lapis-notes/ai/runtimes` through the installed plugin package export.

## LN-CAT-116 — Generated-output watcher exclusions

<a id="ln-cat-116"></a>

**Requirement.** Storybook source watching MUST exclude generated book, build, cache, runtime-fixture, log, and test-output directories. Canonical Markdown and authored runtime and story sources MUST remain watched. Recursive checkout symlinks MUST NOT duplicate watched source trees. Compiled package or startup changes MUST receive a cold restart when required by the refresh policy.

## LN-CAT-117 — Portable development acceptance startup

<a id="ln-cat-117"></a>

**Requirement.** Development Storybook acceptance MUST start from the installed registry-compatible dependency graph without requiring sibling release artifacts. Preparing local plugin tarballs MUST remain an explicitly selected development preflight and MUST NOT run as a prerequisite of portable CI test-server startup.

API's patched Zod package retains its public `zod/v3` schema entry. The shared
development and browser-test optimization list includes that actual entry so
loading an editor story does not discover it late and reload the active test.

Private Docker validation supports `sshMultiplexing: false` when reusing an SSH
connection is unavailable. Direct SSH retains agent authentication, endpoint and
literal-argument checks, bounded connection attempts and Docker-only execution.
Default multiplexed operation and native-runtime selection remain unchanged.

An absolute private `sshControlPath` may reuse an already authenticated owned
connection. This changes connection reuse only, retaining the same endpoint,
agent credentials, source qualification and Docker-only runtime boundaries.
