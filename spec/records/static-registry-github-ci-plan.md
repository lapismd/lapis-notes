# Static registry integration and GitHub CI plan

The user paused final local verification on 2026-10-12. The task changes are
committed and integrated into the default workspaces. No GitHub push, package
publication, signing workflow, registry dispatch, deployment, or visual baseline
update is authorized by this handoff.

## Integrated repositories

| Repository      | Default workspace          | Integrated change                                                                                                                             |
| --------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Lapis Notes     | `lapis-notes`              | `txxznsov`: Plugins view, API-owned schema, registry details, host readiness and macOS bootstrap repair; preserves the existing main lint fix |
| Design Core     | `design-core`              | `kpkvkppn`: safe areas, settings typography, line-tab indicator, teleport teardown and cold catalog preparation                               |
| Lapis Plugins   | `lapis-plugins`            | `sqmkvprm`: static release qualification, parked Community exclusions, AI readiness/model refresh and History chrome; preserves Sync planning |
| Static registry | `../lapis-plugin-registry` | `nymuyrwy`: revived Astro registry, shared API schema, media, filters and download statistics                                                 |

Each local `main` bookmark points at its integration. Archive bookmarks preserve
both the review tips and previous default states. Community runtime and
Nostr/relay discovery remain deferred; Community presentation references do not
reactivate its runtime. Older unrelated release, Sync and Community workspaces
are preserved.

## Push sequence after approval

1. Fetch the GitHub remote through Jujutsu and inspect new upstream commits,
   branch protection, package availability and the CI prerequisites. Reconcile
   upstream changes without dropping the locally integrated commits.
2. Create a `review/static-registry-v2` bookmark from local `main` in each of the
   four repositories. Push that bookmark and open a PR to GitHub `main`, using
   `origin` for Notes, Design Core and Plugins, and `github` for the static
   registry. The registry's `origin` is the older Forgejo remote.
3. Let PR CI verify the candidates. Do not push directly to remote `main` for
   the first verification: Notes and Design Core also have main-triggered
   release and Storybook Pages workflows; the registry has a gated
   main-triggered Cloudflare deployment.
4. Resolve each CI failure in its owning repository. Require actual execution
   of all required jobs; a green aggregate with deferred/skipped jobs is not
   final verification. Keep per-repository counts and retain candidate artifacts.
5. Merge PRs only after required CI passes and any remaining review gates are
   accepted. Package publication and deployment require a separate release
   approval, dependency order, and production credentials.

## Current CI coverage and work still needed

| Repository  | Existing PR checks                                                                                                                                                                   | Remaining coverage or prerequisite                                                                                                                                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Design Core | `ci.yml`: governance, quality, units, static catalog, Storybook interactions, Workspace/Shell/Shadcn/AI browser suites, full/production audits and aggregate validation              | Verify a fresh catalog using the final `.js` helper imports. The full aggregate was not rerun after the final infrastructure/spec updates. See `registry-ui-ci-handoff.md`.                                                                                                                |
| Notes       | `lapis-ci.yml`: governance/release intent, quality/ownership, units, static catalog, full interactions, package/artifact planning and aggregate validation                           | Add validation-only full web acceptance and native packaged jobs; these are absent from the current PR workflow. macOS needs a cold first launch without refresh, URL handoff, controller/tool/service checks and clean close. Add Linux packaged acceptance with its native dependencies. |
| Plugins     | `ci.yml`: build cache, audit/package/spec checks, units/release tests, static catalog, full interactions, pack/archive verification and release planning                             | Jobs are gated by `FRAMEWORK_PACKAGES_PUBLISHED` plus npm availability of API `0.1.1` and AI Controller. The aggregate intentionally succeeds when all functional jobs are deferred. This is not acceptance.                                                                               |
| Registry    | `checks.yml`: frozen install, strict remote artifact validation, generation/signatures, statistics, Astro check/build, unit/browser tests, formatting and generated-tree consistency | API `^0.1.1` must expose the new registry subpaths. Strict remote checks require published signed bundle origins; local review fixtures cannot prove production origins.                                                                                                                   |

Clean CI cannot consume ignored checkout-specific hooks or local tarballs.
The Design Core source changes and new API contracts must be validated before
consumer release qualification. To run cross-repository CI before publication,
first add an explicitly documented validation-only artifact lane that builds and
installs exact source candidates without modifying committed npm ranges or
lockfiles. Otherwise consumer qualification must wait for separately approved
upstream releases and dependency refreshes. Do not disable audits, ownership,
signature, strict remote, or prerequisite checks to obtain a green run.

## Local evidence and review status

Before integration, Notes recorded 18/18 root check tasks, 18/18 test tasks,
1,246 tests, 10/10 build tasks, 54/54 affected stories, 243/243 full stories and
10/10 web tests. The subsequent desktop regression changed from one failure
and four passes to 5/5 passing focused tests; desktop tests recorded 218 passes
with one existing skip. A fresh macOS arm64 ad-hoc package passed its first cold
smoke without refresh. Those results precede this merge and do not establish
final verification of the integrated tree, Linux acceptance, production signing
or notarization.

Design Core's latest focused catalog source tests passed 5/5 and serial cold
pointer reproduction passed 2/2. Full checks stopped on missing mapped spec
updates, now included. The final helper-import adjustment still needs a cold CI
run. UI stories remain visual-pending and no baseline update is included.

The four task review workspaces are retired after owned servers stop. Their
complete directories, including ignored evidence, fixtures, dev data and local
hooks, are preserved in macOS Trash under timestamped names. Existing local
installs may reference the retired paths: refresh them through released npm
packages or a documented validation setup before restarting review services.
