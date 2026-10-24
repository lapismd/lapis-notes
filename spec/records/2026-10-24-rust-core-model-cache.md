# Native Search runtime and model cache

## Boundary and before state

R3.1.18 adds installation/cache admission for the existing native encoder,
inside the already accepted database embedding worker. No host selects the
native database in this slice. The initial exact test stopped at the 30 GiB
guard; after free space recovered without deletion, the same target produced
one compilation error because `NativeEmbeddingHost::managed` was absent.

```sh
pnpm rust:core -- test -p lapis-app-core --test embedding_cache --locked managed_cache_is_lazy_and_offline_missing_assets_do_not_fall_back
```

After implementation the exact case passes, as do all ten cache/HTTP unit cases.
All four actual-model targets pass with fresh native downloads; the new cache
target independently launches a cold child process for offline inference.
The source gate is complete in this enclosing change. Consumer compatibility
and actual host selection remain separate follow-up gates.

The first specification run after offline qualification stops at the disk
guard. A later run reaches spec-first and reveals the tracker's status JSON was
mapped to canonical policy changes, unnecessarily requiring a policy rewrite
for every status update. One exact policy regression reproduces that failure.
Routine progress data now follows root `MIGRATION.md`'s documentation treatment;
the generator and all native implementation retain their protected chapters.
Progress metadata/drift checks remain required. The exact regression and the
complete specification suite are rerun; no product gate is waived.

The first broad check catches one Clippy finding in the new HTTP fixture: its
request read did not consume/check the read length. The fixture now reads
complete headers within a fixed 4 KiB bound; no assertion or source warning is
suppressed. The exact cache/HTTP target and full checks are rerun afterward.

## Implementation

Native installation policy admits an existing physical cache directory outside
vaults. Only the built-in MiniLM q8 identity/revision is selected from portable
configuration. Native paths, download URLs and libraries remain absent from
transport DTOs. The production asset catalogue is independent of test fixtures;
a conformance case checks the model metadata against the retained reference.

Content-addressed files retain pinned byte counts and SHA-256 digests. Cache
verification precedes loading. An installation lease serializes competing
workers; private staging, bounded response reads, digest checks, file/parent
sync and atomic replacement prevent partial downloads from becoming assets.
Offline configuration performs no fetch and reports missing/corrupt files.
Accepted work owns progress and inference through publication after detach.

The HTTP client uses HTTPS only, five redirects, a 15-second connection bound
and a 180-second request bound. Error messages omit URLs and native paths. The
lease wait is bounded too. This is a synchronous native client within the
existing blocking worker, not another background scheduler or JS runtime.

## Pinned sources

The model is `Xenova/all-MiniLM-L6-v2`, revision
`751bff37182d3f1213fa05d7196b954e230abad9`, q8. Its five asset sizes/digests
match the already-qualified model reference. Files come from that exact
Hugging Face revision; no floating branch is downloaded.

The CPU runtime is `onnxruntime-node` 1.30.0's raw native library from its pinned
unpkg path. Darwin ARM64 bytes match the installed qualified runtime:
44,589,928 bytes, SHA-256
`685d2be5dba1309c89d3a5324b7fd06a5c42f1a61bfea32d14c4cc28d072121d`.
Fresh HTTPS responses also verify the pinned Linux ARM64 and x64 bodies against
their registry metadata. These byte checks do not qualify Linux inference or
packaging; R7 retains those gates. Other platforms fail explicit admission.

## Qualification and remaining work

Root source check passes all 20 tasks (11 fresh, nine cached), including strict
workspace/all-target native Clippy and source boundaries. Ordinary Rust passes
216 cases, zero failures, with the four asset-dependent cases ignored there and
executed separately. All 20 JavaScript package test tasks reuse their verified
cache results; no JavaScript runtime or API implementation changed. Production
Rust build passes; all eleven JavaScript build tasks reuse verified cache output.
Normal offline qualification also passes all four actual-model parent targets,
including the independently launched cold child. Full `pnpm spec:check` passes
all ten lanes, ownership/metadata audits and all 49 specification regressions.
The tracker-policy regression improves from one failure to zero; all eleven
tracker cases pass in that full lane. Both existing original native file/model
gates and application adoption remain independent of this source receipt.
`pnpm test:search:onnx --download` exercises native HTTPS installation into a
fresh disposable cache; its normal mode seeds verified existing test assets
and stays offline. Both modes run cold-process offline inference afterward.

The live `--download` run passes in 31 seconds across all four parent targets.
The new managed-cache target completes native HTTPS installation, observable
fractional download progress and accepted indexing after the request waiter is
dropped, then reproduces the pinned vector offline in a separate process.
Logs: `.local/embedding-cache-exact.log`, `.local/embedding-cache-unit.log` and
`.local/embedding-cache-real-download.log`.
Offline/model and full-source logs are `.local/embedding-cache-real-offline.log`,
`.local/embedding-cache-check-final.log`, `.local/embedding-cache-test.log`,
`.local/embedding-cache-build-final.log` and
`.local/embedding-cache-spec-complete.log`. Initial failures remain in the
corresponding before/check/spec logs. No visual baseline was changed.

Under standing cache-cleanup approval, 159 obsolete Rust cache files
(1,533,609,326 bytes) were removed from the inactive Notes target before broad
qualification. Source/features/profile/compiler/configuration matched retained
newer variants. No compiler or candidate open file was active; inode, length and
mtime were rechecked. Models, runtime assets, app binaries, vaults and profiles
were preserved. Inventory: `.local/embedding-cache-removed-rust.json`.

After the full Rust suite compiled its workspace feature graph, the next build
stopped at the disk guard. With the compiler/tests terminal, another 217 older
matching cache variants (4,109,198,425 bytes) were removed using the same checks.
The build then passes. Inventory:
`.local/embedding-cache-removed-rust-after-test.json`. Logs retain both the guard
stop (`.local/embedding-cache-build.log`) and successful retry
(`.local/embedding-cache-build-final.log`).
After offline qualification, four obsolete model-test executables
(314,149,920 bytes) were removed with the same inactive/open-file/identity checks
to restore the guard headroom. No model/runtime data was deleted; inventory is
`.local/embedding-cache-removed-old-model-tests.json`.

R1.3 still requires vault-lifetime database ownership and both adapters, retained
hosted shell acceptance and backup after detach/Quit. Unattended indexing and
the remainder of R2–R7 remain open. M11 is Deferred; no publication, signing,
deployment or installed-app replacement is authorized by this source slice.
