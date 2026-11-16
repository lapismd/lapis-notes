# Verified dependency completion caller

The source-owned `dependency-completed.yml` calls the shared coordinator verifier
at merged commit `e3c91cb3bc19f19299842054a9309b0ca44da5b6` after the five
reviewed validation/publication workflows complete successfully. The caller
executes no local code and exposes only contents/Actions/PR reads plus the one
existing named notification secret. The required public client-ID variable was
confirmed present through a read-only GitHub API request; no key was retrieved
or distributed.

The shared source verifies actual current public workflow/run/attempt/head
metadata before App minting and again before dispatch. Its receiver settles the
callback and exact check suite before inventory. The hint grants no merge or
publication authority and never selects an unmerged PR head as the source graph.

## Source validation

- `node --test scripts/dependency-completed.test.mjs`: 2 failures with the caller
  absent; 2 passes after adoption.
- Exact native-workflow audit: the new pure delegated caller first exposed one
  failed assumption. It now requires this exact reviewed remote runner and
  rejects any local steps, preserving native declarations for local runners.
- The unchanged parent independently lacked the native declaration in
  `publish-web-cloudflare.yml` (1 failure). Adding that existing runtime
  declaration repairs the audit without changing deployment conditions,
  credentials, validation dependencies or artifact identity.
- `node --test scripts/validation.test.mjs`: 21 passed.
- Native `pnpm release:test`: 122 passed, including the new caller tests through
  the existing release-workflow test entrypoint.
- Native `pnpm spec:check`: all 6 canonical lanes passed, plus App ownership,
  metadata-query audit and 69 specification-validator regressions.
- `actionlint` passed for both changed workflows. Formatting passed for changed
  source/docs. QMD semantic search passed; validator 0.2.0 remains latest.
  Doctor passed 10 checks with the existing intentional wrapper-alias warning.

No manifest, lockfile, runtime package, publication gate or retired Deno route
changed. Complete hosted product CI and a genuine completion-triggered scan
remain pending after the source PR merges. A failed or pending product lane
must remain a hold. This receipt does not claim publication or deployment.

Rollback removes or disables only the new callback; existing publication hints,
manual reconciliation and the coordinator's scheduled-recovery gate remain.
