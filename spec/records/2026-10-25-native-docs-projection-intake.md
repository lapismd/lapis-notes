# Native Docs projection source intake

Task: `R3.2.1.2.11.1`. Status: source complete; selection contract persisted before
implementation. Original base: Notes `f9fe89674f15d8d8486bd5f7d062d547f7c698ed`.
Rebased before native qualification onto combined Search/History
`ca165289f5388186daf8f27c70620e70bbd3f0ec`; its latest ledger and evidence remain retained.

## Qualified source and bounded result

Docs owns `lapis-docs-projection`, an unpublished pure Rust crate. Its qualified
source is `781b2847ff42e5b5be26eaf209f9428384afdca6`; default Docs integration
`f772f2bacc20a914cef2f0398f294cefbac4ba3c` preserves all 25 selected source files
and unrelated dirty npm manifests. The source passes 155 native scenarios and
the unchanged 167-case TypeScript oracle, including 12 host matcher cases.

Notes consumes the crate directly. This slice publishes `docs/note` from an
admitted physical snapshot through the existing native metadata owner. It adds
no copied parser, npm dependency, renderer scheduler, wire method, host selection
or default switch. Docs UI/editing, FSRS, custom plugin processors, Tasks
mutations, Search completion and both application adoptions remain separate.

## Native-only selection contract

`VaultService::start_docs_indexing(self: &Arc<Self>, docs_root: &str)` enables
the Docs stage and wakes the same metadata owner. It starts that owner if needed
through the existing Markdown selection. `stop_docs_indexing(self: &Arc<Self>)`
fences new Docs admissions while accepted database effects drain. Both methods
return the existing service `Result<()>`; they introduce no transport DTO.

The owner retains one optional normalized Docs root behind its own synchronized
selection. No new watcher, thread, database writer or renderer lifetime is
created. Markdown, Tasks and Search selections retain their current defaults.
Changing the root wakes reconciliation and fences work admitted under the prior
selection. Client detach does not stop the selected owner; vault close retires
this same owner and database through the existing drain contract.

## Admission, publication and errors

The crate's `registration` supplies version, public visibility, seven exact
fields and literal root normalization. Notes qualifies local `note` as
`docs/note`, retains owner `docs`, and uses a deterministic private native
configuration identity containing the normalized root and parser identity.
Unchanged registration must not append a database revision.

Source matching retains the configured forward-slash path prefix, its exact
case and segment boundary, plus the admitted `doc.md` extension. Native Docs
selection resolves that declared longest suffix from `*.doc.md`; it does not
replace the core indexed file's existing `md` extension or metadata. Hidden
resources, symlinks and replaced roots remain excluded by physical admission.

Reads use the existing bounded manifest and vault capability. Publication
requires current native core metadata for the same physical source hash,
timestamp and size. The owner compares stat and exact source bytes again after
parsing; changed or missing snapshots stay pending. No source text is written.

The successful crate result supplies exactly one row and no edges. Parser
failures publish the existing projection source-error envelope and remove ready
rows. Stable domain messages match the retained parser exactly; the approved
YAML diagnostic adaptation preserves category/source location with Rust-native
prose. One failing source does not prevent other admitted Docs sources.

Missing, stale or externally removed sources repair independently of unchanged
Markdown metadata. Ready rows, error rows and registration are revision-idempotent
on unchanged warm passes and cold reopen. Native-only bounded source-path reads
support pruning old roots, nonmatching resources and orphan error states without
adding a public database method or wire DTO. Other projection namespaces remain
untouched. Files appearing after enumeration stay pending rather than being
treated as absent.

## Validation and delivery gates

The exact initial regression is native `docs` startup/publication after enabling
on a running Markdown owner. Required source cases cover schema/root matching,
all seven fields and physical metadata, parser error/recovery, cache repair,
warm/cold idempotence, root changes and orphan pruning, unattended create/edit/
rename/delete, detach, disable/re-enable, same-stat bytes, hidden/symlink/root
boundaries, one-owner lifetime and close/drain.

The existing validation source exporter gains only the committed Docs pin. It
already rejects unsafe names, revision mismatches, archive corruption and path
traversal. The source identity receipt must include that archive and its exact
commit; default dirty npm manifests must never enter a source archive.

