# Managed frontmatter and metadata mutations

The next Tauri migration slices resume with M4's outstanding writer safety.
LN-PKG-172 adds queued one-shot mutation admission to the App-owned file-editing
registry. Existing document writers settle before a mutation reads authoritative
content. Failed computed drafts retain the public text-persistence recovery
contract and remain lifecycle barriers independently of a panel's lifetime.

Properties can supply the record displayed before an edit. A stale record
enters explicit recovery while unrelated body edits remain compatible. Metadata
type writes join the same queue immediately, including first creation and
recovery after external deletion. The ordinary compatibility path remains for
adapters without conditional text support.

## Exact regressions

- `pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/frontmatter-persistence.test.ts`:
  four initial failures, then four passes. Two additional displayed-record and
  independent-body cases pass.
- `pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/metadata-persistence.test.ts`:
  four initial failures; the first repair passes three with one missing-file
  path-normalization failure. Normalize the owned state path rather than relax
  registry containment. All four then pass. External deletion/recreation adds a
  fifth passing regression.
- Combined exact final run: eleven cases pass, no failures.
- Five affected writer/editor/FileManager suites pass 54 cases before the
  additional metadata and displayed-record cases.
- API check passes with zero Svelte errors/warnings and its public type lane.
- `pnpm check --force`: all eighteen tasks pass, with no cached tasks.
- `pnpm test --force`: all eighteen tasks pass, including 1,025 API cases;
  1,606 package cases pass with one existing legacy integration skip.
- `pnpm build --force`: all ten tasks pass, including public contracts and
  publint.
- Cold focused File Properties Storybook: all six interaction/axe cases pass
  against the currently installed plugin cohort. The new plugin adapter still
  needs separate archive consumption and native qualification.
- First `pnpm spec:check` fails its mapped spec-first lane because the new
  writer-admission methods also require the canonical editor integration
  chapter. Add that architectural description without changing its existing
  requirements or weakening the map.
- Full cold Storybook run: all 256 interaction/axe cases pass in four shards
  (90 + 66 + 40 + 60) before the final target-binding and metadata-state audit.
- That audit adds two exact failing cases: changing a queued mutation's target
  and adding metadata after a retained conflict. Capture the original target and
  keep metadata on one mutable App-owned text writer. A seventh metadata case
  verifies protection before changing the visible model. The final five-suite
  focused run passes all 56 cases.
- Final uncached root check, test and build pass all 18, 18 and 10 tasks after
  those repairs. The final public archive is repacked before consumer refresh.
- `pnpm packages:check` also passes, including 101 release-tool cases.

## Final source qualification

The failed-IO audit adds a regression for an ordinary permission error after a
draft is computed. That error now retains its draft and authoritative recovery
snapshot without concealing the original IO failure. The final five affected
suites pass all 57 cases. Final uncached root check, test and build pass all 18,
18 and 10 tasks: 1,029 API cases and 1,610 package cases pass, with one existing
legacy integration skip. Package boundary and consumer checks pass 2 and 9 cases;
release tools pass all 101 cases. The complete specification gate passes.

After rebuilding and consuming the final API/Markdown archives, the final cold
Notes catalog passes all 256 interaction/axe cases (90 + 66 + 40 + 60).
The Tauri consumer separately passes all four focused native Properties/type
cases across six cold processes. Its final canonical native run and evidence
remain owned by the desktop repository.

The public API archive is from snapshot
`d5bddc6ebbd72ff48062939668853003541eee3d`, SHA-256
`c0ace270f1adf1dd785495fa938a18260a6ddbe13e18d9095f5322464ac66b26`.
Source correctness and archive consumption do not complete M4. The remaining
enabled settings/plugin writer audit must pass its original gate; this record
does not claim protection for unrelated configuration, hotkey or plugin writers.

The Deno desktop remains superseded and frozen. It receives no new host changes
or packaged qualification; shared source still belongs to its owning package.
Earlier uncommitted public-persistence/presentation work is preserved as a WIP
parent. This record does not rewrite that historical qualification.
