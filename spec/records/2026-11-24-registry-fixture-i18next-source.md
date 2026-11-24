# Patched Plugins tooling for the signed registry fixture

Notes API peer-support PR 198 initially fails its real registry-fixture audit on
GHSA-6jcc-5g8w-32mx from the pinned Plugins source's direct i18next 25 dependency.
The failed job is
https://github.com/lapismd/lapis-notes/actions/runs/45294152418/job/138110415437.
No audit exception or retry can fix that source graph.

The owner fix is lapismd/lapis-plugins PR 178, immutable source
`355d194af1345bbd1830dff4ca53eccac69f9813`. Its private development range selects
patched registry 26.7.2, with zero unignored advisories and the existing ignored
low finding unchanged. All 17 check tasks, 17 test tasks, 16 build tasks,
package checks and four spec lanes pass. The complete cold catalog passes 410
interaction/accessibility cases across 71 files and eight shards.
A clean isolated owning checkout also packs and verifies all 16 payloads and
prepares 16 test-signed registry releases. Those source receipts remain distinct
from Notes' consumer fixture and hosted Web acceptance.

The workflow advances only the exact Plugins validation candidate. It retains
the source identity check, retirement guard before install, frozen install,
ordinary audit, publication-prerequisite lookup, full build/pack/verification and
test-signature preparation. Native engine and production publication authority
remain unchanged. The root-only temporary published API peer warning is recorded
upstream while this API's compatible patched-peer contract awaits publication;
no peer-validation configuration is weakened.

Consumer workflow/spec checks and exact-fixture Web acceptance follow below.

## Consumer qualification

The committed Plugins source prepares all 16 test-signed releases and its
fixture metadata binds exactly `355d194af1345bbd1830dff4ca53eccac69f9813`.
Notes' focused workflow/fixture transport suite passes **72 tests**, the complete
release suite passes **219 tests**, and complete spec checks pass, including
spec-first and 68 specification-tool cases.

The first local Web command stops during preparation before collecting browser
cases: the host checkout still has old App Profile build output and cannot
resolve its declared browser-presentation export. Restoring all workspace
packages in normal CI order passes nine build tasks. An incidental generated
Deno lock metadata refresh is discarded from this scoped change. The exact
Web acceptance command then passes **13 of 13 cases**, including installed
plugin workers, verified registry installation/Settings state, PWA persistence,
Bases editing and secondary-tab ownership. `CI=true` forbids reusing a running
server, and the fixture source is explicitly checked against the pin.

Exact consumer command:
`CI=true LAPIS_PLUGIN_CANDIDATE_COMMIT=355d194af1345bbd1830dff4ca53eccac69f9813 LAPIS_WEB_REGISTRY_FIXTURE=<isolated-checkout>/.release/registry-acceptance pnpm test:web:e2e`.
The isolated checkout is source-owned and uses generated test-only signing
keys. Hosted exact-head qualification and public API publication remain pending.
