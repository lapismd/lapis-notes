# Authoritative migration tracker and current workspace

The active shared Rust implementation uses the main Notes Jujutsu `default`
workspace at `/Users/stevejuma/code/lapismd/lapis-notes`. Its root `MIGRATION.md`
is the R0–R7 master; its generated task source is `spec/migration-progress.json`.
The previous grouping commit is `9788a6bf`; source database conformance remains
qualified at `77ae786b` and Desktop compatibility is recorded in `7180b24c`.

The sibling Desktop main/default workspace owns M-series milestones. Its older
activity checkpoint still described the completed database audit as running.
Desktop `021f6a3b` / E-PROGRESS-002 corrects that duplicated text and points to the Notes master;
it changes no milestone statuses, prerequisites or original acceptance gates.

R3.1.18 model/runtime installation is now Working. A first exact acceptance test
has been authored, but the initial run stopped at the existing 30 GiB free-space
guard before compilation. No failing product test or qualified implementation
is claimed. That test remains separate uncommitted work and is excluded from
this documentation commit. Native cache installation and both host database
adapters remain unfinished; hosted access still uses Node. M11 remains Deferred.

The workspace inventory was checked directly with `jj workspace list`, status
and current parent revisions in both repositories. This thread is not editing
the retained hosted-services, desktop-migration or server-node workspaces;
their earlier work remains preserved.
No application or shared native source changes in this tracker follow-up.

Validation: the master generator's ten cases and progress drift check pass.
Full `pnpm spec:check` passes all ten lanes, ownership/metadata audits and all
48 specification regressions. Final changed-file formatting and metadata are
checked before committing. Desktop `021f6a3b` passes all eleven progress cases,
four specification lanes and changed-file formatting; the master refresh
follows that consumer commit. Logs are retained under
`.local/migration-tracker-location-spec-complete.log` and Desktop's
`.local/migration-master-pointer-spec.log`.

The initial full specification run stopped at the protocol build's disk guard;
free space subsequently recovered without cache deletion. The next run reached
spec-first and found the pending cache test's mapped Architecture chapter
missing from this working-tree change. That chapter now records current
workspace routing and the unqualified cache slice. The new test is still
excluded from this documentation commit; its product acceptance is separate.
