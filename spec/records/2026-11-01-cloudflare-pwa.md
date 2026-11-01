# Cloudflare PWA release qualification

The production target is `app.lapis.md`, Worker `lapis-notes-pwa`, account
`e6eb0e8393a8f29ae153e31fa11babc8`, zone `c2970f6b1ef92f3b4355d5c8dd3b0125`.
The source base is `ff088a423a939fe3c08406aebbe95c795f290f47`.
Design Core 0.10.0 was published from
`af1e766c2a8c93a10b22a236f33f426989da1186` after source PR #57 and version PR
#58 each passed all eleven protected gates. Trusted publication and installed
package/provenance verification passed in run 41313143170. Notes consumes that
published version through normal registry ranges and its portable lockfile;
active public package ranges admit it alongside previous supported versions.
The frozen excluded Deno desktop host remains outside this browser change.
Production cutover remains pending.

## Source and artifact checks

- Focused PWA geometry/state/persistence boundary: initially 9 tests passed.
  Two additional geometry regressions exposed unavailable measurements reserving
  the whole viewport and loss of a trailing clearance when leading controls were
  present (2 failed / 5 passed). Both were fixed in the web host: 7 geometry and
  11 focused PWA tests now pass; the complete web suite passes all 46 tests.
- Root check: all 16 Turbo tasks passed. Specification, mdBook, protected-path
  and 67 governance regressions passed.
- Pinned Node 24.15.0 root unit lane: 2,079 Vitest tests passed; all 16 Turbo
  tasks succeeded. A preliminary Node 26 run had two existing Daily Note Intl
  fixture differences; their exact regressions and the full lane pass under
  the pinned CI runtime. No fixtures or assertions were changed.
- The final simultaneous check/unit attempt exhausted two existing 5-second
  test budgets (API declaration generation and completed journal receipts).
  Both exact isolated regressions passed unchanged; serial full root check and
  unit lanes then passed all 16 tasks each. No assertions or timeouts changed.
- Three packaging/HTTP integration tests passed: deterministic gzip, source/PWA
  identity, real >25 MiB streaming WASM compilation, conditional, HEAD, range,
  MIME, isolation, caching, deep-link and missing-asset semantics.
- Prepared Worker typecheck and dry-run passed with published Core 0.10.0;
  its provisional validation SHA is `eeeb64f153f880a026827856cc907ce6996a44a1`.
  A final committed candidate must be rebuilt and retested by protected CI.
- Exact prepared-artifact acceptance passed in Wrangler: fresh OPFS vault,
  cross-origin isolation, vault text search, verified Word Count installation,
  service-worker plugin asset caching and offline activation, offline reopening,
  offline compilation of oversized WASM, waiting-worker update prompt, Later session
  preservation, save refusal and edited-note persistence through acceptance.
  This complete acceptance and the legacy fixture passed again with Core 0.10.0.
  The local update fixture changes the worker revision; live follow-up
  qualification must demonstrate two actual main builds.
- Turbo dry-run comparison confirmed the build SHA changes the web cache key
  while all five dependency build keys remain reusable.
- `actionlint` passed for the reusable and production workflows.
- Package policy exposed the new Cloudflare lane missing required same-run
  failure cancellation (release regressions: 99 passed / 1 failed). The lane
  now uses the existing cancellation step; its exact regression passes.
- The cold focused workspace shell family passed all 6 stories. Full refreshed
  consumer/package/browser qualification remains pending.
  Screenshot comparisons and baseline updates are excluded by request.

## Legacy installation fixture

`node scripts/qualify-legacy-pwa.mjs <frozen-legacy-dist>` exercises the frozen
legacy browser app, creates a browser vault and note, installs its service
worker, then switches the same HTTP origin atomically to the new prepared assets.
Acceptance uses the legacy app's actual Install Now prompt. The original browser
context, OPFS, service-worker registration and caches are preserved. No storage
or caches are cleared. The new app opens the existing vault and reads identical
note content. This passed against the retained legacy artifact:

| Asset      | SHA-256                                                            |
| ---------- | ------------------------------------------------------------------ |
| index.html | `094927bfb125a1acb2df64758ec8bf77603599ea0742c0488c3a9b386aec82ed` |
| sw.js      | `ff440b4a0da1a8571329ecbc5ca0f7639f526beecc5b56e369cbae84243d8f37` |

This is artifact provenance, not a claim that the old build represents legacy
HEAD. The fixture covers the OPFS Browser Vault; it does not qualify the retired
LightningFS New Legacy Vault. Initial attempts to mutate a running Wrangler
fixture produced inconsistent update activation; the retained fixture switches
immutable directories atomically. Production HTTP semantics are separately
qualified against Wrangler.

## Credentials and previous domain configuration

The `web-production` GitHub environment is restricted to `main`, has no reviewer
gate, and contains the account ID variable and deployment-token secret. Only
secret names were inspected. Application runtime secrets are unnecessary.
The token grants account Workers Scripts Edit, and zone Workers Routes Edit plus
Zone Read. The existing Wrangler OAuth login was refreshed.

Before cutover, `app.lapis.md` is a proxied CNAME to `server.ju.ma`, TTL Auto
(`ttl: 1` in Cloudflare's API). Type, target and TTL were supplied by the user;
Cloudflare anycast A responses independently confirmed proxying. The hostname
returned HTTP 503. The zone has no Worker routes, and this hostname has no
Worker custom-domain binding. The unrelated `ju.ma` → `well-known` binding
must be preserved. DNS API access through local OAuth returned 403, so the
user-supplied target is the rollback source.

## Publication and live receipts

Pending: refreshed consumer acceptance, temporary workers.dev
qualification, installed macOS Chrome, main landing, custom-domain cutover,
production smoke and a subsequent automatic main deployment. Deployment workflow
artifacts retain before/after deployment lists, source SHA, version/deployment
IDs and an exact previous-version rollback command for 90 days.

## Installed-app qualification follow-ups

Notes PR #66 passed all eleven gates in CI 41315755628. Its exact tested merge
artifact bdc3ca962ed20a4d9075211bd29bf4641fc2ea5b was deployed on workers.dev
without rebuilding; all 598 non-configuration files match the downloaded
artifact. Remote browser/offline/plugin/search/WASM and edge HEAD/304/range,
deep-link and missing-asset checks passed. Native Chrome geometry and public
tokens agreed at 1200x954 and 1728x1000; the user confirmed draggable empty
chrome and clickable controls.

The user identified a missing divider when the left sidebar closes. Design Core
owns its repair under DC-WS-084; Notes must consume the published patch before
cutover. Appearance qualification also reproduced a separate host defect:
updating the workspace setting to Dark left the inherited document light.
The focused old-artifact regression failed after ten seconds waiting for Dark.

The web host now applies the ready workspace's canonical appearance, observes
system changes and saves the startup choice. Startup and launcher reuse the same
class application; observers stop when their owning surface leaves. Hosted
runtimes retain host ownership. Prepared-artifact acceptance passes explicit
light/dark, dark startup after reload, explicit choice overriding system, system
media transitions and metadata matching actual header paint. The same run
passes offline reopening, verified plugin activation, oversized WASM compilation
and deferred/refused/accepted update persistence. Root checks and units pass all
16 tasks each (2,079 tests); the complete build passes all nine tasks.

Final dependency adoption, fresh protected CI and production qualification
remain required. Local behaviour-validation metadata using the parent SHA is
provisional and must not be deployed as a production artifact.
