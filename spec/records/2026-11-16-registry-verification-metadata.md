# Registry verification metadata freshness

Release run `43800122156` published API `0.6.6` and App Profile `0.2.3` from
`1e49d75421899183cb4f0fb14ae613a172872eeb` under their existing next tags.
The first verification attempt could not install API `0.6.6` after all five short
probes, reporting `next` as `0.6.5`. No PWA, package build or publication job failed.
This observation alone does not distinguish registry propagation from a stale
local metadata cache.

The verifier now gives every install attempt a new temporary pnpm metadata
cache and removes it afterward. Its content-addressed package store, exact
package-manager pin, approved dependency-build policy, selected versions,
integrity checks and retry delays remain intact. Only pending-version lookup
failures can retry; unrelated failures still stop immediately. No publication
is retried by this verifier.

Two public-entrypoint regressions initially failed: stale shared metadata and
a pending first lookup that populates a negative cache. Both pass with isolated
per-attempt caches and cleanup; existing unrelated-error and bounded-retry
controls remain. A real pnpm `10.34.5` install accepts the documented cache-dir
setting. It rejects npm's prefer-online flag, which was discarded before commit.
The [pnpm 10 cache documentation](https://pnpm.io/10.x/settings#cachedir) identifies
package metadata separately from the content store.

Registry read-back checked both downloaded npm tarballs against the original
retained candidate bytes, SHA256 and SHA512 integrity. Only the failed jobs were
rerun: attempt 2 verified the registry consumer and created
[API 0.6.6](https://github.com/lapismd/lapis-notes/releases/tag/api%400.6.6) and
[Profile 0.2.3](https://github.com/lapismd/lapis-notes/releases/tag/app-profile%400.2.3)
at the same source. No candidate was rebuilt or uploaded again. This hosted
recovery used the unchanged older verifier; source-hardening deployment remains
separate acceptance on its actual PR head.

## Source qualification

The two exact public-entrypoint regressions change from 0 passed / 2 failed to
2 passed / 0 failed. Full default-Docker `pnpm release:test` passes all 124
cases, retaining the unrelated-install-error and retry-exhaustion controls.
Default-Docker `pnpm spec:check` passes, including 69 specification-policy cases,
App ownership and metadata-query audits. The mapped release chapter remains
400 physical lines and all changed canonical pages retain their byte caps.

A fresh real consumer using the hardened source entrypoint also passes against
the retained publication manifest for API `0.6.6` and App Profile `0.2.3`, plus
unchanged framework versions read from the repository. The explicit native
probe uses Node `24.15.0`, pnpm `10.34.5`, and no user npm configuration. It runs
the verifier's actual registry installation, Vite build and public import/CSS
resolution checks; it performs no publication or candidate rebuild.

The first native probe stopped immediately on `ERR_PNPM_ENOSPC` in the host's
inode-constrained `/tmp`. The verifier removed its consumer and metadata cache;
this unrelated failure was not retried as pending registry propagation. One
rerun of the unchanged source with an owned `TMPDIR` on the home filesystem
passed and removed its temporary consumer. That environment correction neither
changes the tool nor waives an assertion.

Markdown/source formatting and semantic QMD discovery pass. Spec Validator
remains the latest Deno-free `0.2.0`; doctor passes config, QMD/native, book and
skill checks with the existing intentional wrapper-alias warning. Both pnpm
audits exit zero under existing policy; production has zero findings and the
all-dependency metadata retains the existing ignored development-only LOW
advisory. No audit policy, package, lockfile, Changeset, runtime or frozen host
changes are included. Hosted source-PR qualification remains distinct from the
already completed publication recovery.
