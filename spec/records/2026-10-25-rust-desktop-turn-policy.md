# Desktop immutable turn-policy intake — R2.2.3 checkpoint

Qualified native activation source is Notes `4650a10c`; Desktop consumes its
public Rust policy boundary in `d098b218`. Desktop E-CORE-020 records exact
commands, initial failures and remaining application gates. Lapis AI is clean
and unchanged at `6548afe0`. This checkpoint selects no new execution owner.

The existing helper/profile implementation now yields an immutable per-vault
launch snapshot. Preparing another vault with the same scoped agent ID cannot
replace its retained environment or targets. Legacy ACP delegates to the same
launch implementation; there is no copied engine. Core policy takes the admitted
opaque vault identity and physical scope and never acquires NativeHost while
Core acceptance is locked. Unknown targets refuse rather than falling back.

## Evidence

The exact `prepared_vault_snapshot_survives_another_vault_refresh_without_fallback`
target first reports one E0599 because the owned snapshot API is absent. After
implementation it passes one case (0.07s). The new exact Core-policy case also
passes without a configured window host. All 30 affected native AI cases pass.

| Boundary             | Result                                                                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Native tests         | All 237 cases pass; two retained ignored entries are subprocess helpers invoked by parent tests (233.40s).                          |
| Renderer/governance  | All 416 cases pass (26.16s).                                                                                                        |
| AI                   | All 151 files / 744 cases pass (74.79s).                                                                                            |
| Native strict checks | Normal and e2e all-target Clippy pass with warnings denied (120.45s / 95.38s).                                                      |
| Native builds        | Normal and e2e binaries build separately (31.22s / 248.23s); no app is launched. Existing nonfatal linker unwind advisories remain. |
| Other checks/build   | Types, architecture/App ownership and renderer build pass. Existing large-chunk advisory remains.                                   |
| Specification        | All four Desktop lanes pass, including a second final documentary run; progress and every owned document pass.                      |

The first spec checkpoints report two documentary findings (chapter line count
and invalid interim result), then two missing mapped chapter confirmations.
They all move to zero. The full formatter initially reports three files;
normalizing the two owned files leaves only the previously accepted immutable
E-AI-109 historical exception. It is byte-identical to its parent. No historical
evidence, validator, assertion or compiler lint is weakened.

Standing cache approval covers inactive compiler metadata and older matching
source/features/profile library variants. Cargo ownership, open files and file
identities are checked before removal. Binaries, bundles, profiles, vaults and
models are preserved. These operations change no AI or other source.

## Remaining original gates

R2.2.3 stays Working. The Tauri runtime still needs turn storage and typed IPC;
the existing Agent screens through both hosts still need an observer-only
adapter. The selected native profile must not construct the old renderer's
transcript writer or background orchestration. View close detaches observation;
explicit feature disable and vault/Quit retain native fence/drain.

R2.3 still requires an actual provider turn after client detach and cold
application recovery without replay. Native policy fixtures and compiled
configurations cannot qualify those gates. R3–R7 remain open. Node stays the
serving baseline; signing/M11 and the native AgentStore/ThreadStore experiment
stay Deferred. JS archives and installed applications are unchanged.

## Master-tracker refresh

The default Notes checkout's first full `pnpm spec:check` reports two findings
in another task's uncommitted LN-PKG-004 paragraph: six sentences and 84 prose
words. Preserve its editor, verification and legacy-plugin backlog files. This
tracker slice changes only four owned documents and attempts that exact tree
on the committed parent, separately from concurrent PDF/CSV work. That parent
also reports the existing five-sentence LN-PKG-004 error. Formatter and progress
checks pass; this documentation refresh remains uncommitted until its owner
repairs the specification. No unrelated finding is waived and no plugin work is
committed as part of this refresh.

The PDF/CSV owner subsequently repaired those specification findings in the
committed default baseline through `0ea2ba66`. The shared observer checkpoint
now passes the complete source specification lane and all 49 validator cases;
this record is included with that source checkpoint. Earlier selected-tree
attempts above remain historical evidence.
