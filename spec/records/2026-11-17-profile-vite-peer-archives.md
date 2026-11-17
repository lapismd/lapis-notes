# App Profile Vite peer archive qualification

This completes the archive/build-tool boundaries left open in the immutable
[source checkpoint](2026-11-17-profile-vite-peer.md). Source commit:
`b3a93b2f5e49d514a6c447a0d6e2664d3179bb3e`.
The [exact receipt](2026-11-17-profile-vite-peer-archives.json) preserves source,
image, invocation, cohort and artifact hashes.

## Completed qualification

- Committed-source `ci:release` passes in
  `ecf99e57-cf1a-43ce-92bf-6af3c58ec839`: 196 release tools, four package
  boundaries, nine local-consumer cases, six canonical lanes and 27 package
  build/check/test tasks; the three selected unpublished artifacts pass clean
  public consumer build/resolution. Static Storybook builds; documentation
  acceptance passes five static and seven development cases. The existing
  three static and one development skips remain unchanged.
- `validation:consumer-pack` runs read-only at the exact committed source in
  `4098f2c6-59bb-414d-884d-ce9c5c01fd8a`, producing all six Notes archives.
  The workspace then returns to a clean child without editing that commit.
- Candidate Profile's only changed archive members are README and package.json.
  All 64 built files, including helper JavaScript and declarations, are byte
  identical to the prior main archive from `af645ddb`.
- A separate omarchy Docker container uses the same qualified image and all six
  checksum-verified archives. With directly declared Vite **6.4.5** and **7.3.7**,
  both strict TypeScript checks (including declarations), actual Vite builds,
  emitted import maps and production dependency listings pass. Vite is absent
  from both production listings. No source aliases, type shims, dependency
  patches or skipped declaration checks are used.

The [archived acceptance program](2026-11-17-profile-vite-peer-helper-acceptance.mjs)
expects the six `validation:consumer-pack` archives at `/input/cohort/` in that
Docker image; run `node /input/profile-smoke.mjs` after copying it there. It
writes `/results/profile-helper-smoke.json`. Its first fixture omitted direct
cohort peers and stopped resolving unpublished UI; the corrected fixture
explicitly declares all six verified packages. The failed attempt is retained.

## Consumer and release boundaries

Desktop's installed public-archive cohort passes all 748 AI tests over 153 files
in `730c4e46-999a-4f7e-8ee8-7959a916af1a`. Its actual installed lock was captured
after frozen installation and archive-route verification. An isolated replay
outside every repository, using pinned pnpm 10.34.5, reports **zero production
advisories**. Development Picomatch still blocks that separate audit gate;
the user subsequently approved its exact-version/path exception through
2026-11-30. Application and remaining consumer lanes are still pending.
Desktop owns its final pin, full consumer lanes and canonical evidence.

The Vite 6/7 checks exercise the real built helper, not the entire Server or
frozen Deno application. Their source manifests/configuration remain unchanged;
Server's unrelated dirty Terminal work is preserved. These checks grant no
native startup, installed-app or data migration qualification.

The patch Changeset remains release intent. Profile archive version 0.2.5 is
an explicitly temporary source-qualified candidate, not a replacement for npm's
existing 0.2.5. Package versioning/publication, registry-only consumer adoption,
website deployment and installed-app replacement remain separate gates.
