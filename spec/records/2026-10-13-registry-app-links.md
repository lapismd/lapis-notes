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

Notes and Registry changes will be committed separately through Jujutsu.
Qualified merges and registry deployment are already authorized. Complete CI,
including Notes native macOS/Linux and Web acceptance, must pass at the exact
reviewed head before merging. Registry `main` is unprotected, so completed-check
inspection and exact-head merge guards are required; auto-merge is not a wait
mechanism here.
