# Native background-indexing source foundation

Task `R3.2.1.3`, working from qualified Docs/History
`5ee783f1df95a37e552947d12d73127dd8a49eec` in the isolated
`native-background-port-20261025` workspace. The source contract is persisted
before implementation. Neither host default is selected by this source slice.

## Bounded contract

An optional App-owned port comes from its explicitly owned VaultSession. An
absent port retains the standalone browser implementation. A selected native
port retains MetadataCache queries, compatibility events and local pure reads,
while startup, refresh/rebuild and known projection publication use the existing
vault owner. Native failure cannot activate a JavaScript writer.

Transport-neutral generated selection, contribution, refresh and status DTOs
use the existing admitted service/client. Native code accepts known compiled
Markdown, Tasks and Docs algorithms, never JavaScript callbacks or host roots.
Unsupported client-dependent contributions are observable. Search provider,
configuration/checkpoint and both-host adoption remain separate existing R3
gates; this slice must not present Markdown-only Search as full adoption.

The native database boundary fences new client-generated metadata and owned
projection writes, drains previously admitted ones, then starts the existing
native owner. Internal actor/Database/Work publication remains admitted. Ordinary
files, configuration, queries and unselected Search retain their current paths.
View detach removes observers only; explicit plugin disable fences that native
projection. No new scheduler, screen, fallback writer or Tasks mutation engine
is introduced.

## Exact regression and validation

Initial exact target:
`pnpm rust:core -- test -p lapis-app-core --test native_indexing_authority --locked native_metadata_selection_refuses_client_generated_writes -- --exact --nocapture`.
It selects the existing native metadata owner, then attempts a client
`DeleteIndexedFile` mutation. The expected error is `PermissionDenied`.
The unchanged Docker baseline at `aa636ee7` has **0 passes / 1 failure**:
`DeleteIndexedFile` returned `Undefined` instead of refusing client publication.
The exact immutable worker is `lapis-native-background-exact-3c2255e7`.

Validation widens to authority/admission/lifetime and cache/registry cases,
generated protocol drift, native HTTP source adapters, strict Rust checks,
complete Notes check/test/build/specification and the affected complete catalog
lane for App/cache lifecycle changes. Docker remains the default, with one
bounded scope-owned worker. Preserve failures and distinguish this source gate
from actual Tauri/hosted activation and native acceptance.

The exact App/cache baseline at `9aa2e827` has **0 passes / 1 failure**:
`selects native metadata without invoking the JavaScript writer` made zero
port calls and entered the browser reconcile path. Its immutable Docker
worker is `lapis-native-background-exact-cache-afeb4923`. Preparation exposed
and repaired an oversized generated-export responsibility; the generated
indexing declarations now have their own exporter module. A missing mapped API
chapter was identified by spec-first before API implementation qualification.

After enforcement, the unchanged exact native regression passes **1/1** at
`c6380e5b` (`lapis-native-background-exact-93cc6607`). API/cache, projection,
transport and complete-source qualification remain active; this is not yet
a host-adoption result.

First affected qualification passes all four native control cases, two
deterministic authority cases, 36 existing indexing cases and the complete
protocol suite. HTTP has one pass/one failure: the new negative fixture expected
400, while the retained Axum JSON-schema rejection contract returns 422. The
fixture now requires both 422 and `INVALID_REQUEST`; no transport behavior or
negative rejection was weakened. Its exact retry precedes widening.

Exact HTTP admission and App/cache selection retries both pass 1/1. The first
complete new cache suite passes eight cases and fails its publication fixture:
that fixture omitted the existing required `indexed`/`normalizedPath` file
fields, so MemoryAppDatabase correctly excluded the row. The fixture now uses
the complete typed record; the unchanged content/event assertions remain.

The second affected run passes all five native control cases, two authority
cases, 36 indexing cases, complete protocol, both HTTP cases and all **120**
cache/plugin cases. Direct Web acceptance passed seven client cases but could
not import the fresh API `dist` for its backend suite. The runner now builds
the API dependency closure before that consumer check; no source alias or
consumer workaround was added.

