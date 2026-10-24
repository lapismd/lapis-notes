# Desktop distribution deferred

The user requested that Desktop M11 also be Deferred. Desktop commit `24057694`
(E-PLAN-006) updates its roadmap, canonical migration contract, milestone ledger
and timestamped generated tracker. The complete original install, upgrade,
rollback, clean-machine and platform filesystem/WebView gate remains intact.
M11 waits for explicit resumption and retains its M10 prerequisite. M12 remains
Planned with its original acceptance gate and dependency on M11. No other
milestone status, dependency or original gate changes.

The Notes master tracker records this consumer decision after the Desktop
commit. It does not defer the shared Rust R0–R7 plan or remove R7 hosted/Linux
acceptance. Publication, deployment and installed-app replacement remain
separate gates. Pending native Search-provider/catalog intake is preserved
separately and is not qualified by this planning record.

Desktop validation: changed-document formatting passes; `pnpm check:progress`
passes with 50 tasks / 282 records in the complete working tree, including the
separate pending Core record. All four `pnpm spec:check` lanes pass. The parsed
before/after task audit proves that only M11 status, next action and selected
evidence change; every gate and dependency, including M12, is identical.

The initial draft record reported two metadata diagnostics (required review
fields and incorrectly listed future gates as documentation gaps). The record
was corrected and progress/specification checks then pass. Generated tracker
formatting changed from one existing finding to zero. No validator, product
assertion, committed historical evidence or visual baseline was weakened.

This Notes change is documentation-only. Product, native and Storybook suites
are not repeated; they remain required for the separate pending intake.

The committed Desktop planning snapshot separately passes
`pnpm spec:first --base '@--' --head '@-'`: three protected files and two
canonical chapters. The pending implementation files are verified byte-identical
after the commit and restoration of their separate documentation hunks.

Notes validation: all nine `pnpm spec:check` lanes, App ownership and metadata
query audits, and all 38 specification regressions pass with zero failures.
Changed-document formatting is checked before commit; the initial master
tracker had one formatting finding, resolved by formatting its current tables.
