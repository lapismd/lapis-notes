# Migration scope and active workspace refresh

The main Notes `MIGRATION.md` now leads with six remaining delivery stages,
R2–R7, concrete deliverables, current activity, completed foundation and explicit
deferrals. The 59-row generated ledger still groups gates and sorts spec-linked
task IDs, but is collapsed separately from historical Node/Deno intake.
Parent/source/child rows are not an estimate of independent remaining jobs.

The saved Rust plan now prefers parallel agents for independent ownership and
Docker-first portable validation, retaining actual OS/WebView qualification as
an explicit native lane. Docker testing does not activate the deferred Docker
agent-execution backend.

## Workspace audit

The referenced Codex thread's changes are already in Notes `e293bf8f`, Plugins
`6cfcb148` and jj-store `4e74e423`, all ancestors of their current default
workspaces. The active migration checkouts are those default workspaces;
Desktop and Tasks also use default. No rebase is needed to pick up those changes.
Historical feature/release workspaces are not rebased wholesale. Existing dirty
Plugins, jj-store and Notes native-source-pin work is preserved separately.
Desktop/Tasks tooling and the dependency refresh have their own implementation
lanes and evidence; this documentation commit does not qualify those changes.

## Validation

- Exact tracker regression before and after: 11 cases, zero failures.
- `pnpm spec:check` uses the default Docker runner on the configured remote
  `omarchy` daemon. All specification lanes and all 78 validator cases pass.
- Run receipt:
  `.local/validation/runs/lapis-notes-validation-427ed481-1c76-4fc5-9c00-773e0b7c6aad`.
- Focused Prettier and generated progress drift checks pass.

The separate [native chat receipt](2026-10-25-rust-chat-native-acceptance.md)
records committed Desktop `5f165fc9`; R2.2/R2.2.3 are Complete while R2.3 and
R3–R7 retain their original product gates. No publication, deployment, signing,
visual approval or default cutover is included.
