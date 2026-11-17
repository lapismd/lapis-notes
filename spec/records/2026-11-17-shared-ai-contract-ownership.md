# Shared-AI implementation contract ownership

Source review: Notes main `555c65302001c76e7e84d9b1f9c85f988f818118`,
Desktop main `18aac280` and the landed Plugins retirement at `e8f8eb1b`.
This is a documentation/source-ownership slice within shared-AI retirement.
No runtime, public API, package manifest, installed state or native engine changes.

The current Notes specification still required the deleted shared package and
its exports, controller/Fake adapters and manual Storybook attach path. Those
requirements contradicted the landed source removal and current LN-AI-045.
Sixteen implementation-specific requirements and their verification rows move
to `spec/archive/2026-11-17-shared-ai-implementation-contracts.md`, together with
the original context. Original IDs and text remain historical provenance; no ID
is reused and no historical test is relabelled as native qualification.

| Retired IDs                                           | Original concern                                             | Current disposition                                                                                                 |
| ----------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| LN-AI-001, LN-AI-032, LN-AI-036                       | External package location, exports and dependencies          | Package and current catalogs are removed; native identity/data remain required.                                     |
| LN-AI-006, LN-AI-012, LN-AI-019, LN-AI-037, LN-AI-044 | Shared-controller and old adapter integration                | Desktop consumes its native public client; excluded consumers retain the standalone controller.                     |
| LN-AI-007, LN-AI-020                                  | Shared Fake runtime class and its rich-trace catalog         | Removed package/catalog implementation; Desktop's retained client fixtures and LD-AI-004 remain independent.        |
| LN-AI-011, LN-AI-031, LN-AI-046, LN-AI-098            | Old runtime capability, manual attach and local-server setup | Notes' retired attach route remains forbidden; native admission and unavailable states retain their host contracts. |
| LN-AI-014                                             | Public shared-package chat Show Code                         | Deleted Notes catalog; actual native catalog coverage remains Desktop-owned.                                        |
| LN-AI-170                                             | Shared renderer export's optional Node user-agent store      | Desktop uses its admitted NativeUserAgentsStore; current renderer and native storage gates remain.                  |

## Actual source boundaries

Desktop's `notes-bundled-plugins.ts` selects one owned AI or App Profile native
chat implementation. `AcpAgentRuntime` consumes `@lapismd/ai`; no shared-plugin,
ControllerAgentRuntime, FakeAgentRuntime or old desktop-agent-command imports
exist in current Desktop production source. Its approval-policy attribution
comment is retained provenance, not a controller dependency. Current native
user-command storage lives in `src/lib/native/ai/user-commands.ts`.

Notes App Profile owns `createNativeChatPlugin` and its typed host/session
integration. Notes API still owns generic tool/skill/command/result registries
and Vault wrappers over `@lapismd/ai-host/file-tools`. These are actual retained
callers, so their requirements and source are preserved. Generic conversation,
memory, presentation and tool topics remain for further caller-aware review;
this slice does not retire those concerns wholesale.

Frozen Deno-host requirements and declarations remain until that source removal.
They do not describe current Tauri execution. Native identity `ai`, explicit
disablement and saved settings/conversations/memory remain preservation gates.
Desktop LD-PLUG-001 is still Planned; source inspection and coverage ledgers
cannot substitute for actual old-external/bundled startup, Safe Mode and cold
native acceptance.

## Verification

The archive is compared against the exact original requirement blocks,
verification rows and complete context at the recorded Notes base. Every retired
ID is absent from current definitions/verification and retained in the archive.
Formatting and the normal canonical specification checker qualify this
documentation-only change. Product suites are not substitutes for this archive
and ownership review, and this slice changes no product source.

Spec discovery used the exact `LN-AI-032` task with the provisioned Deno-free
0.2.1 CLI. QMD reported the known native ABI mismatch and used its documented
text fallback; no successful semantic retrieval is claimed and no global
configuration changed.
