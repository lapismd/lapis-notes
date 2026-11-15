# Storybook Docs history quarantine

The user clarifies on 2026-11-15 that accepted failures must be documented and
quarantined, and that red required checks must never be merged. This supersedes
the earlier interpretation of accepting the history failure as a merge exception.
Notes validation tooling owns this quarantine; the upstream defect is in
Storybook's manager router.

## Evidence and exact scope

Only `requirement links, outline, and history survive reload` in
`tests/specification/navigation.spec.ts` is quarantined. Its final Forward
assertion fails after Back returns to an anchored chapter. The unchanged
baseline passes with Storybook 10.5.7; secure 10.6 releases drop replacement
navigation options and push another fragment entry, discarding Forward history.
The [security record](2026-11-15-profile-registry-security.md) retains diagnostics,
security-patch constraints and baseline evidence.

Current-head CI bec1239 reproduces exactly that failure in both Docs modes:
static five pass / one fail / two watcher-only skips; development seven pass /
one fail. A fresh exact static case reproduces one failure before this change:
`.local/pr130-docs-quarantine-before-20261115.log`.

Default runs omit this one case in each mode. All its assertions, navigation
steps and timeouts remain intact. The other seven development cases and five
applicable static cases remain enabled, including accessibility. The two
static-only source-watcher omissions remain separate. Omitted coverage is not
a passing test. No workflow job or required check is disabled or made optional.

## Explicit diagnostics and restoration

Build the public packages/catalog first, then opt in to the unchanged test:

```sh
LAPIS_NOTES_RUN_QUARANTINED_DOCS_HISTORY=1 pnpm exec playwright test -c playwright.specification.config.ts tests/specification/navigation.spec.ts -g 'requirement links, outline, and history survive reload'
LAPIS_NOTES_RUN_QUARANTINED_DOCS_HISTORY=1 SPECIFICATION_STATIC=1 pnpm exec playwright test -c playwright.specification.config.ts tests/specification/navigation.spec.ts -g 'requirement links, outline, and history survive reload'
```

The diagnostic must fail while the defect persists. Retain the secure Storybook
version. Restore default history coverage after an upstream fix passes the
exact case and three consecutive complete cold Linux Docs runs in both modes
without retries, following LN-CAT-121. Required checks must be green before merge.

## After-change verification

The exact default target reports one quarantined case; explicit opt-in still
reproduces one failure with the original assertions. Fresh complete development
acceptance passes seven cases with one quarantined. Rebuilt static acceptance
passes five cases with one quarantined and two existing watcher-only omissions.
Both commands exit zero; all seven static aggregate tasks and all six
development aggregate tasks pass. Accessibility remains enabled and passes.

Logs: `.local/pr130-docs-quarantine-exact-default-20261115.log`,
`.local/pr130-docs-quarantine-exact-optin-20261115.log`,
`.local/pr130-docs-quarantine-dev-full-20261115.log` and
`.local/pr130-docs-quarantine-static-full-20261115.log`. Full specification
checks and 67 governance cases, documentation type/mirror checking and changed
file formatting pass. No product implementation or required job is changed.
