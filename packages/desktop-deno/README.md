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

Local development uses the static HTTP registry unless explicitly configured
otherwise. Nostr registry qualification is deferred for this release. To opt
into an existing sibling relay fixture separately, set
`LAPIS_LOCAL_NOSTR_REGISTRY=true` or `LAPIS_COMMUNITY_REGISTRY_FIXTURE_ENV`.
Explicit `VITE_LAPIS_NOSTR_*` values take precedence. Set `LAPIS_RELAY_PORT` when
the local stack uses a non-default port.

The **View** menu reloads the window, tries `openDevtools()`, and shows
captured renderer errors. The OS webview backend cannot host in-app DevTools, so
use the CEF debug command for the in-app **View → Toggle Developer Tools**
console window. Native inspection is deliberately off by default because Deno
2.9.5's inspector prints every desktop binding argument and return value. For a
nonsensitive test vault only, set `LAPIS_DENO_INSPECT=1` and attach from
`chrome://inspect` or `edge://inspect`; inspector mode is rejected when local
telemetry is enabled.

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
vault-root filesystem containment, WASM Turso, the Source Editor, Markdown,
File Explorer and Search default plugins, native Markdown diagnostics, file watching, verified plugin
assets, agents, a native Deno PTY terminal runtime, single-instance URLs, native
menus, external-link policy, macOS notifications, macOS/Linux file actions,
ordered close, and local cross-platform artifacts. Community is parked and
excluded from the application profile. Other plugins load through verified
installed-plugin persistence. Native plugin sidecars and real workspace popouts
remain explicitly unsupported.

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

## Homebrew releases

The public [LapisMD tap](https://github.com/lapismd/homebrew-tap) consumes
immutable desktop release archives and their source-bound manifest. Its
installation command becomes available after the first verified release update:

```sh
brew tap lapismd/tap
brew trust --cask lapismd/tap/lapis-notes
brew install --cask lapismd/tap/lapis-notes
```

Homebrew 7 requires explicit trust for this cask. The command above scopes trust
to Lapis Notes.

Release tags use `desktop-v<version>` and must match this private package's
version. The tag workflow builds and qualifies macOS ARM64 and Linux
ARM64/x64 on native runners before publishing. macOS remains ad-hoc signed;
the tap prepares only its installed application bundle for launch. Linux uses
the tar bundle with system WebKitGTK 4.1, GTK 3 and Ayatana AppIndicator on
Ubuntu 24.04. Intel macOS is deferred: `@tursodatabase/database@0.7.2` has
no published Darwin x64 native addon. Renderer assets and the runtime are embedded, so installation does
not require a source checkout, Node.js or Deno on the user's PATH.

`pnpm desktop:release:check` and `pnpm desktop:release:test` check the release
contract. `test:packaged` retains full controller and terminal acceptance;
`node scripts/smoke-packaged.mjs --core` separately exercises the core app
without the external AI controller. macOS installed acceptance also uses
`--launch-services <bundle>` and retains the existing argv URL handoff. Native
macOS URL-opening event delivery remains upstream Deno issue #35465.

Configure repository variable `HOMEBREW_TAP_APP_ID` and secret
`HOMEBREW_TAP_APP_PRIVATE_KEY` for a GitHub App installed only on
`lapismd/homebrew-tap`, with Contents and Pull requests write permissions.
Publication opens a tap update PR; the tap's three audited native installation
checks must pass before merge. A failed upload leaves a draft release and never
replaces previously published assets.
