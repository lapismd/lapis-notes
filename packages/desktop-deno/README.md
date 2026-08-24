# `@lapis-notes/desktop-deno`

Deno 2.9.5+ `deno desktop` host. It opens `desktop-folder` vaults, mounts the
shared `WorkspaceShell`, and is the sole native desktop implementation. The
supported packaged targets are macOS and Linux.

## Prerequisites

Install [Deno 2.9.5 or later](https://docs.deno.com/runtime/getting_started/installation/).

```bash
curl -fsSL https://deno.land/install.sh | sh
```

## Development

From the repository root:

```bash
pnpm --filter @lapis-notes/api build
pnpm --filter @lapis-notes/desktop-deno dev
```

Or `pnpm dev:desktop`. Use `pnpm dev:desktop:cef` when debugging with the
Chromium Embedded Framework backend; `pnpm dev:desktop:chrome` is a convenience
alias for the same command. Vite listens on **127.0.0.1:1422** as an upstream
only. `deno desktop` opens the window, injects `win.bind()` on that document,
and proxies the Vite renderer so `bindings.invoke` stays available. Do not open
the Vite port in a browser tab; that page cannot receive desktop bindings.

The **View** menu reloads the window, tries `openDevtools()`, and shows
captured renderer errors. The OS webview backend cannot host in-app DevTools, so
dev also starts `--inspect=127.0.0.1:9229`. Attach from `chrome://inspect` or
`edge://inspect`. The CEF debug command enables the in-app **View → Toggle
Developer Tools** console window for renderer DOM and console inspection.

On macOS, Create and Open use the system folder picker; other platforms fall
back to a path prompt. Set `LAPIS_DENO_VAULT_AUTO=1` with `LAPIS_DENO_VAULT`
to skip the picker in automation. Profile state remains under the established
Deno user-data directory (`LAPIS_DENO_USER_DATA` overrides it).

On macOS, the host uses Deno's `transparentTitlebar` window path for full-bleed
chrome while retaining the native traffic lights. Deno 2.9.5 is the minimum
because it includes both that Laufey window implementation and the corrected
public per-window binding registry.

## Runtime status

The host provides the Deno window and `win.bind()` bridge, `desktop-folder` vaults,
vault-root filesystem containment, WASM Turso, the full portable first-party
plugin inventory, native Markdown diagnostics, file watching, verified plugin
assets, agents, a native Deno PTY terminal runtime, single-instance URLs, native
menus, external-link policy, macOS notifications, macOS/Linux file actions,
ordered close, and local cross-platform artifacts. Community plugin sidecars
and real workspace popouts remain explicitly unsupported.

Build and exercise the production app with:

```bash
pnpm --filter @lapis-notes/desktop-deno build
pnpm --filter @lapis-notes/desktop-deno package:app
pnpm --filter @lapis-notes/desktop-deno test:packaged
```

`package:app` builds the current platform. Explicit local/cross-target entry
points are `package:macos:arm64`, `package:macos:x64`,
`package:linux:arm64`, and `package:linux:x64`. Artifacts use versioned
platform/architecture names and the Lapis application icons owned by this
package. Every distribution entry point first runs the root Turbo-filtered
desktop build and its dependency closure.

macOS packages are ad-hoc signed by default. Set
`LAPIS_DENO_MAC_SIGN_IDENTITY` to a keychain Developer ID identity and
`LAPIS_DENO_NOTARY_PROFILE` to an `xcrun notarytool` keychain profile to sign
and notarize without putting credentials in command arguments. An optional
`LAPIS_DENO_NOTARY_KEYCHAIN` selects a non-default keychain. Linux packages
skip signatures unless `LAPIS_DENO_GPG_KEY_ID` selects a key available through
the local GPG agent.
