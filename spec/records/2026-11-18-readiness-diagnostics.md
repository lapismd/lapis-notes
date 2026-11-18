# Adopt qualified shared registry terminal diagnostics

This source-only follow-up consumes Lapis CI31, mergedc82f60f49933ef2e61aa53bbf11f556090476f5b
from immutable source89f3ede90d31058c59c771c86e433cee2bbd4407. It advances both
readiness composite action pins and NOTES_READINESS_SOURCE together. The
fixture refreshes the process-module hash and adds the diagnostics-module hash;
readiness and adapter modules remain byte-identical. All staging bounds and
integrity checks are retained, with no production download fallback or vendoring.

## Exact boundary and source evidence

The original three-file copied closure from the new immutable source fails once
under Node24.15.0 with ERR_MODULE_NOT_FOUND for registry-install-diagnostics.mjs.
The four-file production fixture then imports that exact source and all24 owning
verification/registry controls pass with zero skips or failures. The tests retain
strict no-retry behavior for missing packages outside the selected cohort, exact
identity/integrity failures and platform/deadline/process termination controls.

Source SHA256 values:

- registry-readiness.mjs:480cf7d558c4ad0aa7cc31330f5f6cdc9b75d716e8a394304918a17ead68e30c
- registry-install-adapters.mjs:4fe144e96ee430da4e500ab1f4798e94fd805b99c778e3c3aa8b72a42b5e233a
- registry-install-process.mjs:ca445f151fc65fccab0a0a1dc31aa640f6ee52cfad5c4cb78e6d8f7abd350c88
- registry-install-diagnostics.mjs:db5b913d442c4499b6998a9753991bd009766bcc443b8ed84ec38f359aba29e8

The shared source keeps raw bounded stdout/stderr available to its unchanged
classifier as nonenumerable properties. Its shallow JSON diagnostics retain at
most four typed terminal error records, removing URL credentials/query/fragment
and excluding arbitrary messages, environment, headers, stack and local paths.
The owner qualified21 focused/316 full/25 official npm protocol cases plus
hosted Linux/Darwin ARM checks. Notes owns only this immutable consumer intake.

## Validation and deployment boundary

Work is based on actual Notes main747a85555ab90dc0eb91efafaac169c233a3b6fb in a
Root-owned isolated Jujutsu workspace. The existing default checkout and unrelated
work are untouched. The T3 child attempt rejected cross-project selection and
created no child; the independent workspace belongs only to Root. The initial
workspace-add with ignore-working-copy created empty metadata then refused to
populate; selecting main from that new empty workspace completed isolation
without snapshotting or changing the original default working copy.

Normal frozen installation passes with unchanged manifest/lock/workspace and
existing build-script allowlist; the existing onnxruntime-node warning is not
suppressed or approved. SDK0.2.1 remains the latest Deno-free release. QMD search
passes and doctor has41 passes/one intentional routed-script alias warning.
The default Docker release-tooling lane passes223 cases with zero failures or
skips. The default Docker canonical lane passes all seven specification gates,
three view-command cases,20 Storybook-structure cases,68 specification regression
cases and App-ownership/metadata-query audits. Release configuration, workflow,
Desktop release policy, release-plan/version guards, actionlint and changed-file
formatting pass. Exact current-main-to-candidate spec-first also passes.

Both isolated Docker runs collect their reports and remove their workers through
the normal runner. A subsequent exact-name cleanup lookup finds the first worker
already absent and performs no deletion; no global cleanup, cache removal or
other checkout's container is touched.

Original Notes publication538bb469 and verification-only recovery44232734973
already succeeded. This change does not rerun or republish that release, change
versions/tags, alter audit decisions, enable Deno packages or infer its original
install failure cause. The110-second deadline, exact pnpm profile/backoff and
strict classifications remain unchanged. Fresh hosted candidate/main acceptance
is separate from the local source qualification; no live workflow was dispatched.
