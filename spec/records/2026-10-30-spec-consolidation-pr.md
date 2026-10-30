# Consolidation pull-request release metadata

Notes PR 44's first CI attempt passed build-cache, registry-fixture,
specification validation, documentation mirrors, mdBook and spec-first. Its
release-intent gate then failed because the public API, UI and Workspace README
changes lacked a Changeset, cancelling the remaining parallel jobs.

The exact local reproduction uses check-release-intent.mjs with the resolved
main and candidate commit hashes. It reports one failure naming those same
three README files. A patch Changeset now records their documentation-link
changes without altering package versions or runtime behavior. The release
policy and its assertions remain intact.

Verification: the exact release-intent target changes from one failure to zero;
the three release-intent regression cases, changed-file formatting and the
spec-first gate pass. Remote CI must qualify the updated PR head before merge.
