# Specification Governance

Specification changes precede or accompany protected implementation changes.
The gate is package-aware: updating an unrelated chapter does not satisfy a
protected package change.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-GOV-001 | `spec/src` Markdown MUST be canonical, indexed once by `SUMMARY.md`, and buildable by mdBook. |
| LN-GOV-002 | Requirement IDs MUST be unique and each ID MUST appear in the verification matrix. |
| LN-GOV-003 | Protected implementation and configuration changes MUST update every mapped canonical chapter in the same logical change. |
| LN-GOV-004 | The local gate MUST inspect the current VCS change (`jj` preferred, else git); CI MAY compare base and head revisions. |
| LN-GOV-005 | Tests, generated output, and ordinary story files MUST NOT satisfy or spuriously trigger the specification-first gate. |
| LN-GOV-006 | Governance tooling MUST fail closed when it cannot determine a trustworthy change set. |
| LN-GOV-007 | Generated mdBook output under `spec/book/` MUST remain untracked. |

## Change map

| Protected area | Required chapter |
| --- | --- |
| `packages/api` source or manifest | `packages.md`, `architecture.md` |
| `packages/ui` source or manifest | `packages.md`, `ui-and-styling.md` |
| `packages/workspace` source or manifest | `packages.md`, `architecture.md`, `workspace-shell.md` |
| `packages/plugins/plugin-markdown` source, manifest, or `PARITY.md` | `markdown-plugin.md`, `packages.md`, `editor-demo.md` |
| Storybook infrastructure and catalog metadata | `storybook-catalog.md` |
| Root architecture / workspace / turbo manifests | `architecture.md`, `packages.md` |
| Governance scripts, `AGENTS.md`, `spec/book.toml` | `spec-governance.md` |

## Agent workflow

1. Inspect VCS status
2. Read mapped chapter + requirement IDs
3. Update requirements and verification before or with implementation
4. Add evidence (unit / story) as appropriate
5. Run `pnpm spec:first` and package checks
6. Commit the verified slice

`AGENTS.md` must stay aligned with architecture requirements (including
`@lapismd/design-core` as a sibling `file:` dependency, alias-only ui theme,
and `pnpm check:no-tailwind`) whenever onboarding guidance changes. Development
workflow guidance SHOULD match mira-mde: if the `jj` binary is available, use
the `jj-jujutsu` skill and Jujutsu for VCS inspection/diffs/commits instead of
Git, and commit verified work with a PR-quality message. Tooling guidance for
Storybook must note that `pnpm test:storybook` fails on axe violations
(`parameters.a11y.test: "error"`).
