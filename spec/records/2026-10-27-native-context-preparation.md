# Retained native context and attachment preparation

R4.3.1 begins the saved R4.3 context/skills/commands/handoff scope with the
retained context projector and bounded attachment read boundary. This slice
introduces native-only preparation, no transport, UI, provider or default
selection. It reuses the admitted Work and checked vault engine; it cannot
become a new IO authority or scheduler.

## Unchanged source reference

Reference Desktop `6c6243202e05b04e57de0a737829ca3a48e3ed3e`:

- `src/lib/ai/core/context.ts`, SHA-256
  `ca4037812f4c57b47488f9ef784d1fe0a3986c6f05a1e2b94ad47f094375b1bd`.
- `src/lib/ai/chat/attachment-context.ts`, SHA-256
  `3d32ae996c991b813576e234ecc39ce05b3f3e74de147ad87ebb31113cba7e26`.

`scripts/reference/native-ai-context.mjs` verifies these complete source bytes
against the pinned Jujutsu revision, then imports and calls those unchanged
exports. It writes12 complete projector outputs and24 attachment results plus
read traces in `tests/fixtures/ai-context/retained.json`. It does not contain
another implementation of either projector or reader algorithm.

Native-only SHA-256/byte witnesses are computed from the exact reference reader
strings; source-visible blocks/errors/read order remain complete comparisons.
Rust service errors are projected to the retained stable Error/AbortError name
and exact message for the source corpus; native guards also assert service error
codes independently. This is an explicit cross-runtime error bridge, not an
omitted failure comparison. UTF-8 byte limits retain emoji/CRLF boundaries.

## Exact source gate

```sh
pnpm rust:core -- test -p lapis-app-core --test native_context --locked
```

The unchanged exact command records **0 passed / 4 failed** at
`9edaf8d7964a8105d2967628af0f9a7156e1175f`, receipt
`c21dd71d-6f36-4c42-93d1-06a5413a2589`: explicit Unsupported responses,
not missing symbols or setup failures. Exit1/no OOM at2026-10-27T05:45:43Z.

After implementation, the same four cases pass **4/4, zero failures** at
`8611ca92bd157d23addffa531caecd26ba80ad19`, receipt
`59c043b0-379c-4932-9341-ce2853da38f7`. Exit0/no OOM
at2026-10-27T05:53:24Z. All12 complete projection results and24 attachment
outcomes/read traces match. Current saved bytes survive client detach unchanged.

## Broader source qualification

Frozen `8d4f6b6b3c4554d6d6ef5f196682e4ddaf3daf9a`, receipt
`242c94f6-7dfd-45b9-b933-420a361e32be`, passes the exact4, seven native
boundary cases and29 affected native lifetime/stream/turn/continuation cases.
All608 Rust cases pass, with zero failures and the same7 existing ignores.
All20 check tasks,20 package test tasks (2438 cases/API1716),11 build tasks,
full canonical specification and78 governance cases pass.

The final formatter finds one generated JSON fixture style error, so this
attempt exits1/no OOM at2026-10-27T06:02:57Z. Formatting that fixture preserves
its parsed value exactly. The unchanged source generator plus repository
Prettier remains the reproducible capture command; its36 source outcomes are
unchanged. Exact/native and final canonical/formatting repair proof follows
without repeating unchanged broad product lanes.

The fixture initially regenerates byte-identically as SHA-256
`6bdb7d79c291f3b2da17e351d4e7101c2d01b0ef806f3d838b263f00a21b9621`.
The source files and all production Rust inputs remain unchanged by its
formatting repair. The new native tests retain exact hashes, duplicate refs,
UTF-8 limits, missing/unsafe/non-regular files, symlinks, replaced physical
admission, cancellation and close/drain ownership without saved-file writes.

## Remaining gates

Final frozen `35c3cfb233247037fa25a02a17e4f51224d3cf8f`, receipt
`d2aac92f-809a-460e-af0e-5581089a296b`, passes the exact4, seven native
boundaries, fresh public internal builds, full canonical/78 governance and all
changed-document/generated-fixture formatting. Exit0/no OOM
at2026-10-27T06:06:54Z. Production Rust bytes equal the broad-qualified source;
only parsed-identical fixture formatting and supporting records/status differ.

The complete capture followed by formatter reproduces final fixture SHA-256
`4a28fa1ef78dba560410bbb330577284cf278bc305e33dd210d43d551d3bb84c`:

```sh
node scripts/reference/native-ai-context.mjs
pnpm exec prettier --write crates/lapis-app-core/tests/fixtures/ai-context/retained.json
```

R4.3.1 is source-qualified. No actual-host/provider acceptance is claimed.
This source-only foundation does not enable empty authored text at an ordinary
R2 admission, rich queue payloads, skills/bootstrap/commands or handoff assembly.
It never persists file/recall/handoff bytes into authored messages. Those later
R4.3 and both-host gates remain explicit; R5 memory ownership is unchanged.

## Final status-only checks

A local documentation-check attempt had incomplete private tool inputs: first
missing TypeScript, then14 absent plugin-input mapping diagnostics. It is not
product or baseline evidence. The temporary tool links are removed. The final
status/record check uses the complete16 public archives and6 native pins in a
fresh Docker snapshot, matching both successful canonical runs above. No
assertion, mapping, source implementation or dependency range is weakened.

Final status snapshot `50805e8bd1855a65d68504cf1ec12734fd132c61`, receipt
`a2c2878c-fe06-49d7-8929-be7f187dfd27`, passes fresh public builds, exact
spec-first,106-row grouped/spec-linked progress, complete canonical/78 governance
and every changed document's formatting. Exit0/no OOM
at2026-10-27T06:11:24Z. Only this supporting receipt and the current tracker time
follow that qualified snapshot. The original fixture formatting failure and
incomplete local-tool attempts above remain recorded.
