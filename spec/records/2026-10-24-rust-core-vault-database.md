# Native database bound to admitted vault lifetime

R1.3.7 implements the existing LN-CORE-003/004 ownership gate. Native installation
policy selects a retained physical database profile and embedding host. Vaults
open the complete AppDatabase facade lazily under their opaque identities;
clients and native work share that owner. Client detach leaves the database
live. Explicit close and Quit fence admission and wait for the worker to drain,
checkpoint and release its native lock. Dirty-editor preflight is unchanged.

The exact source target is
`pnpm rust:core -- test -p lapis-app-core --test service_database --locked`.
Before implementation it stops at sixteen missing-binding compile diagnostics;
no runtime cases execute. Seven initial cases cover lazy/competing clients,
detach, cancelled write waiters, fenced close, multi-vault dirty Quit, cancelled
initialization, explicit file-only unavailability and replaced profile/vaults.
All eleven final lifetime cases pass, with zero failures. The additional parked
reply regression fails once before repair, then passes: a client keeps an
opening lease only until worker ownership exists, so consuming its reply cannot
postpone native close. Native work can also use that same database after every
client detaches. Host adoption remains separate.

All five actual-model parent cases now pass across four targets, including the
new service-owned inference/controlled-Quit case and its cold offline child.
The first combined model run exposes one installation-path failure: separate
cache scenarios cannot select two process-owned ONNX installations. Run the new
scenario in its own process, preserving the production guard and exact vector
assertions; the unchanged model command improves from one failure to zero.

## Final source and consumer qualification

Baseline: Notes `b81f691a`; source is the enclosing change. All of these pass:

- Exact `service_database` target: eleven cases, zero failures.
- `pnpm check`: strict workspace/all-target Clippy, source/protocol audits,
  specification validation and twenty cached JavaScript package tasks.
- `pnpm test`: 227 ordinary Rust cases, zero failures; five asset-dependent cases
  are ignored here and all pass under the explicit actual-model command. All
  twenty JavaScript package tasks retain verified cache results.
- `pnpm test:search:onnx`: five parent cases across four targets, with native
  inference after client detach/controlled Quit and cold offline child processes.
- `pnpm build`: fresh production Rust build and eleven cached JavaScript builds.
- `pnpm spec:check`: all ten lanes, ownership/metadata audits and 49 specification
  regressions pass. Changed-file formatting and final spec-first are checked.

Desktop `df16e136` qualifies the unchanged `core_file_service` target (two cases)
and strict normal/e2e all-target Clippy against this source. Consumer logs are
`lapis-desktop/.local/core-vault-database-{service,clippy-normal,clippy-e2e}.log`.
There are no Desktop source, archive, manifest or lockfile changes. Its existing
non-fatal `__eh_frame` linker warning remains; no new warning appears. This
qualifies shared-library/file compatibility, not selected database/native UI.

Source logs are `.local/core-vault-database-final-{target,check,tests,build}.log`
and `.local/core-vault-database-model-after.log`. Initial failure logs retain
the compile diagnostics, parked-reply regression and process-isolation finding.
The original source suites are not substituted by consumer compilation.

Initial free space is below the 30 GiB native build guard. Before native
qualification, use the standing cache approval to remove only 36 inactive older Desktop test executables
(5.60 GiB), retaining each newest variant, libraries and app binaries. Recheck
compiler inactivity/open files and unchanged metadata; the exact inventory is
`.local/inactive-desktop-tests-20261024.json`. No profile, vault or model is removed.

Database completion observers hold neither a vault nor an admission sender.
Dropping the runtime therefore cannot leak a worker through an observer cycle.
Native close remains a blocking operation invoked outside an async executor,
as in the existing HTTP lifecycle. No protocol gains SQL or filesystem paths.

Both host adapters, retained browser UI, backup detach/Quit, unattended indexing
and R2–R7 remain open. Desktop M11 stays Deferred. This slice changes source
lifetime, not renderer presentation, publication or deployment.
Qualification runs on macOS ARM64; Linux and visible application acceptance
remain independent gates.
