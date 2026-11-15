# App Profile intake of released History 0.5.0

Profile and the root catalog now require History `^0.5.0`, covering the passive
native synchronization port alongside shared remotes and credential presentation.
The existing App binding, session readiness, four-plugin defaults and native
transport/custody ownership remain unchanged. A patch Changeset records the
Profile release; host adoption follows that publication separately.

Baseline `pnpm --filter @lapis-notes/app-profile check` reports zero errors and
warnings. Initial registry resolution refuses the version before metadata is
available; a later frozen installation refuses the tarball while npm delivery
propagates. No local source alias or dependency patch is used. The GitHub public
candidate archive matches the npm integrity for temporary remote qualification.
After propagation, `pnpm install --frozen-lockfile` succeeds against the registry.

Profile checks pass with zero errors/warnings, all 99 unit cases pass across 19
files, and its built exports succeed. Wider root check and test lanes each pass
16 tasks; the root build passes all nine tasks. The focused Notes Session family
passes four interaction/accessibility cases from a fresh browser process.

The first full catalog passes 288 cases but reports one browser-connection error
before LinkPreviewAcceptance can run. Its exact cold family then passes two
cases without changing assertions or product code. The complete rerun succeeds:
first three successful shards are reused and the final shard runs fresh with all
64 cases, including both Link Preview cases. Together the complete catalog has
290 cases across 64 files. No quarantine or visual baseline change is made.

The first specification check refuses four missing mapped canonical topics.
The ownership, native observer and frozen-host unchanged-contract confirmations
are recorded in their mapped architecture, plugin and host chapters. The repaired
specification lane passes, including all 69 governance cases. Package policy and
release checks pass; Profile publint passes. Static catalog qualification passes
seven tasks, including six static specification browser cases and two opt-in
skips. Packaging initially refuses a nonempty JJ working-copy commit as designed;
the verified slice is committed before retrying its release preparation gate.
Hosted PR, package release and final host intake remain separate.

Desktop's temporary built Profile acceptance archive retains source version
0.2.0 with this dependency change, source snapshot
`20f50a318248e1d56e7aea81efc072d61704bcc1`, SHA-256
`56b1dfa3bffa8cb6b26703112dcc97fd1ab2cd178645ce625eefa684defc875c`.
It is private consumer qualification, not final registry adoption or publication
of another 0.2.0. Final hosts must consume the new released Profile patch.

The isolated packaging retry repeats the empty-working-copy refusal because its
runner checks out the nonempty source snapshot directly. The explicit native
`pnpm packages:pack -- --already-built` succeeds at committed source
`ab51e53a27da52f1c752deec475b20b0ffeedfcf`, selecting no unpublished versions:
Changesets has not versioned the Profile patch yet. Profile's built package and
publint checks above qualify this dependency intake; GitHub's versioned release
candidate must independently qualify the actual new tarball before publication.
