# Native queue transport source checkpoint

Work is isolated on final R3 native kernel
`03b8257d3d81b5c5c8970d16c7688f12f4ccc9ec`. Only codec `a3cbf03f` and FIFO
`fef5886f` source/test paths are imported. Pre-queue turn/service exports match
between the FIFO parent and final R3 kernel; newer History, state, diagnostic
and indexing paths remain unchanged. Exact transport regressions precede new
DTO/HTTP/client implementation. Qualification is recorded below; no host, default,
renderer scheduler, actual provider or complete R4 gate is claimed.

Exact baseline at `fbc26ae3` fails 0/1 as expected in
`queue_transport_preserves_detached_acceptance_authorship_and_cold_receipts`:
valid admitted acceptance returns 404 before a queue route exists. Receipt
`000e9030-1767-43ec-8ff5-776b61e3f4de` stops there; fixture cleanup completes.
The DTO, admitted bridge and shared port implementation follows this baseline;
protocol/client authority tests were authored before those implementation edits.

Official `protocol:generate` passes at `5678ee61` in receipt
`6b844bb0-2b7a-41c1-ad87-42afa4d148a1`. Its generated queue TS, generic protocol
TS and JSON schema are imported unchanged from that worker. Generation adds no
product test claim; the immutable generated source now reruns the exact HTTP
regression before protocol/authority, Core parity, strict, public API pack-types
and complete affected source lanes. Captures remain opaque JSON data validated
by Core, and wire records deliberately omit the private operator target snapshot.

At `5879461f`, the exact formerly-404 detached acceptance test passes 1/1 and
the strict DTO test passes 1/1. The wider HTTP matrix reports two passes/two
failures: new tests expected 400 for unknown DTO fields, but the unchanged
shared `http/routes::body` intentionally preserves Axum's 422 JsonDataError
status with `INVALID_REQUEST`. Recognized Core target/scope errors remain 400.
The new assertions now require exact 422 plus that structured code; no handler,
authority check or production behavior is weakened. No wider gate ran.
Receipt: `36699f32-e5f6-4e93-937c-38c8ec7752e0`.

At `9a992e95`, the exact regression passes 1/1, protocol DTO 1/1, HTTP
matrix 4/4, native queue 10/10 and unchanged capture parity 3/3. Strict native
boundary/protocol/fmt/all-target Clippy, public API build/publint/packed contract
types, root check 20/20, test 20/20 and build 11/11 pass. The complete native
lane passes 615 tests with zero failures and seven existing ignored tests;
API tests pass 1,705 cases in 165 files. This is the retained pre-editor-union
API tree, not final R4 host intake. Locked native build and 108-task progress
also pass. Receipt `caa1b590-7139-4641-8742-1752a403f557` then stops at one
`SPEC-FIRST-MISSING LN-GOV-003`: public API paths also require their package
chapter. `releases-and-exports.md` now documents the queue port and links the
owning Core requirement. No product source was changed for that finding.

Review adds two HTTP-only edge cases before final closure: a canonical 128 KiB
pending capture encoded with Unicode escapes under the 1 MiB request cap, an
exact 8 MiB cold record retaining opaque receipt extensions with plus-one byte
refusal, and concurrent session revocation/attachment retirement. Existing turn
admission supplies the expected principal and closed-vault behavior. The shared
fixture and production implementation remain unchanged; only the port's JSDoc
comment is reformatted by the package's existing formatter.

## Qualified transport source

At `d84a44e4b643e4a6e33ea0d57feee2189b1633a7`, exact spec-first passes
51 protected files across four canonical chapters. Each new HTTP edge passes
1/1 before the complete six-case HTTP family passes 6/6. Normal authored API
and generator formatting, boundary checks, protocol drift, Rust fmt and all-target
Clippy with warnings denied pass. Receipt
`242582ff-72d9-4a01-bb89-c4620296d97a` exits zero without OOM. The exact byte
case sends a canonical 128 KiB pending capture using escaped JSON, cold-reads an
exact 8 MiB private record without its operator snapshot, and rejects one extra
stored byte without mutation. The revocation case permits an already admitted
read to finish, then proves revoked sessions, detached clients and closed-vault
clients cannot reacquire authority; accepted work completes exactly once.

Production Rust, generated bindings, HTTP and API contract code remain equal
to qualified `9a992e95`; the only subsequent production-path difference is
JSDoc whitespace. Source/test composition preserves the final R3 base and the
unchanged imported codec/FIFO bytes. The API prepack-generated public host
catalogue is byte-equal to source, SHA-256
`5513c9bd15736379e135588acfd50f10de16a514165e8ab061f540111757eac3`.
The exact original HTTP regression changed from 0/1 (404) to 1/1. No functional,
interaction or accessibility failure is waived.

All workers use the pinned full image
`sha256:9fa6f3fb3c8787ac38334c121bce350f005454b079e4dbe090d5c10a6d460be9`,
4 CPUs/12 GiB and private `lapis-notes-r4-capture-rust-20261027` target, with
one owned worker at a time below the shared four-worker cap. Each source packet
checksums its immutable source pack, 16 public archives and six native archives;
those arrays match the coordinator's final input manifest. The broad source
packet SHA-256 is
`5ac6559746222b2383c86e7e38e81c7e7a8ad5b71a67b28771c7323dd2392712`.
Full revisions, archive hashes, tool versions, command statuses and logs remain
under `.local/validation/runs/lapis-r4-capture-<receipt>/` for every receipt above.

The source fixture runs real configured native protocol processes. It does not
run an external provider, install a host client, activate UI or change a default.
R4.1.3 is source complete; R4/R4.1 and final R3/API composition, both actual
hosts and complete workflows retain their separate gates. Final documentary
closure follows without repeating unchanged product suites.

Final documentary snapshot `292effd43f2b5a0adb8b16153c51db3b6f9d0029`
passes exact spec-first (51 protected files/four chapters), formatter, all 78
governance cases, 108-task progress and all ten specification lanes in receipt
`5c0b6e35-f918-481f-8eaf-101dc8aa1917` (exit zero, no OOM, no tracked worker
mutation). Only this supporting receipt annotation and the final activity/UTC
stamp follow; their formatter and generated-progress checks pass locally.
