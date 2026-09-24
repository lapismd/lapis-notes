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
