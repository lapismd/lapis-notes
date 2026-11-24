# Signed fixture standalone audit follow-up

Notes PR 198's original registry fixture audit fails on the owning Plugins root
localization dependency. The first reviewed owner fix repairs that root graph,
then Plugins CI's separate private Sync audit exposes the same advisory in its
independent lockfile (job 138126157509, PR 178).

Plugins source `7cb788d8848bbd94d8576687cf34dd51a4b80d80` explicitly supplies
patched i18next 26.7.2 in both private development graphs. The exact standalone
audit changes from one moderate finding to zero; root audit retains only its
existing ignored low finding. The portable standalone checks/build pass with
zero type/Svelte errors and all 326 tests across 19 files; package lint and both
retirement guard regressions pass. The active source's earlier 410 catalog cases
remain qualified separately. Legacy private API peer warnings remain visible;
Sync stays excluded from runtime release and Changesets.

Notes advances only its immutable candidate source. The source identity,
retirement guard, frozen install, ordinary audit, publication prerequisites,
package build/pack, payload verification and test-only signing remain unchanged.
No production signature, plugin release or registry dispatch is authorized.
The focused workflow/fixture transport suite passes 72 tests with zero failures.

The clean owning checkout regenerates and verifies all 16 payloads and creates
16 test-signed releases bound to the exact new source; frozen root and standalone
installs and both audits pass there as well. Complete Notes release tooling
passes all 219 cases, and canonical specification checks pass, including the
68 specification-tool cases. An initial concurrent release-tool command hits
the workspace's Docker lease exclusion before tests start; rerunning the same
portable command after the specification lane completes passes. No native
fallback or lease guard change is used.

Exact-source Web acceptance passes all **13 cases**, including verified plugin
installation, worker startup, Settings state, persisted navigation, PWA reload,
Bases editing and secondary-tab ownership. `CI=true` requires a cold server.
The command deliberately uses CI's native validation runtime after the portable
source/release lanes pass, with the source pin and fixture path explicit:
`CI=true LAPIS_NOTES_VALIDATION_RUNTIME=native LAPIS_PLUGIN_CANDIDATE_COMMIT=7cb788d8848bbd94d8576687cf34dd51a4b80d80 LAPIS_WEB_REGISTRY_FIXTURE=<isolated-owning-checkout>/.release/registry-acceptance pnpm test:web:e2e`.
The final direct spec validator passes 174 chapters and 1,287 requirements;
all changed consumer documents and workflow pass Prettier. Hosted final-head
qualification and public API publication remain separate, pending gates.
