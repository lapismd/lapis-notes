# Deno Desktop Host / Context

Desktop presentation resolves Design Core through the repository's current
published semver range and committed lockfile, not a sibling checkout.

The Deno desktop host is the sole native Lapis Notes application. It requires
Deno 2.9.5+ `deno desktop` and reuses `NativeDesktopBridge`, `WorkspaceShell`,
and first-party plugins without copying their implementation. The private
package remains at `packages/desktop-deno` and the root launches it with
`pnpm dev:desktop`; `pnpm dev:desktop:cef` starts the same development host with
the Chromium Embedded Framework backend for renderer debugging. Windows
distribution is outside the supported matrix.

Its AppDatabase compatibility catalogue aliases the API-owned remote contract.
The desktop bridge retains its existing command names and worker lifecycle, but
cannot diverge from the method surface later consumed by the Deno server.
Reusable filesystem, watch, resource, plugin-asset, language-service, and worker
kernels come from `@lapis-notes/deno-host-services`; desktop wrappers retain
renderer event channels, native folder selection, and file actions. The renderer
forwards terminal, watch, and database events, plus `desktop_agent_tool_cancel`.
It MUST NOT listen for retired `desktop_agent_process_message`,
`desktop_agent_runtime_event`, or `desktop_agent_tool_call` frames.

### LN-DENO-050 through LN-DENO-054 acceptance details

Desktop recovery acceptance verifies:

- Identity patching and Deno runtime insertion are each followed by ad-hoc signing and deep strict verification; an otherwise current generated host repairs an invalid signature before reuse.
- Filesystem bindings distinguish a missing vault from denied or invalid access and retain the full absolute target in local error details.
- Automatic restore keeps a failed profile available while exposing its error and another-vault path.
- Startup errors expose their complete stack and copyable diagnostic, while Retry, Manage Vaults, optional-plugin Safe Mode, layout skip, and layout reset remain interactive inside native drag regions.
- Safe Mode flags are applied before `App` construction, plugin loading, and layout restoration. A successful recovery shows its restrictions plus metadata, Search, and normal-restart actions.

## Non-goals

This native host excludes community plugin sidecars until a public Deno-owned
execution host exists and Windows distribution.
OS webview quirks require documented equivalents when they affect a visible
application feature.

Local Nostr registry fixtures require `LAPIS_LOCAL_NOSTR_REGISTRY=true` or an explicit `LAPIS_COMMUNITY_REGISTRY_FIXTURE_ENV` path. An incidental sibling fixture keeps development on the configured HTTP registry (LN-PLUG-094).

For LN-PLUG-095, desktop statically supplies explicit local acceptance values
to the shared App Profile factory. Normal production builds ignore fixture
trust; configured installed-plugin loading and native asset verification remain
unchanged.

LN-PKG-146 extends desktop renderer entries through the same public catalogue
as Web. Production Rollup output retains every entry export, and development
resolves those public URLs through host-owned virtual modules.

The signed plugin editor runtime also shares the approved CodeMirror and Lezer
core modules through LN-PKG-146 host entries. Language grammars remain local to
the plugin while editor classes, facets, and parser node properties resolve
through the same graph as the API editor.

LN-PKG-149 binds compiled Svelte archives to the exact renderer ABI supplied by
the host. Generated versioned entries and browser import maps share that module
graph without exposing original private host specifiers. API and host Svelte
peers retain the exact qualified compiler version; dependency drift fails the
host-catalogue build before archives can be installed.

The static desktop profile uses API-owned schema and build tooling under LN-PKG-150 and LN-PKG-151. Concrete Community NIP-29 startup composition remains deferred.

The desktop host registers the default Plugins browser before loading workspace layout and disposes its app-owned registrations during session teardown (LN-PLUG-098–103). Registry browsing and install/update use the same App distribution manager as Settings.
