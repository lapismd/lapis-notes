# Notes version PR authentication

LN-GOV-054 changes only the generated version-PR job's authentication. The
existing source version recipe, release validation, manual publication input,
protected `npm-production` environment, OIDC verification and notification
boundaries remain unchanged. No key was retrieved, copied or rotated.

The existing encrypted App configuration is already referenced by the
notification job. Release run 43745647019 completed `Notify dependency consumers
/ notify` successfully, establishing source-side availability without reading a
secret. Latest main run 43757929308 passed version preparation and skipped
publication. Existing generated PR #131 had one github-actions bot commit,
`3eded53a655c56c1bc5bb5942791cc798b0cdb91`; no manual repair commit was found at
inspection. This migration does not create artificial release intent.

The exact new version-job authority regression initially failed 1/1 because
the job inherited workflow writes. After adding trusted-main restriction,
read-only job authority, non-persistent checkout and the repository-scoped App
writer, that same target passes 1/1. The complete release-workflow target passes
33/33, including rejection of credential fallback, expanded App scope, persistent
checkout, missing main restriction, publication during versioning and workflow
write authority. The actual `check-release-workflow.mjs` CLI passes as well.

The latest Deno-free validator is 0.2.0, already selected by this repository.
Semantic QMD discovery ran before canonical inspection. Doctor passed ten checks
with the existing deliberate script-wrapper alias warning. Deno tooling and
frozen hosts remain unchanged; replacing consumer version tooling is later
cohort work.

Final local qualification passed:

- `node --test --test-name-pattern='version PR job uses|version validation rejects' scripts/check-release-workflow.spec.mjs`: 7/7; the original target alone passes 1/1 after its initial 1/1 failure.
- `node --test scripts/check-release-workflow.spec.mjs`: 33/33.
- `LAPIS_NOTES_VALIDATION_RUNTIME=native pnpm run release:test:run`: 119/119.
- `LAPIS_NOTES_VALIDATION_RUNTIME=native pnpm spec:check`: canonical validation,
  all 194 current mirrors, book, spec-first, App/metadata audits and 69 complete
  specification-regression tests passed. QMD search remains outside CI.
- `pnpm audit`: succeeded with the existing one-LOW ignore; no exception added.
- Formatter and actionlint passed. A parsed before/after comparison proves all
  five downstream jobs and global triggers/permissions/concurrency/env unchanged.

The package chapter remains exactly 400 lines and below 32,768 bytes. No runtime,
package artifact, browser setup, visual baseline or Deno tooling changed.
Hosted deployment and the real generated candidate's current-head CI remain
pending; source qualification alone is not publication or consumer acceptance.
