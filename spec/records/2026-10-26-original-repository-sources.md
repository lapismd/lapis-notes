# Hosted immutable original repository sources

## Scope and source ownership

This slice implements LN-CORE-024, LN-SRV-029 and LN-WEB-075 on the qualified
backup/CORE026 cohort `2da05804`. The existing immutable JJ History engine,
Repository components, source picker, tab policy and preparation queue remain
in use. Notes owns native source admission and the hosted transport adapter.

Discovery inspects an existing physical JJ workspace and creates no repository,
backup, cache or grant. Opening it mints one opaque original token per admitted
client. Original and managed histories have independent identities, generations
and handles while sharing the existing native worker and preparation capacity.

Original generations include physical source witnesses. Replacing metadata
cannot bind a fresh client to an old source epoch. A detected altered or
symlinked witness permanently fences that client's original grant, including
when the old bytes or directory are restored. Original access is independent
of paused or failed managed capture; it cannot initialize, capture, restore,
adopt or fall back to another source.

The existing protocol exporter's schema contract is separated from declaration
emission to preserve the native 300-line boundary. Its public export remains
reachable; no lint suppression or validation change is introduced.

## Before and focused evidence

All commands run from frozen source in bounded Docker workers on `omarchy`.
The private validation setup retains registry manifests and uses the current
16 qualified prerequisite archives, including History `e714935f`.

The exact initial regression was:

```sh
pnpm rust:core -- test -p lapis-server --test http_files discovery_of_paused_original_source
```

Frozen `074fa272` returned HTTP 404: zero passes and one failure. Frozen
`b499418a` passed the same target. Expanded coverage additionally exposed and
repaired a test assertion using QueryInfo instead of the Status snapshot, and
a linked-workspace fixture that incorrectly replaced an already-admitted root.
The production root replacement fence was retained.

The current owner gates cover:

- Eight original-source HTTP cases: read-only discovery; separate managed and
  original handles; foreign/stale scopes; per-client retirement; failed/paused
  managed capture; metadata replacement epochs; auth/origin/body/override
  rejection; plain folder/Git non-initialization; internal/shared layouts;
  external head advances with pinned reads; and durable witness revocation.
- Five existing Core History cases, one admitted HTTP reader case and three
  backup-control HTTP cases.
- Eight new Web source/transport cases and all 67 affected History/Rust adapter
  cases. Frozen `62f75331`, receipt
  `e34041ec-c7b2-444f-8d87-f6cdc3947afc`, passes those cases, public dependency
  builds and Web source/e2e strict typing.
- Frozen `1899ce66`, receipt `3f95097c-7f73-4d9e-a580-aa937dd02829`,
  passes native protocol generation, Rust source/dependency boundaries and
  workspace Clippy with warnings denied. The initial exporter line limit, schema dead-code
  visibility and two HTTP/backup lint findings were repaired at their source.

## Fresh retained-browser acceptance

Frozen `75e6abb7d25b4c586073c7d9a4104895edddce7f`, receipt
`ab2246a7-6b05-4ca8-aacd-cbd130f12c5b`, passes the exact cold-browser
journey in 12.4 seconds against a freshly built retained renderer and native
server. It proves source switching, separate Backup/Original tabs, exact pinned
content, absence of original restore authority, source-specific operation log,
external head refresh, cold reopening and unchanged original metadata/dirty
note bytes. There are no failed native HTTP requests.

Three fixture issues were corrected without product changes or weaker
assertions: stock `jj op log` uses `--limit`; the operation message includes an
inline commit-ID control and therefore needs its real accessible button name;
and each source picker must select inside its trigger's `aria-controls` popup
and await that popup's closure rather than confuse two transitioning portals.
An exact latest-operation pin assertion was added. One retry was safely stopped
when the shared Docker host exceeded four workers, then resumed in a coordinated
slot. No unknown worker was stopped.

All 24 changed native/generated/test files are byte-identical to the strict
qualified worker output. All five changed Web source/test files match the
qualified Web output. The browser-only fixture corrections do not alter runtime
code. Equality manifests are retained under `.local/qualification/`.

## Remaining acceptance

The complete current source/catalog/browser/specification gate is batched with
main intake to avoid running that full cohort twice. Desktop's separate shared
original-reader adoption remains pending; it will reuse this native scope and
read-frame contract. This owner record does not close R3 or select the Rust
hosted default. Optional legacy database History capture remains Deferred.