After the exact regression and affected owner/database tests, run complete
native and applicable source/package/tooling/specification lanes through the
established Docker snapshot runner, one worker, at most four CPUs and 12 GiB.
Update the generated migration ledger using the normal generator. Record source
qualification separately from both actual application host-adoption gates.

## Qualification checkpoint

Rebased source parent: `ca165289f5388186daf8f27c70620e70bbd3f0ec`. Linux Docker
uses image `sha256:9fa6f3fb3c8787ac38334c121bce350f005454b079e4dbe090d5c10a6d460be9`,
one four-CPU/12-GiB worker and the unchanged final ten-archive cohort. The source
receipt adds committed Docs `f772f2ba` with archive SHA-256
`c32d20b5dd57bd48b6f3a8e92f05188b0e6d6733b6d1688b2f7fab5b7aa3c219`.

Exact command: `pnpm rust:core -- test -p lapis-app-core --lib --locked services::indexing::docs::tests::service::selection_reuses_owner_and_publishes_registered_note_with_core_metadata -- --exact --nocapture`.
Initial run `lapis-native-docs-exact-bad6d8fd-d130-40a8-802a-e7473071db08` compiled
and reported zero passes/one failure because the new polling fixture unwrapped
before asynchronous schema registration. The fixture now tolerates only the
exact pre-registration error; all other read failures still fail.
Run `lapis-native-docs-exact-62b16651-36e2-457a-a1b8-69b91c442206` passes the
same target, one pass/zero failures, source `41721ed4b483eb67abae1128f18b37668a02a127`.
The first affected indexing run `lapis-native-docs-affected-a17d2e73-f29d-4b1b-bfdf-f9805570b605`
reported 35 passes/one failure: the new replaced-root fixture tried to restart
selection after physical admission correctly rejected the replacement root.
The exact unchanged case reproduced zero passes/one failure in
`lapis-native-docs-exact-10fc08b3-207b-4a8b-8cf6-291fc4463992`. The test now
asserts `PermissionDenied`, retains the owner-error and no-new-bytes assertions,
and passes one/zero in `lapis-native-docs-exact-0bd12484-4c60-4877-95d1-662971056735`
at `77528567a975d5c72894d5756db6a5784bcc4056`. The missing-metadata test also
explicitly checks stale parser metadata. No production behavior was weakened.
Affected and complete native/source/specification gates remain pending.

Affected run `lapis-native-docs-affected-ad2833d1-ee74-4ab5-be97-433d4140a6c8`
at `1bcf07270bdeef2bcac7b0422ee5b17077735790` passes all 36 shared indexing
cases (11 Docs), strict workspace/all-target Clippy and both native-source
export guards. Full source check/test/build and specification qualification
started against this same immutable revision and package cohort. The mapped
400-line parent chapter now explicitly lists the optional Docs stage; final
specification qualification must include that authored chapter update.

Full run `lapis-native-docs-full-f238ff5a-3fbf-43a5-b446-fe3beb9cdfaa`
passes `pnpm check:all`: complete checks, all 388 Rust cases with six unchanged
model-dependent ignores, 2,253 package cases with one unchanged skip, and the
complete native/package build. `pnpm spec:check` then fails only the mapped
parent-chapter gate (`SPEC-FIRST-MISSING LN-GOV-003`). The detailed native Docs
contract was present in its child chapter; the mapped parent overview had not
listed it. That overview is now updated within its existing 400-line boundary.
This full lane remains recorded as failed; final specification qualification
against the corrected canonical parent is required before source completion.

Final corrected-parent run
`lapis-native-docs-prepare-75388ff1-e5e4-4276-990d-943c57105b02` at
`a19d79be904d6a02fc0a397a89851bcb9a267586` passes formatting, generated
progress, complete `pnpm spec:check`, spec-first, mdBook and all 78 specification
regressions. The five native-boundary regressions also pass. All 18 changed
native source/manifest/lock/pin paths remain byte-identical to full functional
revision `1bcf07270bdeef2bcac7b0422ee5b17077735790`; only governance/evidence
changed afterward. The missing mapping is closed, while its original failure
receipt remains retained. Final status/evidence generation is rechecked before
commit. Source qualification is complete; neither application host is selected.
