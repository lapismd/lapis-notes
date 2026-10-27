# Architecture / Rust hosted runtime delivery

R7 replaces the Node application server while retaining the current built Web
application and existing native authority. This slice stages operator-selected
Rust asset delivery and existing health/readiness behavior. Default scripts,
container packaging, SSE, Node/companion retirement and complete cutover retain
separate evidence. It introduces no replacement screen or JavaScript runtime.

## LN-CORE-054 — Operator-owned application build

<a id="ln-core-054"></a>

**Requirement.** The Rust host MUST select an application build only from an
operator-configured absolute directory, independently of HTTP and vault inputs.
Startup MUST refuse a missing or invalid application index and physical overlap
with admitted vaults, the managed profile, operator configuration or credential
files. The retained directory capability MUST fail closed after root replacement.

`LAPIS_SERVER_STATIC_ROOT` supplies the existing Node-compatible operator setting.
Omission preserves the API-only staging profile. The selected directory contains
public build output; it is never an authenticated vault or another writable
application-data root. Installation secrets and native paths are not Web assets.

### Acceptance details

- Validate a regular root index before publishing a listener, and reject invalid
  directories and unsafe root relationships without selecting another build.
- Resolve physical roots once and retain bounded, checked relative reads. An HTTP
  request cannot select another directory or grant native launch authority.
- Keep normal bootstrap credentials, profile ownership, vault formats and
  single-owner/multiple-vault admission unchanged.

## LN-CORE-055 — Safe static asset responses

<a id="ln-core-055"></a>

**Requirement.** Static responses MUST stream only regular files retained beneath
the selected build root and reject traversal, hidden paths, malformed encoding,
symlinks and nonregular entries. GET and HEAD MUST preserve matching MIME,
length, cache and isolation/security headers. Public errors MUST omit native
paths, and requests MUST NOT modify build output.

### Acceptance details

- Reading a built HTML, CSS, JavaScript, font or WASM asset preserves its bytes;
  HEAD returns the same representation headers without a response body.
- Ordinary assets and the application index revalidate. Content-addressed assets
  retain the existing immutable cache contract; conditional reads preserve it.
- Responses retain `nosniff`, same-origin opener and required cross-origin
  embedding isolation. API and authenticated resource response policy remains
  owned by its existing route.

## LN-CORE-056 — Application fallback routing

<a id="ln-core-056"></a>

**Requirement.** The fixed application index MAY serve valid extensionless
navigation paths. Fallback MUST NOT intercept API, stale protocol, plugin
resource, missing asset or non-read requests, generate directory listings, or
bypass existing authentication, Origin, CSRF or resource policy.

### Acceptance details

- Existing admitted API commands retain their exact authorization and error
  behavior; unknown and retired API routes never return application HTML.
- Missing explicit assets and invalid paths return bounded failures rather than
  the application index. Navigation retains the actual current Web screen.
- An actual built-Web browser journey must run against the Rust process alone,
  without Vite preview or another Node application server.

## LN-CORE-057 — Retained hosted health and readiness

<a id="ln-core-057"></a>

**Requirement.** Selected Rust Web delivery MUST retain the existing public
`/healthz` and `/readyz` response contracts. Liveness reports `ok`; readiness
reports `ready` only after startup succeeds and `unavailable` with HTTP503 while
admission is draining. A refused graceful shutdown MUST retain the existing
explicit-recovery availability rather than leaving the host permanently unready.

Health responses retain no-store policy and do not disclose vault identities,
paths, credentials or authentication state. This observes the existing host
lifetime; it does not create a second application service or writer owner.

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
