# Registry plugin app links

The registry's Install in Lapis action opens the selected release through
`lapis://plugins?id=<id>&version=<version>`. Its More actions menu offers the
registered `web+lapis` handler for Web-compatible releases, archive downloads,
and the existing file-installation help. Pending or unavailable releases keep
their disabled installation action.

The default application profile registers the disposable `plugins` URL action.
It validates coordinates, opens or reveals the owning Plugins leaf and retains
the selected version in persisted navigation. Unknown releases remain unavailable
until the user explicitly chooses latest. Links never install, transport an
archive URL or change registry trust. Historical installation retains the
selected version and the existing confirmation and verified distribution flow.
Bundled plugin guards remain in force.

Existing installed clients need the updated app build to recognize this action.
The native smoke proves delivery to a running packaged process; OS default
handler registration is unchanged. The Workspace patch Changeset records the
public navigation change. This slice does not publish npm packages or dispatch
plugin releases. Registry site changes do not alter generated signed metadata.

## Local evidence

- App-profile URL registration and disposal: two missing-handler failures before,
  then two passing regressions; complete App Profile suite passes 12 tests.
- Navigation and persisted version: two failures before, then two passing
  regressions; complete Workspace suite passes 25 tests.
- Historical installation: one failing story before, then passing with an exact
  `0.1.0` install request while a newer update is available. Strengthening its
  final installed-state assertion exposed one additional fixture failure:
  reinstall appended a duplicate record instead of replacing the installed
  version. The shared fixture now respects version options and replaces that
  record; the stronger story passes and waits for confirmation cleanup.
  Recovery-target acceptance then reproduced one failure: selecting `0.2.0`
  installed the update's pinned `0.1.0` target. Update delegation now requires
  the requested version to match both latest and the update target; the exact
  story passes with the installed record at `0.2.0` before the historical install.
- Plugins, Plugin Management and Registry Snapshot: 56 interaction/accessibility
  stories pass. Both new app-link stories retain `visual-pending` and public
  Show Code; no visual baselines were generated or approved.
- Root `pnpm build`, `pnpm check` and `pnpm test`: 10, 18 and 18 tasks pass.
- Web `plugin-app-url.spec.ts`: two cold cases pass. Full
  `node scripts/run-web-registry-acceptance.mjs` with the exact-source signed
  fixture passes 12 cases.
- Fresh Deno 2.9.7 ad-hoc-signed macOS arm64 package passes packaged smoke,
  including a secondary launch with
  `lapis://plugins?id=spellcheck&version=0.1.1`. The actual Plugins leaf state
  matches both coordinates and exactly one leaf exists. Production signing and
  notarization were not configured or used.
- Registry primary-link regression: one failure before, then passing. Complete
  `pnpm check` passes 82 script tests, 20 browser cases, Astro check/build,
  signature verification, statistics, generation and formatting. Strict remote
  verification passes all retained archive contracts.

The first complete Notes Storybook run passed 243 stories and failed two AI Shell
first-pointer interactions (`Local Conversations` and `Follow Scope`) because
the page still had `pointer-events: none`. Both exact stories pass in isolation;
the complete Shell family passes 9/9 and the original fourth shard passes 54/54
on fresh runs without source changes. These transient overlay failures are
separate from the app-link assertions. Final full-suite and CI qualification
remain required before merging.

The subsequent complete four-shard run passed all 245 stories. Public Show Code
was verified in the fresh static Docs build for historical and unavailable
coordinates. Final review then added the recovery-target regression above;
its directly affected and complete lanes are being rerun for that final change.

The final affected-family run passes 56/56 and rebuilt Web acceptance passes
12/12. The rebuilt ad-hoc macOS package passes cold secondary-launch smoke;
static Storybook passes its build and six static navigation/accessibility cases
(two development-only cases are skipped). An overlapping Web package rebuild
interrupted full Storybook qualification after one Explorer Opening Vault startup
timeout. Its exact cold reproduction passes without a source change: 154 seconds
of module import and under two seconds of test execution. Full qualification is
being rerun with this checkout's package output stable; timeouts and assertions
remain unchanged.

Final stable qualification passes all 245 Storybook interaction/accessibility
stories (86, 65, 40 and 54 per shard), alongside the final 56 affected cases,
12 Web cases, macOS cold packaged smoke, root check/test/build and specification
checks. The initial AI pointer failures and later overlapping-build startup
timeout do not recur. Generated API version-only drift is excluded from the
source change.

## Publication

Final review reproduced an inherited-name failure (`constructor`): one story
failure and one runtime error. Release selection now requires an indexed own
entry; `constructor` and `toString` remain unavailable until explicit latest
selection. The exact story passes with zero errors, all 56 affected stories pass,
and Workspace check, 25 tests, build and publint pass.

Opening an app link with Settings visible reproduced one unit and one story
failure because Settings remained open. Successful navigation now closes the
owning Settings dialog; rejected and disposed navigation leave it open. The
extended story also exposed one fixture startup failure: it reported readiness
before host plugins completed registration, allowing a queued layout projection
to restore the old landing route. The fixture now awaits controller startup
before reporting readiness. The exact historical release story passes; final
affected stories pass 56/56, all 245 complete interaction/accessibility stories
pass, and root check/test/build pass 18/18, 18/18 and 10/10 tasks. Full Web
acceptance passes 12/12. The static catalog, six navigation/accessibility cases
and rendered public Show Code for both app-link stories pass; two development-only
cases remain skipped.

The final packaged run exposed native URL delivery before the vault host had
subscribed: the renderer drained and acknowledged the native queue without
calling the plugin handler. Four cold runs reproduced the missing Plugins leaf.
The delivery queue now waits for subscribers, retains fetched batches across
subscriber replacement, preserves order, serializes reads and cancels on renderer
disposal. Two focused regressions fail before and pass after; all six delivery
tests initially pass. A late subscriber at promise settlement then reproduces
one failure; its repair also preserves the read-error retry regression after
one failing rerun. All seven delivery tests pass. Desktop check and 226 tests
pass with one existing skip. Two rebuilt
macOS cold runs pass the original exact Spellcheck 0.1.1 leaf assertion and clean
shutdown. Temporary diagnostic fields and output are removed.

Registry changelog list continuations are separately merged and deployed in
[PR 19](https://github.com/lapismd/plugin-registry/pull/19). Two renderer regressions
and the Source Editor browser regression fail before and pass after; independent
CI passes 84 script tests and 20 browser cases. The live page now retains the full
sentence inside one bullet. Registry app-link PR 18 is rebased on that deployed
fix and passes 84 script tests, 21 browser cases and complete GitHub checks.

Notes and Registry changes use separate Jujutsu commits.
Qualified merges and registry deployment are already authorized. Complete CI,
including Notes native macOS/Linux and Web acceptance, must pass at the exact
reviewed head before merging. Registry `main` is unprotected, so completed-check
inspection and exact-head merge guards are required; auto-merge is not a wait
mechanism here.
