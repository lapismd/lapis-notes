# R1.3 portable file-action source boundary

Started 2026-10-23; source qualification 2026-10-24. Notes baseline: `c5ffe1b9`.
This record qualifies the shared portable file-action implementation only.
Desktop/HTTP adapter intake, existing shell acceptance, native backup ownership
and controlled Quit remain required before R1.3 completes.

## Implementation

The shared protocol adds existing portable shell file operations and typed
results: metadata/listing, text/binary/range reads, exclusive creation,
conditional/unconditional text writes, binary writes, append, directories,
rename, copy and removal. Camel-case fields, defaults, mtime and existing engine
semantics remain intact. OS actions and native absolute-path conversion remain
host-owned and cannot deserialize as portable file commands.

Every action checks live client and physical root under the existing service
mutex. All mutations share the same dirty-claim guard. Structural changes refuse
unresolved descendants and aliases of ancestor directories. File saves retain
the owning client's edit permission; foreign/detached claims still block. The
content-version API and portable shell operations reuse that single guard.
Portable error codes distinguish collisions, nonempty directories and invalid
file/directory operations without exposing native paths.

## Before/after evidence

- `pnpm rust:core -- test -p lapis-app-core --test service_files --locked` first
  stopped at the mandatory 30 GiB guard. After previously approved incremental
  cleanup with no compiler running, it reached six missing file-protocol/service
  API compiler errors; no tests ran. The implemented exact target passes all
  three cases, zero fail.
- `pnpm rust:core -- test -p lapis-app-protocol --test wire --locked`: five pass,
  zero fail, including existing file frames, strict native-action exclusion and
  serialized TypeScript field spelling.
- The first generated-client check reported two TypeScript diagnostics because
  formatting moved a nested negative-fixture error away from its
  `@ts-expect-error`. Moved that directive to the actual forbidden discriminant;
  kept the invalid native operation and its rejection assertion.
- The 30 GiB guard was rechecked during two automatic continuations and continued
  rejecting builds. No new test or generated-contract success was claimed while
  blocked. The user subsequently approved the exact obsolete-test manifest.
- Revalidated file sizes/mtimes, newer binaries, compiler inactivity and `lsof`.
  Removed 218 listed old integration-test executables (3.36 GiB), retaining all
  11 listed unit/application harnesses, newest integration targets, all libraries,
  normal application binaries, profiles and vaults. The audit manifest remains
  `.local/removed-obsolete-native-tests.json` in Desktop. No broader cleanup or
  build-guard change was performed.

Desktop dependency intake `ebcadc34` separately passed six conditional cases and
all 228 native cases (two existing ignored helpers) against `c5ffe1b9` before
these modules were connected. It does not qualify the new commands or adapters.

## Source qualification

The owning Rust check/test/build and generated-contract gates are recorded below.
This source-private staging changes no renderer or existing host caller; broad
UI/Storybook and native/provider/Linux acceptance are not claimed.

- `pnpm check:rust-core`: actual dependency/source/size audit, generated JSON/TS
  drift and positive/negative client compilation, format and strict all-target
  Clippy pass.
- `pnpm test:rust-core`: 28 Rust cases and five audit regressions pass; zero
  failed or ignored. Original lifecycle, protocol and engine cases remain green.
- `pnpm build:rust-core`: pass for core, protocol and exporter.
- `pnpm spec:check`: all lanes, mdBook, spec-first, 175 current mirrors, App and
  metadata-query ownership checks and 38 specification regressions pass.
- Changed-file Prettier passes; no UI or visual baseline changes were made.