An additional source-race regression at `cc664e79` fails **0/1**: a committed
index notification was lost when the observer could no longer read its source
bytes. The cache observer now publishes `index-changed` in its completion path
even when optional compatibility refresh fails, while withholding a stale
`changed` content event. The exact retry precedes complete qualification.

Final affected source `4274d601` passes the exact source-race retry (1/1), all
five native controls, two deterministic authority cases, 36 existing indexing
cases, **24** protocol cases, both HTTP cases, **121** cache/plugin cases and
**ten** hosted client/backend cases after the public API dependency build.
UI/API package builds, publint, packed API declarations, workspace-wide strict
Clippy and both native-source tooling regressions pass. The bounded worker is
`lapis-native-background-affected-23073192`, pinned image `9fa6f3fb`, four CPUs
and 12 GiB. All existing source/dependency pins are unchanged; both hosts remain
unselected. Complete source and cold catalog gates are now running.

Packed API review also identified its manually maintained MetadataCache
declaration boundary. The declaration now includes the native declaration/disable
helpers, contribution availability and optional processor owner, with a new
consumer contract through `dist/index.js`. Final qualification includes this
type-only correction; the already tested runtime implementation is unchanged.

The complete source at `3238d7de` passes **401 Rust** cases (six existing model
ignores), **2,266 package** cases (one existing skip), all **261 cold catalog**
interaction/accessibility cases, both renderer builds, static Storybook, public
package checks and specification lanes. The bounded immutable worker is
`lapis-native-background-full-c17ac603`. This remains a source result rather
than either host's activation gate.

Independent review compared the qualified retained registrations: Tasks at
`fcb2a8b5` has no configuration hash or source prefix; its physical-vault
resolver and local date are already owned by the native implementation. Docs
at `f772f2ba` has no configuration hash and its normalized `docsRoot` is the
only output setting; the port forwards it as `path_prefix`. Native cache hashes
intentionally identify the compiled algorithm and do not prove parity with
an arbitrary client configuration. Nonempty client hashes now remain
client-dependent. Markdown at `6af2420f` registers both `md` and `markdown`;
both declarations must select the qualified processor. The two exact review
regressions fail **0 passes / 2 failures** at `b7e89d59` before these changes
(`lapis-native-background-exact-contributions-361e1254`). The exact retry at
`fe1df71a` passes **2/2** (`lapis-native-background-exact-contributions-86009673`).
Final qualification follows the same immutable Docker boundary.

## Qualified source handoff

Final product snapshot `05b82662885be5ba6a0178196bc30cde8c653d20` passes
**403 Rust cases**, six existing model ignores, **2,266 package cases**, one
existing skip, and all **261 cold Storybook interaction/accessibility cases**.
The public UI/API dependency build, publint, packed API declaration contract,
strict workspace Clippy, protocol drift checks, both renderer builds, static
Storybook with all 182 specification chapters, ten specification lanes and
78 governance regressions pass. Worker `lapis-native-background-full-25b319f4`
finished at **2026-10-26 00:58:06 UTC**. No functional or accessibility failure
remains in this bounded source qualification.

The four-CPU/12-GiB worker uses pinned image `9fa6f3fb` and the ten checksummed
archives in the existing acceptance manifest (SHA-256
`5455fdfdfc3e4c2693eda34b8f49f9ed5d4b4e386fd76ee419dfb07d160218b6`).
Native-source pins and tracked dependency inputs are unchanged from this
workspace's qualified parent. No Mac Rust build or native UI activation was
used for these portable source gates.

Only evidence and generated migration status change after that product
snapshot. `R3.2.1.3` remains **Working**: this foundation is source-qualified,
while complete Search provider/configuration adoption, actual Tauri and HTTP
host selection, their native/provider acceptance and final default cutover
remain separate. No host supplies the new port by default in this slice.
