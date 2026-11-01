# Dependency automation cache fixture regression

LN-ARCH-146 retains the real public validation controller in temporary cache
fixtures. Its Docker adapter imports the dependency-bot policy module, so the
fixture must copy that module alongside the controller and lane modules.

The hosted unit lane failed in `release:test`, then its fail-fast step cancelled
the workflow. The same cache-routing regression failed locally once with
`ERR_MODULE_NOT_FOUND` for `scripts/dependency-automation/spec-policy.mjs` on
Node 24.15.0. Copying the real dependency-automation directory into the isolated
fixture fixes the import without changing production routing or assertions.

Validation on the repaired candidate:

- The exact `local public test routing hits cache` regression passes: one test,
  zero failures. It still proves cache hits, source invalidation, failure reruns,
  forced execution and live acceptance.
- All files selected by `release:test:run` pass on Node 24.15.0 and the repository
  pin pnpm 10.34.5: 100 tests, zero failures.
- An initial broader local invocation inherited a mismatched host pnpm and
  failed six cache fixtures. The explicitly pinned rerun above replaces that
  environment result; no package-manager check or test assertion was relaxed.

Hosted CI must pass before merge. This fixture repair does not qualify product
browser behavior, native delivery, package publication or deployment.
