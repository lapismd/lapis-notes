# Vault-owned native ACP turns — R2 source checkpoint

Status: complete source qualification passed; R2.1 is Source complete.
R2 remains Working. Typed host adapters, ordinary chat and real-provider/cold
application acceptance are not qualified by this source checkpoint.

## Source and authority

Notes consumes the public `lapis-ai-service` execution port and host backend
from the qualified, unchanged Lapis AI revision `6548afe0`. The private native
dependency and its Cargo lock entries are recorded in this slice. No Lapis AI
or plugin implementation is changed, no package is published, and no model or
user profile is modified. Node remains the serving baseline.

Native installation policy resolves an opaque target against an admitted scope
capability. Launch paths, environment and executable selection never come from
browser DTOs. Frozen request options retain model, effort, mode and duration.
The existing runtime negotiates configuration before the prompt. Unsupported
fixed-argv launches and foreign/resumed directories refuse explicitly.

The vault owns one active R2 turn and its retained Work lease. A detached client
or lost caller does not cancel accepted work. Explicit vault close/Quit fences
admission and requests cancellation. The lease survives persistence and process
cleanup; uncertain cleanup retains work and produces a close error instead of
premature drain or an indefinite unreported wait.

The writer creates the existing schema-three conversation location and files.
JSON-formatted `metadata.yaml` is valid YAML, and `agents.jsonl` plus
`transcript.jsonl` retain the established record shapes. Authored user text and
assistant text carry separate provenance. Additional context stays separate
from the authored dialogue. All newly created directory entries are synced;
publication uses the shared conditional writer and protects dirty editors.
The private journal becomes terminal only after portable publication and
confirmed cleanup. Errors retain unknown outcomes without replay.

Filesystem preparation, progress and completion run on blocking workers rather
than Tokio's event threads. Bounded progress snapshots are coalesced before
durable publication, and acknowledgement follows both private and portable
persistence. Buffer capacities and the ACP runtime's 100 ms handoff budget are
unchanged.

## Focused evidence and corrected failures

The first exact `native_turn` target failed to compile because the new native
service exports were not implemented. The initial implementation then reported
0 pass / 5 fail: the test peer incorrectly supplied Python plus a script
argument, while the retained ACP session contract fixes helper argv. Using the
executable peer itself, as the existing service examples do, fixes that fixture.
The exact unsupported-mode case passes, followed by all five original cases.

Expanded coverage initially reported 7 pass / 1 fail for a packed 400-frame
burst under parallel filesystem load. Moving IO off event threads and batching
snapshots improved progress but did not justify a completion guarantee under
overload: a repeated run still retained `output_coverage_lost`. The source
contracts explicitly bound full-queue handoff to 100 ms (Lapis AI
`contracts/runtime.md` and `contracts/tauri.md`).

The final tests retain both concerns without enlarging a buffer or timeout:
a continuous 400-chunk stream must persist completely without a client stream;
a packed burst with deliberately stalled required capture must remain Unknown,
publish its error, clean up, and refuse replay after reopen. The final focused
family passes all ten cases, zero failures (1.74s), covering:

- Real native ACP completion after client detach and reopen without dispatch.
- Exact request deduplication and immutable execution options.
- Model/effort/mode propagation and separate authored prompt/context fields.
- Unsupported mode refusal before prompt submission.
- External and detached dirty-editor transcript protection.
- Explicit close awaiting actual process retirement.
- Close releasing the journal lock while a stale client remains alive.
- Continuous output acknowledgement independent of a viewer.
- Required-capture coverage loss remaining unknown without replay.
- Uncertain startup retaining Work and returning a bounded close failure.

Commands use `CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2`:
`pnpm rust:core -- test -p lapis-app-core --test native_turn --locked`, plus the
exact unsupported-mode and consuming-output targets. Full native source tests
use the retained `RUST_TEST_THREADS=2` configuration. Strict checks, full source
gates and final repeat results are recorded before committing. Logs remain in
the ignored `.local/r2-native-turn-*.log` files.

The Lapis AI host backend is real; its protocol peer is an isolated fixture,
not a provider. No hosted-browser, native UI, live-provider or Linux packaging
acceptance is claimed. The separate Desktop intake is now committed at
`efa44bb0` with explicit user acceptance of its existing Markdown failure;
that consumer evidence does not qualify this newer execution source.

## Final lifecycle and storage review

The exact stale-client case first fails once: successful vault close retains
the journal writer lock through an old client reference. Explicit retirement
verifies ownership, unlocks the journal and fences stale use before close
returns. The exact regression then passes (0.75s), all ten execution cases pass
(1.74s), and strict source checks pass.

The first complete source run passes all 303 ordinary Rust cases/doctests,
five boundary cases, twenty package check/test tasks, eleven builds, all ten
specification lanes and 49 specification regressions. Six standalone cases
remain intentionally ignored: five optional model cases and the subprocess
crash helper exercised by its ordinary parent.

Final review expands the original private-authority test to a vault nested
under the configured private root. Before the guard correction it fails once:
the vault's UUID directory can become the journal directory. Both storage
admission boundaries now require disjoint private/content roots and refuse
before creating the writer lock. The exact regression and affected journal /
execution families are rerun before complete source requalification. Original
scope, limits and failure semantics remain unchanged.

## Final source qualification

After the private-root correction, the exact authority regression passes with
zero failures. All ten execution cases pass (1.75s), and all ten ordinary
journal cases pass (1.56s); the subprocess helper remains separately ignored.

The final `pnpm check`, `pnpm test`, `pnpm build` and `pnpm spec:check` commands
all pass with `CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 RUST_TEST_THREADS=2`:
303 ordinary Rust cases/doctests, zero failures, six intentional ignores;
five boundary tests; twenty package check tasks and twenty package test/build
tasks using unchanged cached JS output; eleven builds; all ten specification
lanes, ownership/metadata audits and 49 specification regressions. Final
progress and changed-document formatting also pass. Logs are
`.local/r2-native-turn-verified-{check,test,build,spec}.log`;
the exact/family and failed attempts remain alongside them.

No product UI, host transport, provider or inference implementation changed.
Optional real-model tests are not repeated by this slice. R2.2 must connect the
Rust-generated DTOs and admitted host adapters to existing chat; R2.3 retains
actual-provider, detached-view and cold application recovery acceptance.
These are subdivisions of the original R2 gate, not additional feature scope.
