# Profile Core minimum dependency repair

Coordinator PR45 restores an already-required manifest minimum after an
incidental lock update. Its normal deployed run44034002231 succeeds and opens
genuine bot dependency PR150 at82a8d4802a0567dcbb11a186200ebcdb7f1569cb.
The reviewed change raises only Profile's registry Core declaration from
`^0.13.3` to `^0.13.4` and carries one normal Profile patch Changeset.
It does not lower or waive the retained publication floor.

## Exact before gate

Default Docker `pnpm spec:first --base 92f1cdbf276a1275370677bb35ccb5e08318099f
--head 82a8d4802a0567dcbb11a186200ebcdb7f1569cb` fails with five missing
canonical mappings: Architecture, Packages, Plugin Model, Web Host and the
frozen Deno host's shared-profile boundary. Add factual prepared-floor coverage
and owning verification/backlog evidence. Frozen Deno packages, tools, code and
lifecycle remain unchanged; its chapter is documentation of that boundary.
The package version stays0.2.4 until the genuine version workflow prepares its
next patch. No publication, tag change or installed-host adoption is claimed.

## Lock surface

No package entry or registry integrity is added, removed or changed. Only the
Profile importer changes. Native pnpm rebinds25 existing peer snapshots and
coalesces two Mira0.2.0 peer combinations into one already-present lint6.9.8 /
Tailwind4.3.5 combination. These versions already existed in the lock. This is
not proof of unchanged runtime module identity: complete affected source,
package, browser and cold catalog qualification is still required.

## Progress

The exact main-range gate now passes: two protected files and seven canonical
chapters, with zero missing mappings. All default Docker root lanes pass:
`pnpm check` (16 tasks), `pnpm test` (16 tasks, including Profile106 cases),
`pnpm build` (nine tasks) and `pnpm build-storybook` (six tasks). A fresh cold
`pnpm test:storybook` runs all four shards:105+73+48+62 =288 passing cases,
zero interaction or accessibility failures. The retained frozen-host build's
existing no-output warning is separate from successful package builds.

`pnpm spec:check` passes all six lanes, the three command-audit cases,21
Storybook-structure cases and69 specification regression cases, with the App
ownership and metadata-query audits retained. `pnpm release:check` accepts the
normal Changeset and verifies current canonical source versions without edits.
`pnpm test:specification:static` passes five browser cases with three existing
skips. QMD discovery and the local validator doctor pass. No test, assertion,
threshold or visual baseline changes.

The PR remains draft until these same source additions are committed and its
final head acquires fresh hosted checks. Keep the existing LN-CAT-121 hosted
quarantine explicit: a skipped hosted interaction job is not a passing result;
the288 cold local cases supply actual interaction evidence. Genuine release
preparation, npm publication and coordinator retirement/replay remain separate
following steps.
