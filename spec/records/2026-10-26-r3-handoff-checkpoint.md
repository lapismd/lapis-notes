# R3 source and host handoff checkpoint

Last updated **2026-10-26 10:42:00 UTC**. This checkpoint distinguishes source
qualification from main-workspace intake; it does not change the R3–R7 gates.
Requirements: LN-CORE-003/004/005/006/007/008.

## Committed source

- Tasks ordered lifecycle: `2296023fd1b422f640e6120cdc020bee328cfb72`.
- Shared private journal IO: `86f360f8e7e6e153d3dd5458eaa9f1dfc7b421ab`.
- Typed Task recovery: `8e09a5dea0da3569816ce22a2ada76ef137ed976`;
  12 exact cases, 110 retained attempts, 459 Rust cases and full source gates.
- Tracked-today scheduling: `ad9685362da6faa46f61608f4363361ffc52d49f`;
  eight native cases, 45 retained attempts, 467 Rust cases, seven intentional
  ignores, complete package/native checks, tests and builds plus 78 governance
  cases. Source receipts `92c76bdc` and `16be58f2` retain complete commands.
- Shared API Search replacement lifecycle: `a1b0dfde`, with qualified runtime
  `eea52e15`, 34 focused native and 1,625 API cases; host adoption is separate.
- Design Core selected-picker contrast: `0d7a92893bc645814581efe5e1fbd0a93a1e7eed`;
  all 986 stories, 922 units, required browser/static/package/specification gates.
  Qualified public archive SHA-256
  `6f33b681e0050123cbd0501ffe6bfdc37d74625b2687a7e283e06943edda31f6`.

## Active delivery

- Hosted Search `2a6f938a6df0dfec206ac4e4e529013c731a52cf` and Desktop Search
  `a052be6b7fda6d6809adcaf874cc08cef03cc5ec` are committed. Plugins prerequisite
  `e0144c6a88f52fd2f71108728980830dc127fa1e` is committed. Hosted qualification
  includes 73 Web / 261 cold catalog / 22 browser; Desktop full native/catalog/portable/
  type/build/specification gates pass. Main intake remains separate.
- Shared History source `7cbb8713c7cff3e7f75b3c9e0672fbad4b95d980` is committed;
  frozen functional source `ec988abcc6d71b5edcbff70f11ade1763ee4edbc` passes
  470 Rust / 2,289 package / 261 cold catalog / 22 browser plus strict/build/public type/spec
  gates. App/session observation, retained hosted reader/screen and Desktop
  shared-adapter adoption are still active.
- Tasks owning plugin adapter `7ae46a7483cc3a368d2b61cd384ac45ebbb06a60` is
  committed: 2,859 units / 14 native / 62 cold catalog and complete source gates. Notes port
  qualification is completing final plugin-load ordering; both host selections
  and daily-provider/locale parity remain open. No lapis-ai edits are required.
- `r3-shared-intake-20261026` merges main tracker, hosted Search, Tasks scheduling
  and shared History source without rewriting their qualified commits. All 12
  initial conflicts are resolved, preserving tracked observations and the
  single transport progress DTO. The first exact run failed at compilation
  against a stale Tasks cache; exported native source hashes and lifecycle
  exports match the qualified prerequisite. The same exact targets are being
  rerun after clearing only that package cache.

The main `default` workspace remains the authoritative master tracker. Active
implementation lives in the named isolated workspaces until their qualified
intake. Neither source completion nor passing isolated application acceptance
changes Node/renderer defaults or the R4–R7 dependencies.
