# Verified Desktop and Deno retirement boundaries

This supporting audit clarifies the user's 2026-11-18 instruction: remove only
obsolete Desktop code and unnecessary Deno runtime/tooling; leave core API
services/functions and future capabilities intact. It authorizes no public API
change and records no product removal or native acceptance. Current status stays
in the [runtime backlog](../src/backlog/runtime-integration.md#legacy-runtime-and-package-retirement)
and [progress record](../../docs/plans/legacy-runtime-retirement-progress.md).

## Source identities and limits

| Owner                | Inspected source                                                                                                                                                       | Scope                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Notes                | Scope merge `dee1067190baebe5344ea216eac3218c5f69da01`; evidence `5518ee249a22245b8c14c13db8885834d6fb0b7f`; refreshed main `d5bc1f04872fd5a311ed8895a87848128590b2a7` | Frozen host, mixed service package, exported compatibility, workspace/check/release inputs     |
| Desktop              | Combined candidate `9685e1e39cde23e96f6867f7ce00a4923fcd166e`; feature base `45d61a6c95d980892be8bb6a32f612137c1bb529`                                                 | Qualified private removals, retained Language Service inventory and pending preservation gates |
| AI Host              | Main `5a323bc5435eb82f682ff89d285fb0258b3470a4`                                                                                                                        | Private orphan fixture; all 91 production source files unchanged in prepared candidate         |
| Agent Redaction      | GitHub main `3cf32015d265aa35c889813709913f8f997a06e6`; published `0.1.1`                                                                                              | Public facade, build/pack, adapter acceptance, ordinary/release CI                             |
| Preserved controller | `cf632cac` inspected checkout                                                                                                                                          | Deno CLI imports Redaction's Node entry; retained runtime dependency                           |
| Stable tap smoke     | Immutable Notes `9fed4f1577a6beb27168d0b83b9ea42408d4f1b1`; stable `2026.31.5`                                                                                         | Historical Deno release, not an invented Tauri replacement                                     |

The refreshed Notes main adds framework dependency-intake checks to both
`.github/workflows/lapis-ci.yml` and `scripts/validation/lanes.json`; both are
preserved. This plan refresh merges the earlier hosted receipt rather than
rewriting its immutable evidence. Static tracing and delegated source audits do
not prove installed profiles, deployment or native application behavior.

## Notes host-owned removal candidates

- `packages/desktop-deno` is the frozen host, already excluded by
  `pnpm-workspace.yaml`. `src-deno/main.ts` executes Deno window/service paths;
  `src-deno/agent-runtime.ts` imports `ai-controller/managed`. Retire these host
  consumers after preservation gates; preserve the standalone controller.
- `packages/deno-host-services` is still included. Its package check invokes
  `deno check`, and build invokes check. File-watch, plugin-assets, vault-fs and
  vault-resources contain real Deno execution. Inventory every surviving
  function and caller before removing only obsolete host portions.
- Do not delete the whole service package. `sync-*.ts` contains Node/native
  portable kernels, journals, leases and deliberate future capability.
  `src/sync-local-provider.ts` explicitly describes shared desktop/server use.
  Protocol/runtime/paths/language-service/native-database wrappers reexport
  portable `host-services`; shared validation within mixed files also stays.
- `scripts/desktop-release.mjs` imports frozen distribution and remains in release
  tests; old plugin-cache cleanup has a later host-owned edge. Keep
  `scripts/check-desktop-release-workflow.mjs`, which actively prevents retired
  publishing from being reintroduced.
- Web's actual icon input is now `packages/web/assets/app-icon.png` plus the API
  logo. The old path in the provenance README is attribution, not execution.
- Notes CI and validation images still install/use Deno 2.9.7. Remove installation
  only after surviving checks and deferred terminal requirements are resolved.

## Protected core and retained support

Keep Language Service implementation, API modules, package, Desktop declaration,
archive projection and build wiring. Preserve `RuntimeTarget`,
`NativeDesktopRuntime`, `isNativeDesktopRuntime`, `NativeDesktopVaultAdapter`
defaults, Deno session/provider/search behavior and the LN-PKG-144/LN-ARCH-098
compatibility exports. Host deletion does not authorize public/core cleanup.

Agent Redaction's `src/deno.ts` is an intentional nine-line public facade over
preserved Node detection/redaction/secret refresh and shared synchronous types.
TypeScript builds and packs it. `scripts/deno.test.ts` has two real built-export
acceptance cases required by AR-ADAPTER-002; CI and release install Deno 2.9.7
and run `pnpm test:deno`. The controller imports `/node` from a Deno CLI, so a
search with no external `/deno` import does not establish unused support.
Retain the facade, acceptance and runtime CI. No proven private obsolete
redaction candidate was found; all portable/Node/Rust functions stay.

AI Host's `tests/fixtures/acp-agent.ts` has no caller or build/test/public-file
selector. Its prepared private deletion and required validator 0.2.1 refresh
preserve all 129 built files byte-for-byte. Focused 14 and full 156 tests,
spec/type/build/publint and packed public-export acceptance pass. Ordinary
`pnpm check` still fails on two existing development Picomatch findings;
production has zero findings. The separately proposed, expiring exact-path
exception is unapplied and awaits user approval. No commit/push is authorized
by a passing narrower lane. Retain Deno config/lock/engine declaration, public
controller identity, execution/MCP/file-tools exports and all production code.

## Stable distribution and sequence

The stable Homebrew cask still ships Deno `2026.31.5`; its smoke checks out the
immutable Notes revision above. Deletion from current Notes need not break that
historical checkout. Retiring the stable generator/cask/smoke requires an actual
qualified Tauri stable release and its separate approved cutover. Preserve
current manifests, archives, hashes, preview distribution and installed data;
never invent URLs/checksums or rewrite historical source to unblock removal.

Finish shared-AI preservation acceptance first. Then remove one obsolete
host-owned portion at a time, keep mixed service/core functions intact and
remove only runtime/tooling inputs with no surviving requirement. Terminal
ownership and Deno terminal-host retirement remain last. Report preserved
controller/redaction support as a retained Deno dependency, not a failed grep
or permission to broaden scope. Publication, deployment, native execution and
installed-app replacement remain separate gates.

## Plan qualification

This documentation-only refresh changes the plan/progress, this audit and the
runtime backlog, and incorporates the existing #168 hosted receipt unchanged.
No product, manifest, lockfile, API, workflow or validation command changes.

- Prettier 3.3.3 passes all six changed/inherited documents; all 41 local link
  targets resolve. The canonical backlog remains within its file limits.
- Ordinary isolated omarchy Docker `pnpm spec:check` passes at snapshot
  `16b7ef020c01ba52891635034a61bf25eee1990c`: run
  `2aee5334-fb26-4d82-9bb0-498a85d5810c`, seven validator lanes and 68 spec
  regression cases, zero failures. Retired-source, App ownership and metadata
  query audits pass. Frozen registry installation uses Node 24.15.0,
  pnpm 10.34.5 and Spec Validator 0.2.1, with workspace-isolated caches,
  two CPUs and 4 GiB memory. No native source or private archive input is used.
- Host doctor retains the QMD ABI 147 failure; semantic discovery explicitly
  degrades to text fallback. No global tool repair is part of this slice.

The final addition of this qualification paragraph is evidence only; formatting
and local links are rechecked afterward. Hosted qualification remains pending.
