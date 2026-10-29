# Authenticated Rust HTTP database intake

R1.3.8 builds on the qualified vault/database owner at Notes `d736e1c6`.
This slice connects the existing typed high-level call boundary to authenticated
HTTP attachments and native installation-profile selection. Tauri adoption,
retained Web shell acceptance and the complete R1.3 gate remain separate.

Exact regression:
`pnpm rust:core -- test -p lapis-server --test http_files --locked database::native_database_wire_values_use_the_admitted_vault_owner -- --exact`.
The initial route returns 404 instead of 200; one runtime failure, no database
operation accepted. Implementation and source qualification are in progress.

All seven focused HTTP/database/auth cases and the real browser-authenticated
server process pass. The process persists notes and database values, drains on
SIGTERM, restarts without the bootstrap password file and restores its original
valid cookie session. Database/model directories remain owner-only. No HTTP
request can choose native storage or issue SQL.

The first expanded admission assertion assumes every malformed request returns 400. Retained native HTTP tests already require 422 for schema rejections;
preserve that contract. The new test strictly checks 422 for unknown methods or
fields, 400 for invalid native argument counts and `InvalidRequest` throughout.
That new assertion failure improves from one to zero without changing the
existing decoder or error classification.

## Existing installer race found during full qualification

The full source suite exposes one failure in
`embedding::cache::tests::competing_installers_download_once_and_expired_lock_wait_is_explicit`.
Three focused/diagnostic reproductions retain the same `ENOENT` while two native
installers first open `install.lock` with `O_CREAT`. Qualified source `d736e1c6`
contains that same implementation; HTTP feature code does not alter it.

Create the persistent lease exclusively, then reopen only an existing lease
after `AlreadyExists`, without creation, truncation or symlink following.
The exact regression now passes, and runs eight independent fresh-cache races
while retaining the single-download and expired-wait assertions. Temporary
diagnostic output is removed. This repairs the existing shared-cache contract;
it adds no model/provider capability.

## Final qualification

- The exact original HTTP regression improves from one 404 failure to zero.
  All seven focused HTTP/auth cases pass. The complete shared HTTP-fixture lane
  passes all thirty cases, including its twenty-three retained scenarios.
- The actual server binary retains both notes and database values after a cold
  authenticated restart and controlled shutdown; its one process case passes.
- The exact cache contention regression passes eight fresh races; all seventeen
  core library cases pass in the complete suite.
- `pnpm check`, `pnpm test` and `pnpm build` pass. The workspace runs 234 ordinary
  Rust cases, zero failures, with five asset-dependent cases ignored there and
  run separately. Twenty JavaScript check/test tasks and eleven builds retain
  verified cache output; there are no JavaScript runtime changes.
- `pnpm test:search:onnx` passes all five real-model parent cases across four
  targets, including cold offline children and the service-owned detach/Quit case.
- Desktop `df16e136` passes both exact `core_file_service` cases and strict normal
  and e2e all-target Clippy against the repaired core. Its source, lockfiles,
  archives and installed applications are unchanged. The previously recorded
  non-fatal `__eh_frame` linker warning remains.
- `pnpm spec:check` passes all ten lanes, ownership/metadata audits and 49
  specification regressions. Final progress, spec-first and formatting checks
  retain the unchanged limits and acceptance gates.

Source logs are `.local/rust-http-database-final-{check,tests,build}.log`,
`.local/rust-http-database-{focused-final,process-final,model-final}.log` and
`.local/rust-cache-race-eight-after.log`. Desktop logs are
`lapis-desktop/.local/core-lease-race-{service,clippy-normal,clippy-e2e}.log`.
Failed runs/diagnostic logs remain available; temporary diagnostic code is gone.

Native compilation again lowers space below the 30 GiB preflight. Under standing
approval, remove only 29 inactive older AI compiler executable variants (2.24 GiB)
after checking compiler working directories, open files and unchanged metadata.
`.local/inactive-ai-tests-20261024.json` retains the inventory. No `lapis-ai`
source, profile, model or newest executable changes.
The first final specification attempt hits the same disk preflight. Remove only
sixteen older core test executables (0.88 GiB) and 143 inactive older Desktop
library/metadata artifacts (0.94 GiB), retaining two variants per identical
source/features/profile. All executables/app packages remain intact during the
library cleanup. Inventories are `.local/inactive-core-tests-20261024.json` and
`.local/inactive-desktop-libraries-20261024.json`. The unchanged full specification
command then passes; `.local/rust-http-database-spec-final-after-cleanup.log`
retains that result alongside the initial resource failure.

The HTTP half of R1.3.8 is qualified; Tauri adoption remains next. The retained
hosted Web shell still uses Node. R1.3.9–11 and R2–R7 remain open, and M11 stays
Deferred. Visible application, external-provider and Linux gates remain
independent of these macOS ARM64 source and native-HTTP checks.

The adapter must retain protocol/Origin/CSRF/session ownership, explicit undefined
versus null, native-root admission, leased clients, per-vault isolation and
service-owned close/drain. Native profile/cache paths and SQL cannot enter a
request. Browser/desktop UI and full hosted cutover are not claimed here.
