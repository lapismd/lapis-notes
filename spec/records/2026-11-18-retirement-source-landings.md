# Qualified Desktop and private Deno source landings

This checkpoint records source integration within the user's Desktop/Deno-only
scope. It does not qualify native startup, saved-data acceptance, full release
packaging, package publication, Website deployment or installed-app replacement.
Core services/functions, future Language Service and Sync contracts remain intact.

## Desktop source

[Desktop #47](https://github.com/lapismd/lapis-desktop/pull/47) merged checked
`2b553332dd97f8ad86106060b7b5c8648cafab5f` as main
`2015c1ead2042b6a9f5f8c52e37d205bdd4773b7` after complete required
[CI 44232361289](https://github.com/lapismd/lapis-desktop/actions/runs/44232361289),
attempt 1: 18 successful jobs and the two configured skips `Native bundle` and
`Full source qualification`. All eight selected ordinary gates, both Linux
binaries and the catalog matrix pass. JJ confirms no merge-tree difference.

The actual-run package artifact is independently verified: eight dependency
archives plus the Tasks fixture role; all 20 Language Service files and 16 dist
files remain. Current catalog gates replay admitted identical-input Turbo
results; the original combined #53 run supplies cold execution evidence. No
macOS native case has run and no native requirement is marked complete.
LD-CI-003/004 require Linux-only ordinary main checks and reserve explicit full
qualification/macOS packaging for release preparation; ordinary success is not
full release or product acceptance.

Actual-main push CI `44238333976` and standard catalog publication `44238334007`
are existing fresh runs, not substitutes for the checked PR or release gates.
Their results remain pending at this checkpoint; no manual dispatch occurred.

## Plugins private portable validation

[Plugins #158](https://github.com/lapismd/lapis-plugins/pull/158) merged checked
`54552e6353f05d66556180799992569a417d8735` as main
`2bab1ccd6e63cacfb2c2a57fc492b60efdd7f56c`, with a byte-identical merge tree.
[Run 44234359523](https://github.com/lapismd/lapis-plugins/actions/runs/44234359523)
passes on attempt 2: 15 successful jobs and the existing specification-only
fast-lane skip. Product, canonical, artifact and final aggregate gates pass.

Attempt 1's quarter 3 lost its browser/RPC connection before Recovery could run:
361 interaction cases passed, 49 did not execute and one unhandled setup error
failed the job and aggregate. There was no reported assertion or axe failure,
but the gate remained blocking. Raw job log `134567978322` is retained.

Two cold Docker diagnostics on unchanged source passed: exact internal 5/8
(`de43cf4b-1040-4b46-9288-542b0ae2a370`), 30 tests/9 files; then isolated
Recovery (`76ddb3d2-bc72-46a7-876b-4d53c05599ac`), one test/file. Both used
image `sha256:3078eab0ae796a0fbcabd8af91461d78ee3e1d50e46449a0332259a8ef6b42e7`,
frozen installs, fresh Chromium/servers, two CPUs, 12 GiB memory and 6 GiB heap.
Metadata digests and JUnit totals were independently verified.

After the original workflow became terminal and its head/base were rechecked,
exactly one targeted rerun request was accepted for job `134567978322` and its
dependent aggregate. Attempt 2 job `134574812256` passed both internal shards
(30 + 48); alongside retained successful quarters (94 + 125 + 113), the final
rollup is 410/410. Aggregate `134577006234` passed. No source, configuration,
assertion, deadline, filter, baseline or exception changed. The initial cause
remains unresolved; neither a product fix nor a flaky-test waiver is claimed.

The independent actual-main CI `44238530243` and normal version workflow
`44238530347` remain pending at this checkpoint. No npm/archive publication,
registry dispatch or source policy exception is authorized by these landings.
Private Sync's external manual Deno review remains available and unexecuted.

## Coordinator and retained function boundary

[Notes #170](https://github.com/lapismd/lapis-notes/pull/170) merged checked
`a2652c271471cf4b5d7b95ef84e65e9c02001455` as main
`722a22417d8a2817ff1f80e4887708a7ff144963`, with identical trees. Its complete
hosted run `44234787227` passes 12 jobs and its existing interaction skip.

A further Notes-local read-only import/function audit confirms that actual
Deno execution remains in the four mixed host adapters' filesystem/watch IO.
The frozen host wrappers/main/bindings and private tests are their visible
Notes consumers; this is not organization-wide negative proof.

Preserve `classifyVaultFsError`, `toPortableVaultFsError` and
`decodeVaultTextForBinding` in `deno-host-services/src/vault-fs.ts`: they are
portable error normalization and UTF-8/NUL safety functions, regardless of
current caller count. Preserve path/language/database/protocol reexports, the
language protocol version alias and all future Sync kernels/providers/journals/
leases. URL/path/MIME/admission validation and watch mapping need precise intent
review; a Deno filename or frozen caller does not authorize generic pruning.
No implementation is removed by this audit.

## Still required

The already-present native diagnostic, AI Host development-audit exception and
Website preview questions remain unanswered. Their proposals are concrete and
unapplied; passing source/CI work does not imply consent. Shared-AI preservation prerequisites still gate frozen-host source removal.
Package publication, full release and distribution keep their own gates; the
stable cask requires the real approved Tauri cutover. Terminal ownership migration and Deno terminal-host
retirement remain the final removal. No core API service/function cleanup is
scheduled.

## Coordination checks

This documentation-only checkpoint passes isolated omarchy Docker
`pnpm spec:check`, run `97382f3e-24fb-4106-9d09-f467554a3c2d`, source
`37af4f3ffb26d13a8110a046be68f2d992fe246f`: seven validator lanes and 68 spec
regressions, with retired-source/App ownership/metadata-query audits and zero
failures. Node 24.15.0, pnpm 10.34.5, Spec Validator 0.2.1, two CPUs, 4 GiB
memory and workspace-isolated caches remain in use. This final qualification
paragraph adds evidence only; formatting and local links are rechecked before
commit. Hosted qualification of this documentation update remains separate.
