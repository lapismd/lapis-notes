# Workspace Shell / Catalog acceptance

Current framework dependency intake selects published Design Core `0.13.5`.
API, retained UI, Workspace and Web require `^0.13.5`; the separate App Profile
minimum remains `^0.13.4`. Root tooling and File Explorer resolve the same
registry identity within their existing ranges. Public exports, App ownership
and host lifecycle remain governed by this chapter; qualification is recorded
in [the Core intake receipt](../../records/2026-11-17-core-0135-intake.md).

Problems editor-demo acceptance under LN-WS-034/037 drains corrected edits and
fixture restoration through the editor writer. Spellcheck also verifies vault
content and absence of a retained file conflict before the story completes.

## LN-WS-010 — New workspace stories: include interaction and accessibility assertions, including theme-sensitive

<a id="ln-ws-010"></a>

**Requirement.** New workspace stories MUST include interaction and accessibility assertions, including theme-sensitive hover contrast for shell actions on sidebar-coloured surfaces and floating-window headers; they MUST carry `visual-pending` and ship nested-import Visual Delta baselines without rewriting existing API baselines.

## LN-WS-024 — Authored shell MDX: identify every scenario and render its canonical

<a id="ln-ws-024"></a>

**Requirement.** Authored shell MDX MUST identify every scenario and render its canonical Storybook description immediately before the corresponding canvas.

LN-CORE-027 editing recovery stories boot a real App and persisted shell, then
exercise the existing Problems collection/menu. Claim counts and local issue
changes remain ephemeral diagnostics; they do not become layout state or a
second file persistence owner.

The Mira 0.2 dependency intake preserves the released Design Core 0.13.2
workspace composition. Catalog qualification retains its existing functional,
interaction, accessibility and cold-start gates.
