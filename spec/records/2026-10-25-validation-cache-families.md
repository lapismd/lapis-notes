# Independent JavaScript and native validation caches

Status: all source, tooling, aggregate catalog/static and specification gates
pass. This changes test infrastructure, not runtime application policy or
native ownership.

## Observed boundary

Notes previously used one dependency key for pnpm, Deno, Turbo, Cargo and both
declared Rust target directories. Adding the exact Tasks parser source pin cold-busted
all six stores. Changing a UI archive also invalidated Cargo even though native
source and locked dependencies were unchanged. Source runs retain the original
combined key and resulting cold install/compiler work.

A private cache plan now separates JavaScript inputs (pnpm lock and package
archive identities) from native inputs (both Cargo locks and exact native source
identities). Both include the immutable tool-image identity and remain isolated
by workspace. The native companion actually uses the root Cargo target via the
ancestor Cargo configuration, so the unused companion-target mount is removed;
both locked graphs still fence the shared output. UI-only workers mount no native
volumes. Workers start the selected immutable image ID rather than a mutable tag.
Inputs are read from the
transferred source revision, rather than a lockfile that could change after the
snapshot. Reports record both keys. Cargo retains ordinary source fingerprint
validation. No active cache is deleted, copied or shared across workspaces.

The first real normal-lock refresh exposed a second coupling: image fingerprints
included application manifests/locks that Docker never copies. A new isolated
image/cache boundary regression fails once against those original inputs. It
passes after fingerprinting only the Dockerfile and self-contained tool installer,
plus architecture/target; mutations to either real build input still invalidate
the image. The JavaScript lock changes its own cache without changing the native
cache or tool image. Final tooling now contains 65 cases.

## Before and after

The initial exact target is
`node --test --test-name-pattern='UI archives preserve' scripts/validation-cache.test.mjs`.
It first fails because the new private boundary is absent. Factoring the old
combined-key algorithm into that boundary gives one pass and four failures
across the five cache scenarios. This reproduces actual cross-family key
invalidation, omitted Cargo-lock identity and transfer-path/order churn.

After separating the inputs, the exact target passes one case, and the complete
cache family passes five cases with zero failures. It covers both Cargo locks,
native source changes, UI archive and pnpm-lock changes, immutable tool images,
transfer relocation/order, UI-only mounts and workspace isolation. Assertions
remain unchanged. The complete runner/lease/source/composition suite passes all 64 cases locally.
The default Docker rerun passes all 64 cases at
`3582469c-a628-49ac-b281-df784ce6081d`. Permission-denial and real Chromium/WebKit
smoke pass at `4919972d-7fbc-44aa-a093-33fff60c2a1f`. The real cold old-cohort
preview acceptance also passes 25 cases at `9af76135`; its later candidate
failure is attributed to the owning Bits source in the separate runtime receipt.

The final 65-case Docker tooling gate passes at
`1e569d52-5a0f-454e-99d0-2fe232488574`. Refreshed-cohort full `check:all` passes
at `1c52e431-fcf6-459b-9fb7-33edc1892cfd`: 344 Rust cases (six inherited ignores),
2,209 JavaScript cases (one inherited skip), all checks and builds. The independent full native run `5805e4f1` and this aggregate
retain native key `13975a67b2b57cb4ccf4` across the JavaScript dependency
refresh; UI-only runs omit native mounts.

## Remaining evidence

The final aggregate interaction attempt `d5f135fa` stops before collecting any
case: its raw Storybook runner bypasses Turbo's API build prerequisite, leaving
`@lapis-notes/api/build-tools/vite` unavailable in the fresh worker. The exact
five-case public test command passes on the same ten-package cohort at
`d1bd4b44`; that dependency-aware command builds the required output first.
Both aggregate Storybook lanes now call their public build/test commands inside
the worker, retaining native worker selection and the existing Turbo graph.
The unchanged aggregate interaction and static commands are rerun cold; no
fixture, import alias, assertion or browser diagnostic is relaxed.

The exact repaired aggregate interaction command passes at `218bbebd`: all 261
catalog cases and eight development specification-browser cases. The cold static
aggregate `13a81f21` also passes its complete build and six static browser
cases. Its first attempted concurrent dispatch is correctly refused by the
existing workspace lease; it starts only after the interaction worker completes.
No lease is bypassed and no Docker failure falls back to the host.

Record final refreshed source/catalog qualification before committing this slice.
Existing R3 production code
and host-selection gates are unchanged. Registry-only package installation and
actual native/provider acceptance remain separate gates.

## Final source admission

The post-bootstrap Docker tooling run `db9d1eab-0258-4f58-8d98-ed360dbd099a`
passes all 65 cases. Final `pnpm spec:check` at
`128b6d72-ab20-435a-b4a8-5530b4bc5ed6` passes all canonical, mdBook, spec-first,
App ownership, metadata and specification-regression gates. Later activity,
timestamp and evidence updates change no production, test or tool behavior.
