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
