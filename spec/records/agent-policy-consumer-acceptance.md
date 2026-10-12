# Agent policy consumer acceptance

The smoke harness requested optional `thinking: medium` from ACP sessions whose
catalog did not advertise thinking configuration. Its new capability regression
failed before implementation; all five smoke harness tests now pass. Native Codex
retains medium. ACP requests medium only when an advertised thinking option offers
that exact value. Explicit unsupported-configuration tests remain unchanged.

Three real Lapis consumer probes passed against the freshly compiled controller:
Codex Native, Codex ACP, and Cursor ACP with `LAPIS_AI_SMOKE_CURSOR_MODEL=auto`.
They verify scoped notes_search/read, one approved application edit, fixture file
content, and provider switching. The first Codex ACP file-write attempt completed
without the expected file content; the repeat verified bytes and succeeded.
That failed attempt is not counted as a pass. Native Codex reported the documented
Default-mode structured-input limitation, so this is not structured-input acceptance.

Cursor advertises `composer-2.5` but rejects explicit session/set_config_option
for that model with ACP -32602. Default Cursor probes failed twice. A direct host
configuration probe confirmed the rejection; Auto acceptance does not establish
support for explicitly selecting that model. The shared controller separately
passed eight real Ask/Allow all turns across Native Codex and Codex, Cursor and
OpenCode ACP, verifying exact file bytes and automatic versus manual decisions.

The complete AI browser family passed 49 interaction/accessibility cases in a
fresh process. The initial run had six History failures after Vite reoptimized
nostr dependencies and invalidated the axe-core module URL; the restarted complete
family passed. The source check passed all 18 tasks. The complete Lapis browser lane passed 211 tests across four fresh shards, and
all ten root build tasks passed. Aggregate unit and packaged acceptance remain
separately recorded below.

Temporary package acceptance uses the ignored hook documented in
[agent-ready-schema.md](agent-ready-schema.md), updated to select
`/tmp/community-agent-alignment/community-comments.tgz` from Community commit
`40d8419e`. Canonical manifests and lockfiles retain their registry ranges.

Desktop production build passed. Normal packaging cannot resolve the unpublished
`@lapismd/ai-controller` registry dependency. A disposable Deno import map to
extracted built Controller and Redaction tarballs produced an ad-hoc-signed app,
but its runtime retained the canonical npm constraint and failed before readiness.
This is a failed packaged acceptance, not a release-ready build. No app was
installed, notarized, or published. The temporary map and wrapper are retained at
`/tmp/community-agent-alignment/desktop-acceptance/`.

The root unit aggregate reproduced the existing application-profile mismatch:
source includes Community as a fifth enabled plugin, while LN-PLUG-006,
LN-DENO-006, LN-WEB-004 and the focused profile test require four. The exact
`packages/app-profile/src/index.test.ts` regression fails once. This consumer
profile choice is separate from the optional smoke-configuration correction.

A follow-up packaging probe supplied both the disposable Deno configuration and
import map explicitly. The ad-hoc app still failed before readiness with the same
unpublished controller constraint. Manual node-modules mode stopped earlier on
missing `dotenv` for extracted redaction, then `@lezer/highlight` in the API graph
when using the staged package dependency tree. These do not establish packaged
acceptance. Deno automatically added a `workspaces` field during the manual-mode
attempts; those tool-owned manifest edits were restored. Registry resolution and
the separate default-plugin profile choice remain open.

## Native transcript follow-up

The refreshed Community package is installed from
`/tmp/community-agent-alignment/native-transcript/lapismd-lapis-community-0.1.0.tgz`
using the same temporary Notes hook and `LAPIS_PLUGIN_TARBALL_MANIFEST`.
This follow-up includes native checkpoint record parity and deterministic
same-second assistant ordering. The cold Workspace Shell and Lapis Editor Demo
families pass all 20 browser interaction/accessibility cases. The first attempt
had 14 failures after Vite optimized Nostr dependencies and reloaded the test,
invalidating axe-core's URL and one active editor scenario; the fresh process
passed the same targets unchanged. No assertions or accessibility rules changed.

The first-party Community plugin separately passes 17 unit tests, check, build,
publint, and both cold production composition stories against the refreshed
Community package. Its temporary validation hook retains both existing patched
Bits UI versions after an unlocked install reported an unused 2.19.0 patch.
Consumer source, manifests, lockfiles and patches were unchanged. Earlier real
provider results were not rerun for this rendering-only follow-up.

The refreshed source check completed all 18 tasks. All ten root build tasks also
passed without cache reuse (11m55s), including the web and desktop production
builds. Logs are `/tmp/lapis-native-transcript-check.log` and
`/tmp/lapis-native-transcript-build.log`; the successful cold browser retry is
`/tmp/lapis-native-transcript-browser2.log`. Deno generated lockfile bookkeeping
during these local checks; that drift was restored before committing this record.

## Pause checkpoint, 2026-09-24

The user requested saving and consolidating current work, with further validation
deferred. Source checks/builds and the browser results above are complete; the
four-versus-five default-plugin choice and packaged startup remain unresolved.
Do not change the canonical profile expectations without resolving that choice,
and do not treat the temporary-map compiled app as a working installed build.

The companion Community fixes are being integrated from `agent-comments` into
its default checkout. The current Community aggregate passed 1,168 unit tests
(two skips) and 586 standard browser cases, then failed seven of 67 Docker browser
cases. Its remaining Docker/project/consumer/build and actual relay-to-site smoke
acceptance is deferred. The full resume checklist and local artifact paths are in
the sibling `lapis-community/docs/development/agent-alignment-validation.md`.
Heavy Docker and desktop/web builds should run serially after the observed memory
pressure. No package publication, installed app replacement or service restart
was performed for this checkpoint.
