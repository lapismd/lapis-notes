# Private application profile Agent UI intake

Qualified source: `b0d2799d36684087b644e2cc37208c7d5dd84188`.
The private profile consumes published Agent UI `^0.2.5`, aligned with the
released Core 0.13.2/Mira 0.2 cohort and the qualified API 0.4.0 preparation.
The profile remains private at 0.0.0; this slice introduces no public package
version intent or host policy. Existing host startup, routing and App ownership
contracts remain unchanged.

The exact range from `0be8caef6ce5ab479c5d027032bc845e3dc3fb02` initially
lacked five mapped canonical categories. The repaired range passes two
protected files and six owning chapters, including verification. The candidate
is a single-parent child of the real release merge, preserving every prepared
API/UI/Workspace version instead of reversing release metadata.

## Qualification

- Docker specification validation, mdBook, source/ownership audits pass.
- Complete quality: all 16 tasks pass. Complete units: 2,131 reported cases,
  including 1,785 API cases. All nine build tasks and package lint pass.
- The first complete browser run passes 102, 70 and 47 cases in its first
  three shards. Its fourth executes 55 cases, but the browser RPC closes before
  collecting the two Link Preview Acceptance cases. This is one transport
  error, not an assertion failure; its log and failed worker report remain.
- The cold exact Link Preview Acceptance target passes 2/2. A cold fourth
  shard with browser tracing enabled passes 57/57. No root cause or upstream
  browser fix is inferred from those passes.
- The original unchanged full `pnpm test:storybook` command then passes all
  four shards (276 cases), retaining its three successful exact-source cached
  shards and executing the fourth normally, without tracing. Final report:
  `.local/validation/runs/lapis-notes-validation-7c49c973-1d29-421b-9406-b487bbe26199`.

No assertion, browser configuration, timeout, quarantine, accessibility policy
or visual baseline is changed. Exact-head hosted CI and downstream installed
application acceptance remain separate gates. The source cohort above was qualified at Agent UI 0.2.5; its exact local
execution evidence is not relabeled as a different version.

## Landed Agent UI 0.2.6 intake

Bot PR 104 subsequently merged Agent UI `^0.2.6` at
`ddfc0bbb945c9956d58db422ccfde7e9b2add91b`, after its exact head
`cce359f2d129e6b48e65702f8a9ae0b5e07a11bb` passed all required quality,
unit, package, static, Cloudflare and browser acceptance gates. The canonical
repair retains those product files and the already merged CI image pin.

Independent tarball comparison of Agent UI 0.2.5/0.2.6 and Repository UI
0.2.3/0.2.4 verifies every packed file except package version/dependency
metadata and changelogs is byte-identical. The new minimum Core range is
already satisfied by Notes Core 0.13.2. Current dependency declarations and
consumer CI remain distinct from the historical local 0.2.5 test record.
The final PR changes only canonical documentation and this record.
