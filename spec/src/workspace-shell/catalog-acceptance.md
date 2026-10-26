# Workspace Shell / Catalog acceptance

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
