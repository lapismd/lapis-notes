# Plugin-heavy startup and install queue

The hosted reproduction used the public ARM64 Server image `45f4c1b` on local
Docker context `desktop-linux`, with an installed-plugin-heavy vault. Server
owns transport/container acceptance; this record qualifies the Notes source.

Initial startup produced 4,879 fetches over approximately 42 seconds, including
2,532 commands, 1,558 database requests and 724 plugin-file reads. A separate
capture isolated approximately 1,495 metadata point reads. Packed identity
repair reduced those point reads to 42, but content fallback polling still
recursively statted installed plugin assets and accumulated over 70,000
requests while the workspace stayed open.

The repaired source reuses the paged identity inventory, excludes only the
installed-plugin asset tree from content discovery and watching, and limits
ESM diagnostics to eager imports/re-exports. Settings under `.lapis` remain
loaded; direct plugin adapter reads remain available. User enumeration filters
retain their existing behavior.

Plugin actions now enter an App-owned FIFO with an immediate independent
progress item. Different plugin rows remain actionable while another install
runs; queued cancellation does not cancel an active install or its successor.
Native AI is registered by default for Rust hosts, while explicit persisted
choices and trust/safe-mode admission remain authoritative.

Regression history:

- Unchanged 24-file startup: 48 redundant identity point reads before, zero after.
- Three original API regressions and overlapping-controller regression failed
  before repair and pass after; the affected API files pass all 42 cases.
- Installed-asset content scan: one failing regression becomes passing.
- Wider settings coverage caught five regressions from an overly broad state
  directory exclusion; the final exclusion is only `.lapis/plugins` and all
  six settings-persistence cases pass without changing assertions.
- Eager-source traversal has two tests; the actual plugin-manager startup
  regression confirms a lazy chunk is never read only for diagnostics.
- Full source check, test (2,094 cases), build and specification lanes pass.
  Cold catalog passes all 272 interaction/accessibility cases over four shards; six fresh public export archives were packed for separate host acceptance.

Why previous tests missed this: they checked values and lifecycle correctness
without a realistic installed chunk tree or per-file request-count assertions.
The new regressions assert the absence of redundant reads and plugin-asset
stats, rather than only asserting eventual workspace readiness.

The original Docker vault qualifies the packed source after a one-time identity migration: the next cold workspace open takes 7.24 seconds and issues 373 fetches before the shell is ready (212 commands, 56 database calls, 96 plugin/file reads, 9 other). The initial repaired open tombstones 733 previously indexed plugin assets and remains more expensive; subsequent startup metadata reads stay bounded. The executable is the unchanged public ARM64 image with qualification static files mounted read-only.

The real Server consumer also opens the retained workspace in production and
cold development builds. Native Terminal execution and the default AI ribbon
are checked by its fresh-profile browser scenario. Terminal renderer remount
and development optimizer reload defects are fixed separately in their owning
Terminal UI and Server sources.
