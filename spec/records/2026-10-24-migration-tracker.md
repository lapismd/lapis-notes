# Live migration tracking and task navigation

Consumer Desktop revision: `733bb679`, evidence `E-PROGRESS-001`. This receipt qualifies
Desktop's tracking workflow, separately from native Search-provider intake.

Desktop now generates a visible verified/running/waiting checkpoint from the
owning milestone ledger beside its explicit UTC date/time. Each nonempty gate
status has its own table; active gates come first and Done comes last. Task IDs
sort naturally without mutating the ledger. Every task links to its defining
spec file, including the separate vault-backup ledger. All **50** links resolve
to their actual task rows.

The exact activity regression initially fails once, then passes. Two exact
status-group/source-link regressions initially fail, then pass. All **11 progress
cases** and **411 renderer/governance cases** pass. Unknown milestone gates are
not promoted, and original completion gates remain unchanged. The visible
activity survives regeneration instead of depending on hand-edited generated
Markdown.

Both repository guides now require refreshing activity when validation or
remaining work changes during a slice, as well as updating status/evidence and a
UTC date/time in every slice commit. LN-GOV-051 retains source qualification and
host-adoption distinctions; this master-tracker follow-up follows the consumer
commit.

The current native Search-provider intake remains **Working**. Its rebuilt
hidden API and focused attachment checks pass, and desktop/light catalog
requalification passes **500/500**. Other viewport/theme combinations are still
running. This workflow receipt does not qualify that pending intake, native
semantic Search, host database adoption, unattended indexing, R1.3/R2–R7 or
publication/distribution. Both hosts retain their old database adapters, and the
hosted application remains Node.

This is documentation-only in Notes. Run its formatter and specification checks;
already-qualified product suites are not repeated for this policy change.

Desktop changed-file formatting and all four specification lanes pass. A
navigation draft initially reports one missing entry for the separate pending
Core record; restore working-tree navigation while committing the tracker
record/navigation independently. Final working-tree metadata passes six
validators, 323 chapters and 106 requirements; the tracker commit excludes the
pending Core record. No historical evidence or visual baseline is rewritten.

Notes passes changed-file formatting and full `pnpm spec:check`: all **nine
lanes**, ownership/metadata audits and **38 specification regressions**, zero
failures. Log `.local/migration-tracker-master-spec.log`. The committed Desktop
snapshot separately passes spec-first for **six protected files / two chapters**;
log `.local/migration-tracker-committed-first.log` in that consumer. Final source
metadata and its refreshed UTC timestamp are checked before this follow-up commit.
