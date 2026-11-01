# Rolling CI dependency-image review

Source base: `e8a04959` (`main`). The dependency-image workflow now uses
`automation/lapis-notes-ci` for successive lockfile pins. An open review is
updated; a closed or merged review is replaced by a fresh PR. Publication is
restricted to `main` for both push and manual events.

After a successful proposal, paginated cleanup closes only bot-authored,
same-repository reviews targeting `main` whose heads match the exact legacy
lockfile-branch pattern. If the generated pin is already current, the rolling
review is also closed without a push or replacement. Failed publication retains
legacy reviews. Image building, provenance, immutable digests and normal
specification gates remain in place.

## Regression and validation

- Existing boundary before expansion: `node --test scripts/dependency-image-pr.test.mjs`
  passed 3 tests, with 0 failures.
- Expanded regression before the workflow fix: the same command passed 4 tests
  and failed 5, covering rolling-head reuse, obsolete-review cleanup and the
  manual-event branch restriction.
- After the fix, including a fresh separate checkout: the exact command passed
  all 9 tests, with 0 failures.
- `LAPIS_NOTES_VALIDATION_RUNTIME=native pnpm spec:check` passed the six
  validator lanes, application-ownership and metadata audits, and 67 specification
  regression tests. The nested lanes separately passed 3 view-command and 21
  Storybook-structure cases. All 194 specification mirrors were current.
- Prettier checks passed for the workflow, regression and canonical documents.

The first complete release-tooling run in a nested non-colocated JJ workspace
passed 105 tests and failed one unchanged Storybook graph-hashing test because
its input discovery omitted `.storybook/`. The exact graph test passed in the
original checkout and a separate colocated JJ checkout; no assertion or product
code was changed for that environment issue. The final
`LAPIS_NOTES_VALIDATION_RUNTIME=native pnpm release:test` run passed all 106
tests with 0 failures. This checkout reused the existing installed toolchain
through an ignored `node_modules` link; this is source validation rather than a
new frozen-install qualification.

The registry's latest `@lapismd/spec-validator` was already installed at 0.2.0.
`spec-validator doctor --json` and `pnpm spec:search --semantic` were attempted.
QMD reported a native-module mismatch against active Node ABI 147, so canonical
discovery used the documented `rg` fallback. The specification check itself
passed; QMD semantic retrieval is not claimed as passing.

## Existing PR cleanup

Current `main` lockfile SHA-256:
`688ad20800e4064adf60294d178aee16c2f272e04657da50e606884be163cbe6`.
PR [#69](https://github.com/lapismd/lapis-notes/pull/69) matches that lockfile and
remains open. Superseded PRs #48, #49, #54, #56, #59, #62, #63 and #68 were
individually verified as bot-authored legacy image pins and closed without
merging. The open image-pin PR count was reduced from nine to one.

The rolling workflow takes effect when its source PR lands on `main`. Its next
successful run replaces the remaining legacy review with the rolling review.
