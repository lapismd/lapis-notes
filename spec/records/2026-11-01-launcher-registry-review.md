# Vault chooser and registry loading review slice

The isolated Notes workspace is
`/Users/stevejuma/Documents/Codex/2026-11-01/ca/work/lapis-notes`,
change `rkmrzxpo`, based on `d0109315`. This slice implements LN-WEB-090
and LN-PLUG-125 for local Storybook review. It has no merge or deployment receipt.

The browser chooser adapts the desktop chooser's bounded logo, header, cards,
button geometry and compact recent rows. Component-owned native CSS supplies
the presentation in both Storybook and the web host. Browser services retain
vault/profile, appearance, picker, transfer and session ownership. Storybook
injects isolated services and never modifies the reviewer's real vaults.

Initial registry catalog/detail loading uses public Design Core Skeletons.
The layouts reserve identity, card/list, banner, overview and metadata space,
provide one accessible loading status, and honor reduced motion. Empty and
failed states retain their existing illustrations and actions. Held snapshot
metadata requests render the real restored Plugins view and abort on teardown;
they do not substitute a separate Storybook screen or change signature checking.

Review remains pending at `http://localhost:9710/`:

- `workspace-web-vault-launcher--empty`
- `workspace-web-vault-launcher--recent-vaults`
- `workspace-web-vault-launcher--manage-vaults`
- `workspace-plugins-registry-snapshot--loading-landing`
- `workspace-plugins-registry-snapshot--loading-directory`
- `workspace-plugins-registry-snapshot--loading-details`

The existing four loaded snapshot scenarios remain available. New visual
stories retain `visual-pending`. No screenshot comparison or baseline update
was performed. The server was restarted through its checkout-owned supervisor.
Launcher Docs use isolated 700px frames; interaction plays run in standalone
canvases so simultaneous Docs examples do not compete for keyboard focus.
The rendered Show Code snippet and disabled injected-service control were
checked in the browser, and refreshed Docs reported zero runtime errors.

## Verification receipts

- The loading illustration regression failed with zero skeleton elements;
  the corrected regression passes (one failure to one pass).
- Chooser preview validation initially had two failing interactions; the final
  three scenarios pass creation, opening, import, searchable recents, rename,
  and return behavior. The search root supplies its public accessible label;
  plays wait for overlay teardown and use their owning document.
- Affected snapshot family: seven stories pass, including all three held
  loading layouts. Combined focused interaction/accessibility run: ten pass.
- Complete workspace package suite: 39 tests pass. Complete web package suite:
  46 tests pass, including the picker assertion updated for its private service
  boundary. Both package checks pass without Svelte errors or warnings.
- Root checks: all 16 Turbo tasks pass. Root build: all nine tasks pass.
- Pinned Node 24.15.0 root unit lane: all 16 tasks and 2,080 tests pass.
  The local Node 26.9.0 runtime reproduces two existing Daily Note Intl
  whitespace-reference differences; both exact cases pass under Node 24.15.0.
  Reference fixtures and assertions remain unchanged.
- Full Storybook coverage passes across four shards: 102, 70, 46 and 57 cases
  (275 total). The first fourth-shard attempt passed 52 cases before its browser
  connection closed while starting the unchanged Desktop Recovery story.
  That exact story passes in isolation, and the complete fourth shard passes
  on retry with no assertion or timeout change.
- Light and dark loading presentation was inspected in the browser. The preview
  was returned to light mode and the server retains its loopback-only binding.
- Static Storybook build passes all five Turbo tasks, including the index check
  for all 194 specification chapters. Full specification/mdBook/spec-first
  checks and all 67 governance regressions pass.
- A workspace patch Changeset records the registry fix; release intent passes.
  No package was published.

Initial simultaneous broad lanes collided on generated package output. They
were stopped and rerun sequentially. Incidental Deno lockfile pruning from
validation was discarded; application manifests and lockfiles remain unchanged.

## Review approval and release intake

On 2026-11-01 the user approved the Storybook slice and instructed release.
The two reviewed source changes were rebased without conflicts onto production
main `5013c0707997e3cb38908c312a652634109ca0b4`, which contains the intervening
package-version publication. Protected CI must qualify the exact rebased head
before automatic production deployment. Screenshot comparisons and baseline
updates remain excluded; visual tags stay pending their separate baseline lane.
