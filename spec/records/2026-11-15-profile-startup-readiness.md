# Shared session interaction readiness

Server adoption of the public Profile candidate exposes a startup race in its
static 390px dark workspace: one failure and three passes in
`pnpm test:storybook:static`. The editor never appears after the story opens its
seeded file. The same consumer's 66 interaction/axe cases pass, so the static
failure remains an independent gate rather than being waived.

The session previously marked itself ready and exposed an interactive shell
before initial layout projection and the host callback finished. An early file
open could compete with those transitions. The new Notes `Host Readiness`
scenario holds the actual host callback and asserts both the session marker and
an inert ancestor around the real shell. Its baseline is one failed case with
three other family cases unselected.

The Profile now retains its established shell-rendering gate and separately
marks interaction readiness only after the layout flush and host callback.
The mounted shell is inert until then. Startup failure and lifecycle fencing
retire both states. No API contract, controller implementation, timeout, visual
baseline or validation rule changes. Fixture teardown releases its held callback
before awaiting the owned session's disposal.

All four rebuilt session stories pass. A preliminary rendering-guard rename
causes eight static composition findings; retaining the established render guard
and a separate interaction flag clears the existing audit without an exception
or rule change. Root check passes all 16 tasks, and the serial root unit graph
passes all 16 tasks covering 2,168 tests. The initial full catalog passes all 290
stories across 64 files, zero interaction/axe failures. The final rebuilt catalog
also passes all 290 stories, the cold Web lane passes all 13 journeys, and the
source-owned consumer pack produces all six archives. The specification gate
initially reports three missing mapped chapter updates; after truthful updates
to Deno, package and plugin-service chapters it passes every configured lane and
the App-ownership audit. Doctor passes 10 checks with one script-alias warning,
using the latest Deno-free validator 0.2.0 and Node 24; QMD semantic search runs.

The first source-owned consumer archive is Profile 0.1.0 from snapshot
`04edfce02f5e0cbb8a84dc2d69b974b687873c56`, SHA256
`3d21208cb9c786891c876791a6d5165d56386de388b9e6c34fa3f0d6956be71c`.
It is an explicitly temporary validation artifact, never a replacement npm
publication. The existing minor Changeset and this patch intent combine into
the pending App Profile 0.2.0 release.

The final official Profile archive has source snapshot
`3483df13f2f488687416a93eb74a9114e0c730e3` and SHA256
`63aab63cdfe465841dacb415b5b18c2043c9bbf2dcf13932642ee25a9b36a1a6`.
Server's source-owned temporary overlay installs only that Profile archive;
other dependencies remain registry packages and the tracked lock stays portable.
The snapshot includes an incidental generated Deno lock change that is restored
before committing; it does not alter the packed Profile implementation.

That exact consumer archive retains the original static result: three passes,
one narrow dark failure. Trace inspection identifies the immediate cause as
Server's story helper asserting the desktop-only `Server DB` footer in mobile
mode before opening the note. This is a separate Server-owned fixture defect;
the Profile interaction barrier has its own failing-before/passing-after held-
host regression and is not claimed to repair the footer assertion. Consumer
fixture repair and rebuilt static qualification remain independently recorded.

After the Server-owned helper opens the real mobile sidebar and retains the
desktop footer assertion on desktop, the exact rebuilt 390px dark static case
passes, followed by all four static Server cases. Source Storybook's static
build renders all 194 specification chapters. Its six applicable static
documentation journeys pass; two development-watch cases remain explicitly
inapplicable in static mode. Stories retain `visual-pending`; no visual baselines
are created or updated. Hosted CI and registry publication remain subsequent
exact-head gates.
