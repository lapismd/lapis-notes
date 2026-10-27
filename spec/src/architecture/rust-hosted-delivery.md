# Rust hosted runtime delivery

This is the explicit native delivery path for R7. Ordinary hosted defaults stay
on the retained serving profile until static delivery, source-input coherence
and full cutover acceptance pass. R5/R6 ownership remains deferred independently.

## LN-CORE-064 — Coherent native build profile

<a id="ln-core-064"></a>

**Requirement.** The native hosted build MUST compile the Rust server and the
existing Web renderer with native metadata, History and Tasks selected together.
It MUST certify that renderer profile only after all build steps succeed and
MUST invalidate an earlier certificate before rebuilding. Building this profile
MUST NOT require compiling or starting the Node application server.

## LN-CORE-065 — Explicit compiled runtime startup

<a id="ln-core-065"></a>

**Requirement.** Native hosted startup MUST require explicit operator vault
configuration and data-root selection, validate the compiled binary and certified
renderer, then launch the Rust executable directly. It MUST preserve operator
credentials/provider configuration and forward termination and exit status.
Missing or incompatible artifacts MUST fail before launch without building,
starting Node, selecting a fallback writer or modifying persisted application data.

## Operator entrypoints

`pnpm build:server:rust` prepares the explicit native cohort. The binary remains
under the checkout-owned release target; renderer output remains the existing
`packages/web/dist-rust-server` build. Its public profile certificate contains
only schema/runtime and selected service flags, never paths or credentials.

`pnpm start:server:rust` uses `LAPIS_SERVER_CONFIG` and `LAPIS_SERVER_DATA_ROOT`.
`LAPIS_SERVER_LISTEN` optionally changes the loopback listen address; trusted
operators may supply `LAPIS_SERVER_BINARY` and `LAPIS_SERVER_STATIC_ROOT` for
relocated delivery. Browser authentication, origin, private-root separation,
native service admission and graceful drain remain owned by the Rust host.

These pnpm commands are development/build tooling. A deployed image launches
the compiled executable directly; no Node application runtime is required.
Container assembly, ordinary default selection, retired transport removal and
cross-host qualification keep their separate R7 gates.
