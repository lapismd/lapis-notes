# Released Desktop cohort: private UI field binding blocker

The [publication audit](2026-11-18-retirement-published-notes-cohort.md) remains
unchanged: the approved installer guard and Profile peer cleanup are published.
The subsequent real Desktop registry intake is not qualified. This checkpoint
records the newly executed consumer boundary, not another publication attempt.

## Exact consumer evidence

Workspace: `lapis-desktop-retirement-released-notes-cohort`, based on checked
Desktop `6d381bf074a65e81ced5a6cd452d0f886ef3927a`. Only API/UI/Profile are taken
from npm at `0.6.9` / `0.2.4` / `0.2.6`; five explicit private inputs remain:
Tasks, Workspace, File Explorer, Language Service and AI. Their original archive
hashes and source pins remain unchanged. No temporary npm-target archive
substitution qualifies the results below.

- Focused installed-public guard/schema run `02edc50c-7663-45b1-8677-cf62bca14a6c`
  passes ten cases at `e1dd591bcaf646ad8c0de24185bfaf9086d4d5d3`.
- Fresh probe `f7f3e18a-44bb-4869-b8c1-987d4f49c4a5`, source
  `85c9c1ef928b0cd9fd0fb85d9ce0c281ad63f765`, verifies one ordinary npm context
  each for API/UI/Profile and 15/5/2 import routes. Production audit has zero
  advisories; the full audit matches the existing accepted policy with no gate
  errors. No advisory exception is added by this work.
- Cold CLI application story run `f9f1da25-0bc4-4e97-9f34-1a44d67dae00`, source
  `d0a0ea137db888ad80fd471d07ddefd045838bcb`, fails one case with one unhandled
  error in desktop/light. Later modes do not execute and are not passing.
  Actual released custom-field rendering throws `CLI settings field host is
not bound` from `dist/cli/cli-settings.js` into `CliSettingsField.svelte`.

The initial story attempt joined fixture readiness before the actual rendered
workspace marker. Its separate failure is retained. Joining the existing
rendered readiness boundary exposes the product error above; no assertion or
deadline is weakened. Registration/disposal-only checks do not substitute for
the failed real General/Advanced render.

## Ownership and required next work

UI registers the raw custom field in a WeakMap, but the declarative renderer
passes a copied/reactive descriptor. A raw-object lookup cannot recover its
registration-owned binding. This is private UI binding/lifetime ownership, not
permission to alter core API services/functions or the generic renderer.

Prepare the narrow repair in the owning Notes UI package. Preserve public
registration/component signatures and exports, use the owned registration
instead of global IDs/App routing, and retain disposal fences. First reproduce
copied/proxied descriptors and actual declarative rendering against unchanged
source, then verify the owner and original cold Desktop scenario through packed
public output. Do not add a consumer shim or conceal the error with a fallback.

Broad consumer source/catalog qualification is held until the owner repair.
Owner source, packed consumer acceptance, hosted checks and any new package
publication remain distinct gates. Existing public UI `0.2.4` is not made safe
by static export inspection or the passing installer tests.

Keep all other package versions, Language Service declaration/archive/projection/
build wiring, Rust pins, future services and user data. No native/provider test,
installed-app replacement, package publication or core API implementation change
has occurred. Frozen-host deletion remains gated; terminal retirement stays last.

## Documentation qualification

Isolated omarchy Docker specification run
`e7204600-f197-4d18-bbe2-8ead170cd573` passes all configured lanes and 68
regression cases at source `a9ef5bf66db19bf868f373776180b0edb3073cd4`, with source, App ownership and metadata
audits passing. It uses Node `24.15.0`, pnpm `10.34.5`, Spec Validator `0.2.1`,
two CPUs, 4 GiB memory and workspace-owned caches. This is documentation
qualification, not a passing CLI product case. The final evidence-only paragraph
and links are formatted/rechecked before commit; no product or validation command
changes are included.
