# Desktop and Deno retirement agent handover

Snapshot: 2026-11-19 at final hosted qualification and documentation closure.
Coordination owner: `lapismd/lapis-notes`.

This is the takeover entry point. The [canonical plan](legacy-runtime-retirement.md)
owns scope; the [progress ledger](legacy-runtime-retirement-progress.md) preserves
dated attempts and exact evidence. The live tracker is
[lapis-notes issue #177](https://github.com/lapismd/lapis-notes/issues/177).

## Scope that must not drift

- Retire only deprecated Desktop code and unnecessary Deno runtime/tooling.
- Preserve every core API service/function and future-facing capability,
  including Language Service, Sync and `packages/deno-host-services/**`.
- Keep E-RETIRE-007 parked. Lack of a current caller is not removal authority.
- Exclude `nostr-agent-controller`, `community-local` and `nostr-auth`.
- Preserve standalone `ai-controller`, AI Host execution/MCP/file-tools,
  portable Redaction, Tauri/native AI, history, artifacts and user data.
- Do not move terminal code. Desktop Rust packages stay in `lapis-terminal`;
  Server's private Rust service, Cargo manifests/lock and pin stay in
  `terminal-host`.
- Keep source, consumer, native, publication, deployment and installed-product
  gates separate.

## Completed implementation

- Shared `@lapis-notes/ai` source, package, catalogs, Notes probes and fixture
  inputs are removed. Registry HTTP 410, installer provenance rejection and all
  eleven npm deprecations are live. Historical artifacts, hashes and user data
  remain.
- Notes API 0.6.9, UI 0.2.5 and App Profile 0.2.6 are published and adopted.
  Desktop preservation [#58](https://github.com/lapismd/lapis-desktop/pull/58)
  sealed old-external/bundled AI data, Safe Mode, restart and native-chat
  boundaries. The user accepted the unchanged transcript-backup status and raw
  development-WebView `SIGABRT` diagnostics as non-blocking.
- AI Host [#6](https://github.com/lapismd/ai-host/pull/6) removed only its orphan
  private Deno fixture. Active execution, controller, MCP and file-tools support
  remains.
- Notes [#180](https://github.com/lapismd/lapis-notes/pull/180) removed the frozen
  Deno desktop host and release authority. Notes
  [#181](https://github.com/lapismd/lapis-notes/pull/181) retired the shared-AI
  current specification while preserving App-owned memory/transcript, database,
  file-tools, Native Chat and Tauri/native-AI contracts.
- Terminal plugin [#4](https://github.com/lapismd/lapis-plugin-terminal/pull/4)
  replaced stale standalone-host guidance while retaining the public bridge and
  negative dependency guards. Terminal Host
  [#4](https://github.com/lapismd/terminal-host/pull/4) converted the repository
  in place to Rust-only. Its Cargo manifests, five Rust source/test files, Server
  pin, history and artifacts remain; no code moved.
- Plugins [#164](https://github.com/lapismd/lapis-plugins/pull/164) retired old
  Deno Desktop specification claims. Plugins
  [#165](https://github.com/lapismd/lapis-plugins/pull/165) removed only the
  obsolete live-Deno Sync review driver and bridge while preserving Sync, browser
  review and Node/Deno engine portability. Follow-up
  [#166](https://github.com/lapismd/lapis-plugins/pull/166) removed stale package
  and catalog instructions to start the deleted Notes Deno server and extended
  the fail-closed audit without changing the Sync engine or future Rust/Tauri
  contracts. Final follow-up
  [#167](https://github.com/lapismd/lapis-plugins/pull/167) relabelled two
  remaining historical "frozen Desktop" phrases and extended the same guard.
  Reviewed heads `393dc4e2`, `afa3155c` and `7450fe0a`; current main `7fdfea4d`.
- Desktop [#59](https://github.com/lapismd/lapis-desktop/pull/59) removed the final
  visible retired shared-AI fixture commands and corrected current/backlog
  ownership wording. Reviewed head `e66a5f61`; main `5f7c785a`. No product or
  Rust implementation moved.
- Notes [#182](https://github.com/lapismd/lapis-notes/pull/182) removed the stale
  `LAPIS_TERMINAL_HOST_URL`, `LAPIS_TERMINAL_HOST_TOKEN` and
  `LAPIS_DENO_PACKAGED_EXECUTABLE` Storybook/Turbo/cache inputs without changing
  either Rust terminal implementation or protected core/future services.
  Reviewed head `f0e248e2`; main `0a6cdeac`.
- Website guidance and organization listings describe bundled/native AI. The
  Website preview is qualified; production deployment remains a separate gate.

## Final residue classification

| Owner / reference                 | Classification                                                                                                                                                                                                                |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop                           | Only fail-closed negative audits and historical/evidence references remain after #59. Tauri/native AI is the supported implementation.                                                                                        |
| Plugins                           | Anti-resurrection guards, tests and preserved Sync context remain after #166/#167. Sync engine portability is intentional.                                                                                                    |
| Notes                             | `packages/deno-host-services`, Language Service, Sync/core kernels, the `deno-desktop` compatibility discriminant and fixtures are protected retained contracts. The retired terminal environment inputs are removed by #182. |
| AI Host and Agent Redaction       | Active supported Deno compatibility remains; it is not Desktop-host residue.                                                                                                                                                  |
| Terminal Host and terminal plugin | README/changelog history and fail-closed negative guards remain. Rust implementations and the public bridge stay in their original repositories.                                                                              |
| Server                            | The generated compatibility discriminant and exact Rust `terminal-host` crate pin are active retained contracts.                                                                                                              |
| Registry and Website              | Historical snapshots, disabled signed metadata, provenance rejection and negative guards remain intentionally.                                                                                                                |
| Other audited Lapis repositories  | `lapis-community`, `lapis-terminal`, `lapis-ai`, Mira, Agent UI and Docs/Tasks/Notebook plugins have no actionable executable residue. `lapis-ci` only detects generic `deno.json` version inputs.                            |

## Final qualification

- [x] Notes main `0a6cdeac` passed exact-main Release
      [44535872665](https://github.com/lapismd/lapis-notes/actions/runs/44535872665),
      PWA [44535872467](https://github.com/lapismd/lapis-notes/actions/runs/44535872467)
      and Storybook Pages
      [44535872359](https://github.com/lapismd/lapis-notes/actions/runs/44535872359).
      Release attempt 2 passed after the first attempt's isolated offline-reload
      timeout; the exact rerun left no persistent source failure.
- [x] Plugins main `7fdfea4d` passed exact-main CI
      [44539526699](https://github.com/lapismd/lapis-plugins/actions/runs/44539526699)
      and Version [44539526827](https://github.com/lapismd/lapis-plugins/actions/runs/44539526827).
      The preceding #166 main CI
      [44537056688](https://github.com/lapismd/lapis-plugins/actions/runs/44537056688)
      and Version [44537056501](https://github.com/lapismd/lapis-plugins/actions/runs/44537056501)
      pass.
- [x] Desktop main `5f7c785a` passed exact-main CI
      [44534936367](https://github.com/lapismd/lapis-desktop/actions/runs/44534936367)
      and Pages
      [44534936413](https://github.com/lapismd/lapis-desktop/actions/runs/44534936413).
      CI completed with 18 successful jobs; Native bundle and Full source
      qualification were the two configured skips.
- [ ] Land this documentation-only closure, update issue #177 and then retire
      only clean, integrated temporary workspaces through the recoverable
      bootstrap cleanup.

## Separate decisions, not inferred

- Tracked `.cursor/rules/rebuild-plugin-dist.mdc` still positively names the
  retired shared AI package. Workspace policy requires explicit authorization
  before editing tracked editor/loader configuration.
- npm deprecation of `@lapismd/terminal-host@0.1.0` is metadata-only but still
  requires an explicit decision. Never unpublish its tarball.
- Registry [#185](https://github.com/lapismd/plugin-registry/pull/185) records
  the completed retirement status, but merging it triggers the protected
  production deployment and remains an explicit decision.
- Website production deployment is not authorized by the approved preview.
- The stable Homebrew cask remains the historical Deno Notes release until a
  separately approved, fully qualified Tauri stable cutover exists.

## Handover discipline

Read each repository's tracked `AGENTS.md`, inspect `jj --no-pager st`, fetch
current remote state and search the owning specification before editing. Do not
infer a separate release/deployment decision from source completion. Update
issue #177 and this snapshot after every remaining gate.
