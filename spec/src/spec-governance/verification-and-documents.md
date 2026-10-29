# Specification Governance / Verification and documents

Hosted CORE verification now has its own table, preserving exactly one row
per requirement while keeping each canonical page within its byte budget.

## LN-GOV-001 — Spec/src Markdown: canonical, indexed once by SUMMARY.md, and buildable

<a id="ln-gov-001"></a>

**Requirement.** `spec/src` Markdown MUST be canonical, indexed once by `SUMMARY.md`, and buildable by mdBook.

## LN-GOV-007 — Generated mdBook output under spec/book/: remain untracked

<a id="ln-gov-007"></a>

**Requirement.** Generated mdBook output under `spec/book/` MUST remain untracked.

## LN-GOV-008 — AGENTS.md: route reusable panel work to workspace-shell/panels.md, specialist

<a id="ln-gov-008"></a>

**Requirement.** `AGENTS.md` MUST route reusable panel work to `workspace-shell/panels.md`, specialist behavior to its owning Markdown panel page, and identify the shared panel helpers and All Properties stories as the implementation reference.

## LN-GOV-019 — Spec:check: run configured validation before mdBook and spec-first

<a id="ln-gov-019"></a>

**Requirement.** `spec:check` MUST run configured validation before mdBook and spec-first checks. Root `check` MUST validate the specification before package checks, while reusable validator regression tests MUST remain owned by `@lapismd/spec-validator` rather than copied into Lapis.

## LN-GOV-028 — Agent guidance: keep CV Markdown mode and form disclosure

<a id="ln-gov-028"></a>

**Requirement.** Agent guidance MUST keep CV Markdown mode and form disclosure actions grouped in the main toolbar immediately after YAML with the shared outlined icon treatment. Form-area scrolling guidance MUST remain limited to tabs and contextual form actions.

## LN-GOV-048 — Canonical page size limits

<a id="ln-gov-048"></a>

**Requirement.** Every canonical specification Markdown page MUST stay within 400 physical lines and 32,768 UTF-8 bytes, including topic indexes and verification pages.
