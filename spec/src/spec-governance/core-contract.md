# Specification Governance / Repository policy

## LN-GOV-006 — Governance tooling: fail closed when it cannot determine

<a id="ln-gov-006"></a>

**Requirement.** Governance tooling MUST fail closed when it cannot determine a trustworthy change set.

## LN-GOV-043 — AGENTS.md: require sibling lapis-plugin-\* Storybooks to follow

<a id="ln-gov-043"></a>

**Requirement.** `AGENTS.md` MUST require sibling `lapis-plugin-*` Storybooks to follow the same WorkspaceShell and six-placement panel contract as bundled plugins. It MUST forbid isolated pane stories and shell fallbacks, name Tasks Column Canvas as a Tasks-only exception, and point agents at the shared panel helpers plus History panel stories.
