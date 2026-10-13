# Specification Governance / Validation and CI

## LN-GOV-004 — Local gate: inspect the current VCS change (jj preferred

<a id="ln-gov-004"></a>

**Requirement.** The local gate MUST inspect the current VCS change (`jj` preferred, else git); CI MAY compare base and head revisions.

## LN-GOV-005 — Protected-change gate exclusions

<a id="ln-gov-005"></a>

**Requirement.** Tests, generated output, and ordinary story files MUST NOT satisfy or spuriously trigger the specification-first gate.

## LN-GOV-023 — Specification validation: inspect repository and authorized package-local Autodocs stories

<a id="ln-gov-023"></a>

**Requirement.** Specification validation MUST inspect repository and authorized package-local Autodocs stories that use demo, harness, or fixture render boundaries. They MUST resolve explicit `docs.source` code, language, and type fields without exposing story-only names or `args` as consumer usage.

## LN-GOV-027 — Roles package implementation and plugin-only Storybook changes: governed by the sibling repository's standalone specification

<a id="ln-gov-027"></a>

**Requirement.** Roles package implementation and plugin-only Storybook changes MUST be governed by the sibling repository's standalone specification rather than Lapis source paths.

## LN-GOV-029 — Agent guidance: require canonical movable-panel registrations to declare

<a id="ln-gov-029"></a>

**Requirement.** Agent guidance MUST require canonical movable-panel registrations to declare their opening commands together, while file-backed editor views use editor associations and compatibility aliases reuse canonical commands.
