# Specification Governance / Requirement authoring

## LN-GOV-002 — Unique IDs and verification coverage

<a id="ln-gov-002"></a>

**Requirement.** Requirement IDs MUST be unique and each ID MUST appear in the verification matrix.

## LN-GOV-009 — Shell Docs and scenario-description guidance

<a id="ln-gov-009"></a>

**Requirement.** `AGENTS.md` MUST direct full-shell `Workspace/Shell`, `Workspace/Lapis Editor Demo`, and movable-panel Autodocs to the shared isolated 700px Docs height, require scoped removal of Storybook shell padding, and distinguish that documented viewport from the unconstrained full-screen story canvas. As a repository-wide story rule, it MUST require multi-scenario families with authored MDX to supply non-empty canonical story-description metadata, identify every scenario, and bind Storybook's Description block immediately before its Canvas rather than duplicating prose.

## LN-GOV-010 — One independently verifiable concern per ID

<a id="ln-gov-010"></a>

**Requirement.** Each requirement ID MUST describe one independently verifiable concern. Clauses that can fail independently, need different evidence, or evolve separately MUST use separate IDs.

## LN-GOV-011 — Introduced acceptance bullets

<a id="ln-gov-011"></a>

**Requirement.** One concern MAY retain several acceptance details under one ID. If it has three or more unordered details, the specification MUST use an introduced, ID-scoped bullet list instead of a dense sentence; bullets MUST NOT combine independently verifiable concerns.

## LN-GOV-012 — Contract preservation when splitting IDs

<a id="ln-gov-012"></a>

**Requirement.** A requirement split MUST preserve the original contract's scope, constraints, exceptions, and normative meaning. The original ID MUST remain with its primary concern; new concerns MUST use unused IDs, and the same change MUST update verification rows, cross-references, progress records, and agent guidance.

## LN-GOV-014 — Actionable validation diagnostics

<a id="ln-gov-014"></a>

**Requirement.** Every validation finding MUST include a stable error code, governing requirement ID, path, line, optional subject ID, and actionable message. Findings MUST be sorted deterministically.

## LN-GOV-015 — Requirement prose limits

<a id="ln-gov-015"></a>

**Requirement.** A requirement statement and each acceptance bullet MUST contain no more than 80 prose words and four sentences after Markdown syntax is removed.

## LN-GOV-016 — ID-scoped acceptance sections

<a id="ln-gov-016"></a>

**Requirement.** A declared acceptance section MUST use a `### Acceptance details` heading beneath its defining requirement, appear once for that ID, introduce an unordered list, and contain at least three bullets.

## LN-GOV-017 — Canonical validation coverage

<a id="ln-gov-017"></a>

**Requirement.** Specification validation MUST check canonical files, mdBook configuration, chapter indexing, local links, requirement structure, defined references, verification traceability, allowed statuses, evidence, and untracked generated output.

## LN-GOV-018 — Validation exit codes and counts

<a id="ln-gov-018"></a>

**Requirement.** Specification validation MUST exit `1` for findings and `2` for internal, parser, or version-control failures. A successful run MUST report validator, chapter, and requirement counts.

## LN-GOV-022 — Canonical requirement discovery

<a id="ln-gov-022"></a>

**Requirement.** Agent guidance MUST direct agents to `~/.agents/skills/spec-validator/SKILL.md` and prefer `pnpm spec:search` before any manual scan of `spec/src`. It MUST use `--semantic` for conceptual queries, require returned canonical sources to be read, and retain `rg` as the fallback only when QMD or its embedding model is unavailable.

## LN-GOV-024 — Markdown feature Settings guidance

<a id="ln-gov-024"></a>

**Requirement.** Agent guidance MUST require Markdown feature-presentation changes to preserve canonical child descriptors, flat configuration keys, and real-app persistence acceptance. It MUST direct agents to design-core's Boolean toggle-table contract instead of a stored object-grid collection.

## LN-GOV-025 — Problems source-ownership guidance

<a id="ln-gov-025"></a>

**Requirement.** Agent guidance MUST route reusable diagnostic and Problems-view work to the Workspace Shell Problems specification. It MUST preserve Design Core ownership of panel presentation, require stable hover handoff and styled inline-problem acceptance, and make Lapis adapters and providers read that contract before package-specific chapters.

## LN-GOV-036 — Explicit App ownership guidance

<a id="ln-gov-036"></a>

**Requirement.** `AGENTS.md` MUST require first-party App access through explicit injection, workspace ownership, or Svelte context. It MUST limit `globalThis.app` to the compatibility bridge and dedicated fallback acceptance, require the ownership audit in root check and spec-check, and require separately versioned first-party plugins to enforce the same boundary.

## LN-GOV-037 — View-command source audit

<a id="ln-gov-037"></a>

**Requirement.** The repository MUST run a local view-command audit that parses first-party TypeScript and Svelte scripts, rejects unclassified view registrations, maps its diagnostics to the Plugin Model access and opener requirements, and routes first-party plugin and Explorer source changes to that chapter.

## LN-GOV-039 — Records, archives, and living intake

<a id="ln-gov-039"></a>

**Requirement.** Supporting implementation records MUST live under `spec/records/`, and completed one-time plans MUST live under `spec/archive/`. Neither location is normative or indexed by `SUMMARY.md` or the QMD collection. Living intake MUST remain in root `MIGRATION.md`.

## LN-GOV-049 — Contract preservation during presentation changes

<a id="ln-gov-049"></a>

**Requirement.** A specification presentation migration MUST preserve existing requirement IDs, normative constraints, acceptance details, verification statuses, and evidence. Intentional documentation-governance changes MUST be identified separately and validated against a captured baseline.

## LN-GOV-051 — Migration tracker freshness

<a id="ln-gov-051"></a>

**Requirement.** Every verified slice commit MUST refresh root `MIGRATION.md` with current statuses, evidence and an explicit UTC date/time. Related consumer commits MUST be followed by a master-tracker refresh that distinguishes source qualification from host adoption. `AGENTS.md` MUST document this workflow.

While a slice is running, refresh its verified, running and waiting checkpoint
when validation or remaining work changes. Keep the visible timestamp current;
a generated milestone table alone does not describe active work.

The active Rust task tables are generated from `spec/migration-progress.json`
with `pnpm progress:generate`. Each nonempty gate status has its own table,
active gates come first and Complete comes last. Task IDs sort naturally and
link to their owning canonical spec. `pnpm check:progress` rejects stale tables,
invalid task metadata and broken spec links; normal and specification checks
run it. Update the ledger timestamp and the authored activity checkpoint before
regenerating. Historical intake remains outside the generated block.
The real-ledger regression checks only populated groups, in canonical order,
and verifies each task's status membership. Independent fixtures cover all five
populated statuses and a started/deferred plan with no Waiting tasks. Empty
groups stay omitted; no synthetic task substitutes for an absent status.
Routine ledger status, evidence and timestamp updates follow `MIGRATION.md`'s
documentation-only spec-first treatment and remain validated by
`check:progress`. Generator implementation changes still require this canonical
chapter; application implementation keeps its owning protected mappings.

The main Notes `default` workspace owns this master R0–R7 tracker. Desktop's
separate tracker owns M-series gates and directs shared-core activity here;
retained historical workspaces are not the active implementation checkout.
