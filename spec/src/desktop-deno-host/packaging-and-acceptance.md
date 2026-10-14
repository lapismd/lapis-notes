# Deno Desktop Host / Packaging and acceptance

Desktop distribution consumes the published Terminal Host Deno and native-artifact
exports. Clean CI builds on native macOS and Linux runners and executes the
packaged first-launch, handoff, service and close contract under LN-PKG-162.
macOS packaging passes an extension-free output name to Deno, which adds `.app`.
Packaging selects `DENO_BIN` when configured and otherwise uses the runtime on
`PATH`, matching the pinned CI toolchain instead of a separate user installation.

Desktop release `2026.31.5` qualifies macOS ARM64 and Linux ARM64/x86-64.
See the [Homebrew release record](../../records/2026-10-14-homebrew-desktop-release.md)
for source provenance, native qualification and platform limitations.

## LN-DENO-038 — Before mounting application UI, the desktop renderer: mark the document engine from the native

<a id="ln-deno-038"></a>

**Requirement.** Before mounting application UI, the desktop renderer MUST mark the document engine from the native host's selected backend. The default and packaged system-webview backend MUST identify as WebKit, CEF MUST identify as Blink, and shared UI compatibility MUST NOT depend on Laufey's user-agent shape.

### Acceptance details

Desktop renderer-engine selection verifies:

- Native platform metadata maps the default and explicit system-webview backend to WebKit.
- Native platform metadata maps the explicit CEF backend to Blink.
- The renderer applies the engine marker before mounting the desktop application.

## LN-DENO-075 — Atomic acceptance-report publication

<a id="ln-deno-075"></a>

**Requirement.** Packaged acceptance reports MUST become visible through an atomic rename after complete JSON serialization. A reader MUST NOT observe a partially written report, and report publication failure MUST remain a failed acceptance result.

## LN-DENO-079 — Versioned macOS installation

<a id="ln-deno-079"></a>

**Requirement.** macOS packages MUST declare the desktop release version, stable bundle identity and supported minimum system version before final ad-hoc signing. Archives MUST preserve executable permissions. Installed unsigned candidates MUST pass deep strict signature verification and cold LaunchServices acceptance after app-scoped quarantine removal.

## LN-DENO-080 — Linux distribution launcher

<a id="ln-deno-080"></a>

**Requirement.** The Linux distribution launcher MUST resolve symbolic links, preserve arguments and locate its complete bundle independently of the current directory. It MUST provide a non-launching `--check-runtime` command and fail with actionable instructions when required system WebKitGTK, GTK or AppIndicator libraries are absent.

## LN-DENO-081 — Source-bound desktop releases

<a id="ln-deno-081"></a>

**Requirement.** Publication MUST occur only on tag pushes matching the private desktop package version. Publication MUST require native packaged and Homebrew installation acceptance for macOS ARM64 and Linux ARM64/x86-64. Releases MUST retain source revision, target, version, sizes and SHA-256 checksums in a machine-readable manifest. Published assets MUST NOT be silently replaced.

## LN-DENO-082 — Homebrew distribution

<a id="ln-deno-082"></a>

**Requirement.** The LapisMD Homebrew tap MUST consume verified desktop release manifests and immutable release downloads. It MUST install a stable macOS application and Linux command, desktop entry and icon. Installation MUST remove only the installed macOS bundle's quarantine attribute and preserve user data during upgrades and uninstall. Tap updates MUST pass native installation checks before merge.

## LN-DENO-083 — Core installation acceptance

<a id="ln-deno-083"></a>

**Requirement.** Installed desktop acceptance MUST separately prove core startup and clean shutdown without a separately installed AI controller or development runtime. The existing full packaged acceptance MUST retain controller and application-tool evidence. An explicit acceptance-only core mode MUST NOT change normal application startup or the default full acceptance mode.

## LN-DENO-084 — Embedded renderer assets

<a id="ln-deno-084"></a>

**Requirement.** Desktop packages MUST include their production renderer assets and resolve them relative to the embedded native entry module. First launch, URL handoff and shutdown MUST succeed independently of the process working directory and without reading a source checkout's renderer output.

## LN-DENO-085 — Installed terminal runtime

<a id="ln-deno-085"></a>

**Requirement.** Full packaged and core installation acceptance MUST create a native terminal using the verified packaged PTY library, execute a shell command, observe output from that owned session and stop it before clean shutdown. Failure MUST retain failed acceptance and MUST NOT be replaced with a capability-only assertion.
