# Retired shared-AI installer provenance

The user approved this public installer policy exception on 2026-11-17.
Registry HTTP 410 prevents endpoint fallback, but old cached V1 catalogs can
omit `downloadUrl` and address a preserved GitHub artifact directly. The exact
regression originally installed shared AI successfully: 1 failure, 28 unselected
cases in `457bdfbb-5c30-4ee2-b2bf-85486ca08647`.

LN-PLUG-137 rejects new installs and updates using the retired distribution's
original GitHub artifact origin or verified signed repository/package source.
The origin check precedes network IO; the verified-source check covers catalog,
portable bundle and adapter-verified admission before installation writes.
Plugin ID alone does not classify a distribution. Third-party AI, explicit other
packages in the old repository, native AI and existing saved data remain intact.
No uninstall, storage migration, public export or error-code change is included.

## Source qualification

- Exact legacy-cache target after the initial fix: 1 pass, 28 unselected cases.
- Complete final installer target: 36 passes in
  `b544833d-7692-4699-a46d-a133e2a21bf2`, including both original URL forms,
  three signed-provenance paths, saved-data/no-write assertions and three
  non-retired AI controls.
- Complete package check/test/build: 27 tasks, zero cache hits in
  `22d1a3ed-ffe6-42e8-87b6-bb6ebdf6a26f`; 1,840 API tests and 2,202 unique
  package tests pass.
- Canonical spec check passes in `d1793110-6cc8-4b27-9643-47d0fd376849`.
  The first attempt correctly rejected absent architecture mapping; meaningful
  ownership context was added before rerunning. No mapping was suppressed.
- Normal check passes all root audits and 16 package tasks in
  `31187cb0-cac9-4203-bb5e-1411dca7e28e`.

All product qualification above uses registry-only remote omarchy Docker.
Source was then rebased cleanly onto Notes main
`7b9b1c2bf16130bb64025eb49ca2c77c3e601e81`, whose intervening change archives
obsolete shared-AI contracts without altering runtime implementation.
The full release, packed-consumer and cold browser qualification is pending.

## Release and consumer limits

The API patch changeset records the installer policy. Local source checks do
not establish published-package adoption, actual native AI startup or data
migration acceptance. API publication and consumer refresh remain separate
gates. Website deployment and old package npm deprecation remain gated.
No visual baseline or interaction quarantine changes are included.
