# Plugin-owned status controls

LN-WS-054/LN-PKG-090 project a custom mount/disposer through the existing public
status registry, preserve callback identity and remove the contribution on
teardown. `Plugin.addStatusBarItem()` returns an owned element in that same
visible path instead of a hidden fallback. Plugins supply controls/CSS and drain
their own asynchronous work. Markdown, diagnostics and view contracts remain
unchanged; their mapped chapters record that review.

- Focused status manager regression: 1 failure/6 passes before; 7 passes after.
- Status manager + Plugin tests: 27 passed/0 failed.
- API types and public build/publint/pack-types pass.
- Initial dependency install failed on an existing local plugin tarball path.
  A filtered API-only temporary pnpm hook uses the verified public Design Core
  archive and normal registry dependencies; no manifests/lockfile are changed.
- Generated plugin-host version churn from prepack is restored; it is unrelated
  to this API addition. Public mount declaration updated at its owning source.
- General checkout archive 0.1.5 was incompatible with the desktop migration
  consumer (64 missing existing API declarations and a missing runtime export).
  Restored all task edits in that checkout and moved the narrow change here,
  whose 0.1.4 history API matches the consumer; strict consumer types now pass.
- Matching source package check, build/publint/pack-types and 27 focused tests
  pass; spec-first and 1488-requirement validation pass.
- Wider provider/release, unrelated aggregate checks and visual baseline approval
  remain deferred under the functional-plugin slice. Desktop acceptance is
  recorded separately in E-REPO-024; no package published.
