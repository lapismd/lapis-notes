# Native Search controls and writer intake

This R3.2.2.4 slice extends the existing indexing control port with bounded
compiled-provider selection. It builds on Canvas/chunking `98590492` and the
fixed indexing-port product snapshot `05b82662`; the latter remains in final
source qualification. Neither application default is selected here.

The exact regression is authored before implementation:

```sh
pnpm rust:core -- test -p lapis-app-core --test service_search_controls --locked
```

Five scenarios cover client-independent compiled sources, generated writer
fencing and disable/drain, explicit client-dependent callbacks, provider removal
with foreign-row preservation, and invalid/versioned declarations. The baseline
will run after combining the unchanged parent sources, before adding Search
commands or authority implementation. Parent source qualification and combined
intake remain separate from both host activation gates.

The exact baseline `0e4b809b-6b02-4afc-9199-1ce0f4f360e9`, snapshot
`fbdb051a`, compiles and fails all five cases solely because `select_search`
is not a recognized command (zero passes/five failures). First implementation
run `8d2aece0-35fc-47bf-899e-537c60048ac0`, snapshot `6184f720`, passes all
five cases. Additional acceptance now checks Search-checkpoint release and a
cancelled generated Search writer's handover; final affected/full checks remain
pending. Parent source qualification and both host gates remain separate.

The authority/protocol follow-up `39d3d22a-d58f-4658-b868-6524c6f12882`
passes five controls, three authority cases and two protocol cases; its generated
outputs were imported with checksum verification. It does not close the full
source or host gates.

Adapter review then exposed two independent regressions: Search progress reused
metadata counters and omitted Canvas; explicit rebuild skipped unchanged stored
Search sources. Corrected baseline `d81ad082-3b7e-42b2-b538-c1eb8e48ad19`,
snapshot `1ef27e41`, reports four controls passes/one progress failure and
zero rebuild passes/one failure. Earlier authoring runs sampled active counters
or had a test compilation error; neither is the corrected baseline.

Repair `20b7074e-38bd-4a89-bb85-ce7d81434e97`, snapshot `d021e91d`,
passes all five controls and the exact unchanged-source rebuild case. Search
counts its selected physical Markdown and Canvas sources. `completed_at` reports
the last fully settled successful pass in epoch milliseconds, preserving that
time on failure or pending work. Explicit rebuild reuses the retained database
preparation/embedding actor. A sixth control now checks failed-pass timestamp
retention. Final regenerated-output and combined qualification remain pending.

Final regeneration `ccb1c692-6211-4210-a4bf-40c0ea631a2f`, snapshot
`07f12a83`, passes six controls, the exact rebuild, three authority and two
protocol cases. All five generated outputs were imported with their producer
checksums. The final generated status field remains optional.

Independent API adapter check `7101cd6e` then finds one TypeScript failure:
the generated Search declaration imports `SearchChunkingSettings`, but the
native database generator does not export it. This is a source generator defect,
not an adapter compatibility exception. The generator now exports its existing
Rust type from that output; fresh generation and the exact API check are pending.
The first broad snapshot `b32dfd99` remains frozen without this generator repair;
its results will be reported separately from final qualification.

The first broad source run `81492d73-bc87-430a-b040-6680c008ed80`,
snapshot `b32dfd99`, passes all 438 Rust cases (six existing asset-dependent
ignores), native build and the 38-case indexing family. Strict Clippy fails on
one immutable loop condition in compiled-provider selection. The loop is now
explicitly conditional around bounded pagination; assertions and warnings remain
unchanged. This aggregate is failed, not a final source pass. The final generator
repair and strict/full closure are still required.

Generator repair `c6f91929-b464-49f9-842f-73667a0830d8`, snapshot
`2ca13add`, passes the exact API strict check, API build/publint/packed types,
six controls, unchanged-source rebuild, three authority and two protocol cases.
Checksummed generated outputs are imported; the native database declaration now
exports the source-owned chunking type without a shim.

The final combined source additionally adopts physical daily IO `974d0a39`.
Its daily product/test paths are byte-identical to that qualified source;
metadata visibility changes compose with the existing native indexing port.
An authenticated real-HTTP Search selection/detach/rebuild/disable test is added
before final qualification. Neither host default changes.
