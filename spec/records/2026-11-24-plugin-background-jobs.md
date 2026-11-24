# Plugin background jobs source qualification

This receipt covers the Notes-owned LN-PLUG-141, LN-PLUG-142 and
LN-PLUG-143 contracts. Native scheduling and durable authority belong to
Server Core; host acceptance and package publication remain separate gates.
All executable validation below ran through the explicit Omarchy Docker context.

## Scope

Optional manifest declarations and signed, self-contained headless ESM assets
are exposed through the built public API. The App-owned session validates native
snapshots, orders revisions, fences trust and Safe Mode, drains plugin pause,
and detaches without stopping a native owner. Shared production settings expose
schedules, grants, run/pause, interrupted outcomes, handoff and optional OS alerts.
The changeset requests backward-compatible patch releases for API, Workspace
and App Profile. Committed dependency ranges remain registry semver ranges.

## Evidence

- Focused API background-job tests: 11 passed, 0 failed
  (`lapis-notes-validation-1fbe7130-030b-40ee-a614-eebf2f0b502e`).
- Signed handler/runtime validation: 24 passed; metadata-only contribution
  validation: 10 passed in the earlier source qualification.
- Final focused production settings stories: 2 passed, 0 failed
  (`lapis-notes-validation-34cd4c5c-20d3-4ea5-abb4-96cb1e8b54f6`).
  The initial story failure exposed fixture cloning of a Svelte proxy; the
  fixture now uses a JSON wire clone. No product assertion was removed.
- Full cold Storybook interactions and accessibility: 243 passed, 0 failed
  across four batches (95, 53, 42, 53); static Storybook build passed.
- Full `check:all` passed
  (`lapis-notes-validation-a2244c7b-77c0-410d-8ccc-a098218fd721`).
- The final `ci:release` invocation completed all 27 check/test/build tasks:
  API 1,860, UI 24, File Explorer 39, Language Service 18, Host Services 9,
  Workspace 44, App Profile 115 and Web 36 tests passed. Deno Host Services
  retained its 90 tests. No Svelte errors or warnings remained.
- That invocation then stopped at the deliberate release-preparation guard:
  “Release preparation requires an empty Jujutsu working-copy commit.”
  Report: `lapis-notes-validation-a76dc686-260c-4e8a-aa2b-7eea17c3486d`.
  Source is committed before retrying that gate; the guard is preserved.
- Six built public consumer archives were previously packed from source
  `1a59cff5f509237b9383e728943a4d59fd368b8d`. Built declaration contracts,
  package exports and publint passed. These development archives do not
  constitute an npm publication or registry-only consumer release.

## Remaining gates

Complete clean-commit release preparation and hosted PR checks. Publish through
the approved release workflow before registry-only Tasks and host adoption.
Desktop default metadata, native close/Quit and cold resume qualification, and
Server installed-plugin/hosted acceptance remain owned by their host repositories.
Visual review remains pending; no baseline was changed.
