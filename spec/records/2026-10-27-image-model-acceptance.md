# Actual-image model acceptance (Phase 2)

Recorded 2026-10-27. This qualifies the optional actual-image model tester
committed as unverified draft `c64391fd` and reruns the basic image proof with
fresh Phase 2 receipts. It extends the
[hosted Rust default cutover](2026-10-27-rust-hosted-default-cutover.md)
evidence; older basic-run receipts are retained unchanged and are not relabeled
as model proofs.

## Result

Against the actual native image
`sha256:884c3028708c3e005430d667953abefbe1196170bf65ed2a35bb4a344acbdfbd`
with the pinned tool image
`sha256:9fa6f3fb3c8787ac38334c121bce350f005454b079e4dbe090d5c10a6d460be9`:

- Basic rerun: **16/16 checks passed** (runtime UID/GID1993, no Node/Deno and
  read-only application, two authenticated browser journeys, exact volume
  bytes, two clean process exits). Receipt:
  `.local/server-container/controller-phase2-basic-8f77d640-fce0-4cdc-9d58-35cbaefc72aa/acceptance/acceptance-c51f8d5b-e7c8-44e9-889f-a29e34463c3b/`.
- Model run (`LAPIS_SERVER_TEST_ONNX=1` plus an absolute
  `LAPIS_SERVER_TEST_ONNX_RUNTIME`): **23/23 checks passed** — the 16 basic
  checks plus six qualified offline assets seeded as UID1993, a separate model
  vault through admitted HTTP, offline population of six exact documents,
  qualified vectors/fingerprints/ranks with unchanged query revision, passive
  detach plus fresh admission preservation, and cold-process offline reuse of
  retained model state. Receipt:
  `.local/server-container/controller-phase2-model-ab489074-dd49-4641-a269-08cc32af37d9/acceptance/acceptance-673c0e0c-b6ed-40dc-ab2d-12b5e6c2c97b/`.

Model state: `transformers-js`, `Xenova/all-MiniLM-L6-v2` revision
`751bff37182d3f1213fa05d7196b954e230abad9`, dtype q8, 384 dimensions,
`allowRemoteModels:false`. Seeded packet: 6 assets, 69,513,684 bytes,
manifest `8a8805cafada25a40daaaf582226e11399a22db6570399a558cc2574e931ddec`.

## Inputs and identities

All model inputs were verified byte-exact on the controller host before
transfer; nothing was downloaded. The two oracle fixtures match
`MODEL_REFERENCES` (`fc735637…` legacy, `4a5c1718…` Linux
x64/ORT1.30/AMD-7800X3D). The five cached assets under
`.local/search-models/Xenova/all-MiniLM-L6-v2/` match the legacy fixture's
sizes/SHA-256. The Linux runtime is the qualified ORT 1.30
`libonnxruntime.so.1` (45,828,512 bytes,
`ffb75a925ba05e47b235bb66e3e3911714a80b328a9c9425539feb204aa32a23`) preserved
from the final-main worker inputs. The browser-side qualified reference
assertions (linux/x64/7800X3D) ran on the actual Docker host.

The private Phase 2 controller
(`.local/r7-cutover/image-acceptance-phase2.py`) extends the retired
`image-acceptance.py` transferred set with the draft's `model.mjs`,
`model-assets.mjs`, `seed-model.mjs`, both oracle fixtures, the cached model
tree and the runtime `.so`, checksum-verifies every transferred file on the
remote side, and streams back fresh receipts per run. It executes the committed
`scripts/server-container/test.mjs` harness unmodified except for the repair
below.

## Harness repair (draft defect)

The first model attempt failed with 0 checks: the draft created the UID1993
seed helper container `--read-only` and then copied the verified packet into
`/input` on its rootfs, which the daemon rejects ("container rootfs is marked
read-only"; the harness surfaced it as a transfer EPIPE). Failed-run receipt:
`.local/server-container/controller-phase2-model-a2e7534e-fec0-4317-93dd-748c74f65789/`
(retained as evidence). Fix in the owning source
(`scripts/server-container/model-assets.mjs`): the disposable seed helper drops
`--read-only`, matching the existing browser-driver container precedent; it
still runs as UID1993 with all capabilities dropped, mounts only the owned
test volume, and `seed-model.mjs` still writes exclusively `/data/models`
(0700/0600, exclusive-create). The passing 23-check run above is the
regression evidence; no assertion, guard or check was weakened.

## Boundaries and remaining work

Basic and model acceptances are separate proofs; the ordinary image lane stays
valid without model inputs. ONNX remains opt-in and off by default, so
ordinary `pnpm test:server:container` behavior is unchanged. Hosted GitHub CI
execution of the image lane remains a separate release-input gate (frozen
registry installs still require publication; unpublished AgentUI 404 is
recorded in the cutover record). Phase 2 lane totals are tracked in
`MIGRATION.md`.
