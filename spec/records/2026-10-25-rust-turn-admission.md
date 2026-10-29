# Native turn-admission journal — R2 source boundary

Status: source qualification passed.
R2 remains Working. This record does not qualify ACP execution, portable
conversation publication, either host adapter or existing chat adoption.

## Implementation

`lapis-app-core::turns` stores accepted requests in host-selected private
storage outside vault content. A retained physical directory capability and
exclusive writer lock bind each vault's journal. Every write retains the Core
file engine's exclusive/conditional publication and synchronization.

Fresh durable acceptance returns a single-use native dispatch claim. Exact
duplicate requests return existing state without dispatch authority. A claim
must durably transition to Running before a native owner may call ACP. Claims
are bound to their writer generation and expected bytes. Completed outcomes
cannot be changed; failed validation leaves the running token available for
recording an uncertain result.

Reopening converts Accepted to Interrupted and Running to Unknown, preserving
partial output without replay. Private schema one is independent of portable
conversation schema three. The journal does not replace the existing
`metadata.yaml`, `agents.jsonl` and `transcript.jsonl` files. Queries return
metadata summaries, and requests, responses, serialized records and record
counts have explicit bounds. There are no new dependencies or lockfile changes.

## Before and after

The initial focused family passed eight ordinary cases. Malformed-state
coverage then passed nine, with the isolated crash-process helper ignored
when enumerated independently. Its normal parent test actually starts and
kills separate writer processes both before and after dispatch.

The first strict check found one authored `large_enum_variant` Clippy failure:
the fresh admission carried a second full record inside its dispatch claim.
The claim now retains identity, generation and expected bytes, and re-reads
the validated durable record. No lint suppression or boxed variant was added.

The added 4,096-record capacity case exposed one failure: using the ordinary
file browser listing inherited its separate 2,000-entry limit. The exact case
`full_journal_refuses_new_admission_without_deleting_completed_history` failed
0 pass / 1 fail before correction. The private journal now enumerates its
retained capability with its own bound, preserving the file browser contract.
The exact rerun passes 1/1; the complete focused family passes 10 ordinary
cases, zero failures and one standalone helper ignore (1.58s).

Commands use `CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2`:

- `pnpm rust:core -- test -p lapis-app-core --test turn_journal --locked`
- The same command with the exact capacity test name and `-- --exact`.
- `pnpm check:rust-core`: dependency/source boundaries, generated protocol
  drift/types, formatting and all-target workspace Clippy pass.

The first specification run found the new chapter's missing mirror and stale
SUMMARY navigation (two diagnostics). `pnpm spec:mirrors` generated the
metadata-only MDX and navigation entry. Spec-first then required the mapped
catalog chapter update (one diagnostic). With that documentation in place,
`pnpm spec:check` passes. Production story configuration and behavior are
unchanged; the generated sidebar gains only the specification page.

`pnpm test` passes all 293 ordinary Rust cases/doctests and five source-boundary
regressions. Six standalone cases are ignored: five optional actual-model
cases and the crash helper that the normal parent invokes explicitly. The
package test lane's twenty Turbo tasks pass from unchanged cache entries. Full
`pnpm check` passes, including its twenty cached package tasks. Full
`pnpm build` freshly builds the native workspace and passes eleven unchanged
package build tasks from Turbo cache. Full Rust tests use
`RUST_TEST_THREADS=2`; all native compilation uses the two-job, non-incremental
configuration above. Logs live under the checkout's ignored
`.local/r2-turn-journal-*.log` files. No runtime UI or transport changes consume
this journal yet, so browser/native-UI/provider suites are not rerun or claimed.

## Remaining feature gate

The native vault owner must still execute through `lapis-ai-service`, publish
the existing portable conversation format, and retain accepted work across
observer detach while fencing and draining explicit close/Quit. Both typed
adapters, ordinary chat, real-provider completion without clients and cold
recovery without replay remain R2. No provider, desktop window, hosted browser,
model, distribution or cutover acceptance is claimed by this journal receipt.
