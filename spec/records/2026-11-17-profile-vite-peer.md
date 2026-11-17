# App Profile Vite peer cleanup

The user approved removal of App Profile's optional Vite peer on 2026-11-17.
The baseline Desktop installed archive projection reports Picomatch through
`.>@lapis-notes/app-profile>vite>picomatch`. The helper is active: Notes Web,
Server and frozen Deno Vite configurations import it and declare Vite directly.
Removing the helper would remove supported build behavior.

LN-PKG-199 retains Vite as Profile development tooling, the Svelte peer and
all public helper exports/types. Only the optional Vite peer and its empty
metadata container are removed. The patch Changeset records release intent.
There is no runtime implementation, installed-data or native lifecycle change.

## Source evidence

All product commands use remote omarchy Docker, with frozen registry-only
installation and no source aliases or package patches added by this change.

- Exact command: `node scripts/validation.mjs run test:package-boundaries -- --test-name-pattern='App Profile keeps Vite'`.
  Turbo's existing Node test forwarding executes all four boundary tests.
  Before: three pass and the new metadata case fails in `669fd749-29cf-48fd-99eb-8dec329ddae0`.
  After: four pass in `051a4e21-2fb7-4e27-8cc2-4cf848504acd`.
- `check:all` passes in `478d26b7-9a2a-465d-b529-200a60680fad`:
  16 check tasks, 16 test/build dependency tasks and nine build tasks.
  Profile's 106 tests and Web's 39 tests run freshly; unchanged package tasks
  reuse the governed Turbo cache. Web's fresh production build passes.
- `ci:release` in `799b56ce-c31f-41cf-9e37-154ec5fea28f` passes
  196 release-tool tests, four package-boundary cases, nine local-consumer
  cases, the six canonical lanes and 27 package build/check/test tasks.
  It then stops at the intended release-preparation control requiring a
  committed source and empty working copy. Packaging is not yet qualified.

Failed attempts are retained in the
[exact source receipt](2026-11-17-profile-vite-peer-source.json).
The first full check rejects a 406-line chapter; the requirement was moved to
the owning App Profile chapter. The first release attempt rejects absent
mapped host/plugin-model chapters; meaningful host build ownership context
was added without weakening any mappings. Host QMD doctor still reports the
known Node ABI mismatch; the Deno-free 0.2.1 search uses its text fallback.

## Remaining boundaries

Commit the verified metadata source, then complete release packaging, built
helper type/build checks against host-provided Vite 6 and 7, and Desktop's
actual installed archive-projection audit. No production advisory exception is
authorized. Publication, registry-only host adoption, deployment and installed
application replacement remain separate. Server's unrelated dirty Terminal
work is preserved; this slice does not qualify a changed Server application.
