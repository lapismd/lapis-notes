# Published retirement guard cohort

This read-only audit corrects the earlier publication-pending checkpoint.
Publication is complete; Desktop released-package adoption and native/data
acceptance remain separate. No package was published or tag promoted by this
audit, and no core API service/function or Language Service wiring changed.

## Source and publication

Official npm supplies API `0.6.9`, UI `0.2.4` and App Profile `0.2.6` on `next`.
Their `latest` tags remain `0.1.0`; no tag promotion is inferred or requested.
The published source is Notes `538bb4697839a788f041e1830465907e10f50bba`.
[API release](https://github.com/lapismd/lapis-notes/releases/tag/api%400.6.9)
includes approved installer guard commit `34ea70e3`; the
[Profile release](https://github.com/lapismd/lapis-notes/releases/tag/app-profile%400.2.6)
includes approved peer cleanup `b3a93b2f`. Both and the qualified private source
`5ffb33c1` are ancestors of the published source.

[Release run 44232734973](https://github.com/lapismd/lapis-notes/actions/runs/44232734973)
published on attempt 1, job `134569657511`, at 04:11:30Z. Initial verification
job `134570828752` failed with `REGISTRY_INSTALL_FAILED`, exit 1 and empty stderr;
the retained log does not establish a deeper cause. Attempt 2 verification job
`134589031680` passed at 05:02:17Z, including a fresh published-registry consumer
Vite build and public specifier resolution. The workflow completed successfully
at 05:04:05Z. Publication and qualification attempts remain distinct; no source
fix or flaky-test classification is claimed for that failure.

## Artifact inspection

All three official tarballs match npm SHA512 SRI, SHA1, package identity, file
counts and unpacked size. Independently calculated SHA256 values also match the
GitHub release receipts:

| Package                    | Version | Tarball SHA256                                                     |
| -------------------------- | ------- | ------------------------------------------------------------------ |
| `@lapis-notes/api`         | `0.6.9` | `b3a7f248619da11d5641945d895ae77875b2c21cf644b30dfa1871fe9dd92303` |
| `@lapis-notes/ui`          | `0.2.4` | `0c76c9df4a30a04fc8ebc65c31f5b9854535154db4b88969597c00f8eb34aeff` |
| `@lapis-notes/app-profile` | `0.2.6` | `90eee3a9367cc4d115d28f06d5e5111399baa99f551cc361b6042fbd48e668b9` |

The API's 52 installer/distribution files and eight file-tools files are
byte-identical to qualified private `0.6.8`. Its export map is unchanged; generated
host-schema differences are API version literals. The published installer checks
retired origin before fetch and verified repository/package provenance before
staging. Registry, manual and trusted-adapter paths share that guard. Unrelated
plugins named `ai` retain their ordinary admission.

All 66 Profile payload files excluding manifest/changelog match qualified private
`0.2.5`, including 34 native-chat files and both build-helper files. Vite is absent
from peers, retained as a development dependency, and public exports remain.
Its API dependency is now `^0.6.9`.

UI `0.2.4` includes real CLI General/Advanced composition changes. Existing public
CLI registration/host signatures remain, but static compatibility does not prove
Desktop presentation, lifecycle or disposal. API requires UI `^0.2.4`, so intake
must qualify the three-version cohort together.

Official npm SLSA and publication attestation payloads name the same source and
publication attempt; subject SHA512 digests match registry metadata. This audit
parsed those claims and cross-checked the actual GitHub workflow and artifact
bytes; it did not cryptographically verify Sigstore bundle signatures. Raw
metadata, attestations, release observations and byte inventories remain in
task-owned ignored `released-cohort-provenance` and `released-cohort-audit`
directories. Historical private archives and prior receipts remain unchanged.

## Remaining acceptance

Desktop's temporary archive projection is not released-package adoption. Qualify
only API `0.6.9`, UI `0.2.4` and Profile `0.2.6` through normal npm ranges and
the actual installed public exports, including installer provenance, CLI settings
and disposal. Keep other package versions, all Language Service declaration,
archive/projection/build wiring and every Rust pin intact. No implementation or
generic core cleanup is authorized by publication.

Desktop #54's source-only native-chat collection preparation remains distinct
from native execution and old-data preservation. The original signed installed
copy, saved settings/controller identifiers/conversations/memory, disablement,
Safe Mode and cold reopen still require their owning acceptance. Pending native,
AI Host exception and Website preview decisions remain unanswered. Frozen-host
deletion stays gated and terminal retirement remains last.

## Documentation qualification

Pinned Prettier `3.3.3` and all 38 local link targets pass. Isolated omarchy
Docker `node scripts/validation.mjs run spec:check`, run
`20c7f78d-e4e8-4954-bd9f-8a1254616fcd`, passes all configured lanes and 68
regression cases at source `4653a260168ddda05d4348041f49fdce3295840c`, with zero
failures. Retired-source, App ownership and metadata-query audits pass. The frozen
registry install uses Node `24.15.0`, pnpm `10.34.5`, Spec Validator `0.2.1`,
two CPUs, 4 GiB memory and workspace-owned caches, with no private archive input.

Host specification search and doctor cannot locate the uninstalled
`spec-validator` command; text discovery is used without claiming semantic
retrieval or repairing global tools. This final qualification paragraph adds
evidence only; formatting and links are rechecked before commit. Hosted checks
remain separate. No product, manifest, lockfile, public contract or validation
command changes here.
