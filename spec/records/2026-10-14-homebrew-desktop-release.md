# Lapis Notes Homebrew desktop release — 2026-10-14

The first desktop release is `desktop-v2026.31.5`, bound to source commit
`9fed4f1577a6beb27168d0b83b9ea42408d4f1b1`. Its supported targets are macOS
ARM64 on macOS 15+ and Linux ARM64/x86-64, initially qualified on Ubuntu 24.04.

## Source and distribution changes

- [Source PR #26](https://github.com/lapismd/lapis-notes/pull/26) owns packaging, renderer embedding, launchers, manifest integrity and acceptance.
- [Tap PR #4](https://github.com/lapismd/homebrew-tap/pull/4) restricts the first release to three targets and makes the macOS ARM64 requirement explicit.
- [Controller PR #2](https://github.com/lapismd/ai-controller/pull/2) repairs npm 10 runtime staging; the controller remains a separate prerequisite for AI features.
- The release GitHub App is installed only on `lapismd/homebrew-tap`, with Contents and Pull requests write access and Metadata read access.

## Verification

[Pre-publication native qualification](https://github.com/lapismd/lapis-notes/actions/runs/38632160160)
passed all three targets. Every target passed desktop checks/tests, full cold
packaged acceptance and strict Homebrew audit, install/reinstall, core cold
startup, native PTY shell output and uninstall.

[Full source CI](https://github.com/lapismd/lapis-notes/actions/runs/38632160066)
passed all required lanes. Its first web attempt had 11 passes and one server
startup failure: Chromium aborted module downloads with `ERR_NETWORK_CHANGED`
after Docker network setup. The unchanged rerun passed all 12 browser tests.
No web assertion or product code was weakened.

Local release regressions passed 14/14; the full release suite passed 91/91;
specification regressions passed 38/38, with spec-first and specification checks
passing. All six tap tests, syntax checks and Homebrew Ruby style passed.

[Tagged release qualification and publication](https://github.com/lapismd/lapis-notes/actions/runs/38635414837)
passed all three targets and published the three archives, `SHA256SUMS` and
`desktop-manifest.json`. The downloaded public manifest matches the tagged
source commit, the supported target set and the checksum list. The release App
verified all archive bytes and opened [tap PR #5](https://github.com/lapismd/homebrew-tap/pull/5).
[Production cask qualification](https://github.com/lapismd/homebrew-tap/actions/runs/38637575167)
passed strict audit, installation/reinstallation, cold core startup and uninstall
on all three targets. Tap PR #5 is merged, making the Homebrew installation
command available. The production cask exactly matches the public manifest.

## Installation behavior and limits

macOS bundles are ad-hoc signed without Developer ID or notarization. The cask
verifies bundle identity and signature and removes only that installed bundle's
quarantine attribute. Cold LaunchServices acceptance strips the development
runtime from PATH and launches from an unrelated working directory.

Linux retains the complete bundle in Caskroom, links its source-owned launcher,
and installs the current user's XDG desktop entry with absolute executable and
icon paths. System WebKitGTK 4.1, GTK 3 and Ayatana AppIndicator remain required.
The initial release qualifies reinstall; real version-to-version upgrades are
qualified when a subsequent release exists. Uninstall preserves user data.

Intel macOS is deferred because the pinned Turso 0.7.2 package has no published
Darwin x64 native addon. OS-level macOS custom-scheme URL event delivery remains
[denoland/deno#35465](https://github.com/denoland/deno/issues/35465); executable
argument handoff passes. AI features require the separate controller.

## CI server startup recovery

Later evidence-only CI again aborted 80 initial module requests with Chromium
`ERR_NETWORK_CHANGED`, before the Sign in heading could render. Its unchanged
rerun passed. The server acceptance fixture now isolates its bootstrap secret
container from networking and allows one fresh initial navigation only for an
observed same-origin document or script network-change abort.

The recovery retains the original readiness assertions and all later login,
editing, sharing and restart steps. Other failures and a failed second attempt
still fail acceptance. A retry emits an annotation, log and JSON attachment;
Web diagnostics upload after success as well as failure.

Six focused recovery regressions changed from three failures to six passes,
including the Linux CI Node 24.15.0 runtime. The combined registry-fixture suite
passes 7/7, Web unit tests pass 55/55, full Web acceptance passes 12/12 with the
signed CI fixture, and the cold server case passes once plus three additional
cold repetitions. Root check/test pass 18 tasks each, build passes 10 tasks,
and the complete release suite passes 97 tests.
