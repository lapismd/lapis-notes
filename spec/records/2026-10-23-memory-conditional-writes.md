# Memory adapter conditional text writes

LN-PKG-167 and LN-PKG-169 apply the existing conditional-write contract to the
public MemoryVaultAdapter. The Desktop migration exposed plugin settings failing
closed because this adapter lacked the capability. This source fix compares the
exact text or expected absence and updates memory synchronously before yielding.
Binary baselines and stale snapshots reject with ECONFLICT without a write.
No native filesystem, database authority or public method signature changes.

- Exact memory target before: 4 passed, 2 failed (missing implementation).
- Exact memory target after: 6 passed.
- First full API run: 1186 passed, 2 failed. Two existing failure-injection tests
  mocked Vault.modify, but conditional-capable adapters correctly call
  modifyIfUnchanged. Their injected failures now target that existing method;
  draft retention and rename-refusal assertions are unchanged.
- Exact memory/loading/rename rerun: 3 files, 27 passed.
- API check: 0 Svelte errors/warnings; TypeScript passes.
- API build and packed type contracts: pass.
- Spec-first: 4 protected files and 4 mapped chapters pass.
- Full API rerun: 131 files, 1188 tests passed.
- Specification validation: 10 validators, 173 chapters, 1495 requirements pass.
- Consumer qualification follows rebuilding the isolated public archive.

This is a local migration source correction, with no publication or installed
app replacement. API and consumer evidence remain separate.
