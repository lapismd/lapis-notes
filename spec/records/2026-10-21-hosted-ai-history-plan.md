# Hosted AI and history plan

Recorded 2026-10-21 for slice H00. Product implementation and qualification are
tracked separately in [MIGRATION.md](../../MIGRATION.md). The complete agreed
scope is [AI_HISTORY_PARITY_PLAN.md](../../AI_HISTORY_PARITY_PLAN.md).

## Decisions and baseline

One authenticated owner, multiple managed vaults, all memory vault-visible and
host agent execution first. The future Docker backend shares an execution port;
Docker implementation is deferred. Accepted turns survive browser disconnects.
Node retains HTTP and application policy; shared native services are extracted
from existing history/AI adapters and consumed through private bounded IPC.

Notes main is based on `ce1a786e`; the qualified Node workspace is based on
`953d673b` and has not been integrated into current main. Desktop `8990cb57`,
Lapis AI `ea27e0d1` and JJ Store `a5dd0ddc` are the reviewed source baselines.
The four unrelated JJ Store workflow documentation edits remain untouched.

The roadmap includes AI observations/guarded undo, per-agent providers, Markdown
memory and three-harness progressive imports. Exact sent-context previews stay
ephemeral. Native-store conversation persistence, tool expansion, Docker,
terminal migration, publication, signing and deployment retain separate gates.

## Verification

- `pnpm exec prettier --write AI_HISTORY_PARITY_PLAN.md MIGRATION.md`: passed.
- `pnpm spec:validate`: passed, 10 validators, 173 chapters, 1,491 requirements.
- `pnpm spec:check`: passed all six lanes, both application/query audits and
  38 specification regression tests, with zero failures.
- No product code changed and no product/provider/browser tests were run for
  this documentation slice. Existing qualification is reference evidence only.

## Milestone review

H00 saves the full plan and the single H00–H11 completion ledger. H01 is next:
reconcile the qualified Node runtime with the newer API/workspace source and
validate the resulting server. All implementation gates remain pending.
