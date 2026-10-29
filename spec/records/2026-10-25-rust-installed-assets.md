# Rust installed-plugin delivery — R1.3.9.3

Status: Complete. Qualified 2026-10-25 05:44:38 UTC. Notes parent `0453a79d`; change `znknnwpr`.
LN-CORE-004/007 and the managed-vault contract govern this retained scope.
Installed byte delivery, release download and signed installation qualification
are distinct; R6 transactions/recovery and R7 final delivery remain separate.

## Before and current narrow evidence

- Native `plugins` target, exact
  `installed_modules_use_the_admitted_native_owner_and_fingerprint`: one failure;
  the module route returns 404 instead of 200. After implementation it passes.
- Desktop original `plugin_assets` target: all seven cases pass before extraction.
- Core `plugin_assets`: three cases pass after extraction, including the
  independent public UTF-16 fingerprint, byte/metadata refusal and confinement.
- Native `plugins` family: both initial asset cases pass, including GET/HEAD,
  range, conditional freshness, native writes, detach, auth and profile privacy.
- Web `src/hosted/rust/plugin-assets.test.ts`: three cases pass.
- Cold built-browser `authenticated installed modules load through the built
Rust browser origin`: one failure before the Vite asset proxy, one pass after
  (3.9s). The browser imports the module, then proves detach fences fresh reads.
  This is authenticated module delivery, not signed installer qualification.
- Native `cookie_module_requests_keep_session_origin_and_version_fences`: passes;
  cookie module requests need no custom version header, while stale versions,
  foreign origins, other sessions and logout retain their fences.
- Intermediate extraction attempts exposed a misplaced module doc comment and
  a missing private Desktop type import. Both are corrected; no compatibility
  re-export or duplicate engine is retained.

## Implementation and remaining work

The native verifier is extracted from Desktop's `src-tauri/src/plugins/assets.rs`
at its existing baseline. Core retains file coordinates, current metadata,
complete installation fingerprint and byte SHA-256 validation. Metadata reads
are capped before allocation; linked/special assets fail closed. Desktop keeps
URL/origin/resource admission and response policy. HTTP reads use the admitted
shared native writer and release it before returning owned immutable bytes.

The Rust browser adapter implements the existing public asset-server contract.
URLs carry the current client admission and complete installation fingerprint;
relative chunks share that identity. Both Rust Vite profiles proxy the public
asset route to the selected native service, without a service worker or Node
fallback. The existing installer, signature verification and Plugins screens
remain authoritative.

Release download now stages complete bounded snapshots, restricts initial sources
and HTTPS redirect hosts, and forwards no caller credentials. Three real-network
unit cases pass (allowlist, header/chunk limits, interrupted body). The route's
unapproved-source regression changes from 404 to the required 400. The initial
three browser distribution-adapter cases pass. Their initial mock returned non-JSON for DELETE;
returning the actual empty detach response repairs those three fixture failures.
The Web check first found six type errors from assuming a general Fetch Request
input. Following the existing SDK string-URL contract clears those errors:
59 Web cases pass at that checkpoint without a public API change. The official
mirror regression brings the final distribution family to four and Web total to 60.

The first real signed UI journey reached the Plugins homepage but looked for the
directory-only search field. Existing navigation fixes that locator. The next
attempt installed successfully but exposed the current official registry mirror,
`https://registry.lapis.md/download/<plugin>/<version>`, outside the release
proxy's initial allowlist. Admit that exact first-party route in both adapters;
the original proxy-response assertion now passes. The cold signed installation
and actual service restart pass in 11.5s with genuine public signatures and
ordinary Plugins UI. The expanded journey passes in 14.6s: disable and
re-enable persist the enabled list; uninstall removes installed metadata and
changes a freshly admitted, previously working module URL from 200 to 404.
The URL is captured after the actual restart, so stale-client fencing cannot
stand in for uninstall qualification.

The first complete source test run passes. Its following check finds one authored Clippy
`unused_io_amount` error in the download fixture. Assert the actual positive read
count: all three exact download cases pass after that repair. The complete
source check now passes, including strict Clippy and all twenty package tasks.
The eleven build tasks, 60 Web unit cases, complete Web check and specification
check also pass. No suppression or timeout/assertion weakening is used. The final
catalog/native test gates pass; the Desktop consumer commit remains separate.
Desktop's existing database/backup working change and its pre-existing
Markdown-image gate are retained. No Lapis AI source
change is made.

## Validation scope

- Source: `CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 pnpm check`, `pnpm test`
  and `pnpm build`: twenty package check/test tasks and eleven build tasks
  pass. Final native tests pass 283 ordinary cases and doctests, with five
  existing optional model cases ignored.
- Web: `pnpm --filter @lapis-notes/web test` and `check`: 60 unit cases,
  strict Svelte/type/e2e checks pass.
- HTTP download regression:
  `pnpm rust:core -- test -p lapis-server http::plugins::bundles --locked`:
  three pass after handling the fixture's actual socket read count.
- Signed UI:
  `node node_modules/@playwright/test/cli.js test -c playwright.rust-server.config.ts -g 'retained Plugins UI'`:
  install/restart first passes in 11.5s; expanded lifecycle passes in 14.6s.
- `pnpm --filter @lapis-notes/web test:e2e:rust-server` rebuilds the renderer
  and service before the complete cold lane: all five pass in 34.6s, including
  configured-vault saves, managed-vault lifecycle, folder/ZIP transfers,
  authenticated modules and real signed plugin lifecycle across restart.
- `pnpm test:storybook`: all 261 interaction/accessibility cases pass across
  four shards (93 + 71 + 42 + 55); no baseline is changed.
- `pnpm spec:check` and changed-file `prettier --check` pass.
- Desktop source compatibility: the original seven `plugin_assets` cases
  pass before and after extraction. The full Rust `--lib --tests` run passes
  235 cases with two existing helpers ignored. This records the uncommitted
  consumer snapshot separately; it does not qualify or commit its pending
  database/backup application intake or final app bundle.

`R1.3.9.3` and its retained-shell parent R1.3.9 are Complete at these original
source and staged-host gates.
R6 installation transactions/recovery, R7 final delivery, and the Desktop
Markdown attachment gate retain their separate statuses. No deployment,
publication, baseline approval or installed-app replacement occurs.

## Final-run resource finding

The first final `pnpm test` rerun reaches 31/32 HTTP cases, then the unchanged
33 MiB rejected-database-upload case receives macOS error 55, `No buffer space
available`, from Reqwest's request-body writer. The earlier complete source run
passed all 283 cases. Its exact isolated rerun passes (one case, 1.34s):

`pnpm rust:core -- test -p lapis-server --test http_files database::database_json_has_its_own_bound_without_raising_the_file_command_limit --locked -- --exact`

No product code, payload, expectation or deadline changes. The complete rerun
with `RUST_TEST_THREADS=2` passes all 283 ordinary Rust cases/doctests and
twenty package tasks, including all 60 Web cases. The bounded run executes
the original oversized-request assertion; its earlier failure remains recorded.

The final status-paragraph edit briefly raises the canonical architecture chapter
to 401 lines. Concise equivalent prose restores its 400-line limit; the complete
specification check is rerun without weakening the limit or dropping requirements.
