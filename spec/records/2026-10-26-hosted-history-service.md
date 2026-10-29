# Shared hosted indexed History service

This R3 slice starts in `hosted-history-20261026` on committed metadata
intake `d133a31b`. The complete frozen runtime and all-host gates are preserved;
this change does not alter that qualified metadata product or its archives.

Desktop source `05d0e8ab` already observes a core-owned History index through
`start`, `status`, `query` and `context`. Those renderer DTOs and the context
projection remain Desktop-private. Rust HTTP has no corresponding route. The
retained Plugins service still exposes a renderer-driven `step`; it is not the
native adoption contract and must not be revived.

## Scope and boundaries

Extract the shared typed contract into Notes-owned generated public DTOs and
its API service boundary. Move generic immutable query/context projection to
the same core backup source used by the native owner. Keep Tauri/window policy
in Desktop, authenticated client policy in the Rust host and generic History
engines in `jj-vault`. Consumers use public contracts, with direct call-site
updates rather than imports of Desktop private files or compatibility copies.

Selected source start/status reuse the existing native worker. Reads never
capture, initialize history or schedule batches. Detach drains observation only.
Native close and storage relocation retain the existing explicit drain owner.
No changes to Tasks source/pins, default hosted selection, screens, publication
or distribution are included in this source contract gate.

## Exact regressions

The first target is `pnpm rust:core -- test -p lapis-server --test http_files history_indexing --locked`. New actual HTTP cases cover absent selection,
authentication/origin/unknown-field refusal and detached-client fencing.
The frozen baseline `35d7f343` completed with **0 passes / 3 failures**, all
expected missing-route HTTP 404s instead of the declared 501/422 boundary.
Worker `7746f662` preserves the complete log and result. Source, complete host
and retained screen gates remain separate, including every failed attempt.

The first route repair at worker `0589737a` passes two cases and exposes one
incorrect new-test expectation: revoked attachments are consistently HTTP 403 /
`PERMISSION_DENIED` in `host/attachments.rs`, existing database and indexing
acceptance. The new test expected the absent route's 404. Its final assertion
checks the established 403 plus exact typed denial; no host policy is weakened.

A host-only formatting attempt stops at missing sibling Cargo manifests in the
isolated checkout; no build or source change occurs. Formatting and binding
generation run in the pinned Docker source snapshot instead.

The expanded selected-host retry `4be5465b` passes **4/5**, including saved
identity/context, cross-vault refusal and physical-root replacement. The new
semantic-bound cases initially expected the JSON-shape rejection's 422; the
existing `ServiceError::InvalidRequest` mapping correctly uses HTTP 400. The
final test separately asserts shape 422 and semantic 400, each with exact
`INVALID_REQUEST`, rather than changing common error policy.

All five HTTP cases pass in `3c6edb68`. The first wider source run `62ad251c`
passes both admitted core controls, both initial wire cases, the complete Rust
server suite and all backup cases, then strict Clippy rejects a new fixture
constructor unused in other integration binaries. Selection now uses the shared
parameterized constructor; no warning suppression is added.

A source audit catches ts-rs's disabled Serde-compatibility behavior: the initial
ungrouped response was incorrectly declared as wrapper objects. An exact
generated-value regression reproduces **1 pass / 1 failure** in `59a25e8f`.
Explicit `#[ts(untagged)]` preserves the actual JSON union; a packed API contract
also accepts the plain status/context values and rejects scheduling/root inputs.

The canonical prepare `83b1f4c5` stops at the 400-line Markdown guard: a
redundant public-export description extended the already-full release chapter
to403lines. The description already belongs to the History contract, where it
remains. Removing the duplicate restores the unchanged release chapter; no
line/byte limit or requirement is weakened.

A direct progress-generator attempt in this isolated checkout lacked installed
Prettier and did not modify generated output. Its pinned Docker preparation
owns the formatter and generator; no local dependency alias is added.

Resuming the created Docker snapshot directly over SSH completed all canonical
validators and mdBook, then spec-first identified the public API export's
required package-chapter mapping. The existing public-port summary now covers
both native ports and links their separate ownership; the chapter remains
400lines. No implementation or qualification assertion changed.

SSH-controller attempts `717a8a2a` and `2164612e` failed before worker startup
(create/start transport refusal), without a product result. The latter remained
in Docker's `created` state and was explicitly resumed on the same source,
image and volumes. Ordinary supported Docker-context transport then passed its
read-only inventory probe and was selected for subsequent qualification. This
changes only the ignored task runner's controller setting; Linux isolation,
source/archive hashes and resource bounds remain unchanged. No host fallback or
production validation-tool modification is introduced.

## Final source qualification

Last updated **2026-10-26 09:58:45 UTC**. Frozen full runtime
`ec988abcc6d71b5edcbff70f11ade1763ee4edbc`, receipt `62d34665-e94e-4158-8a08-2c4fb2f18b71`,
passes its complete immutable Docker gate. One persistent SSH controller
connection creates/transfers/runs/collects the same pinned image, source and
private volumes with four CPUs /12GiB. Previous connection-refusal attempts
remain failed infrastructure attempts; no product lane moved to the host.

| Gate                                          | Final result                                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Original HTTP regression                      | Five passes; absent-route baseline0/3 retained                                                                      |
| Public wire / admitted controls               | Two plus two passes; incorrect TS wrapper baseline1/2 retained                                                      |
| Affected Rust server / backup                 | 76 /16 passes; strict Clippy passes                                                                                 |
| Full `pnpm check:all`                         | 470Rust,2289package cases; seven intentional native ignores and one retained Deno skip; all strict/build lanes pass |
| Cold `pnpm test:storybook`                    | All261cases across four reports; no interaction/accessibility failure                                               |
| Static Storybook                              | Pass                                                                                                                |
| Actual metadata / Rust / Node / standaloneWeb | 1+8+1+12=22passes                                                                                                   |
| Final `pnpm spec:check`                       | All canonical/mdBook/spec-first/ownership lanes and78governance cases pass                                          |

The packed API declaration contract accepts plain status/context values and
rejects renderer `step` and physical-root authority. Existing generated plugin
registry output was retrieved from the qualified built container and restored
exactly; formatter equivalence proves the removed1,600-line formatting churn
was presentation-only. The final source delta adds only its13generated entry
lines. Generator output is checked against that producer rather than reformatted.

R3.2.3.3 becomes **Source complete**. LN-CORE-011/012 and LN-SRV-024 are
source-implemented. LN-WEB-067 and aggregate R3.2.3 remain **In progress**:
public controller adoption, admitted hosted HistoryReader/full saved-version
activation, Desktop thin CoreClient intake and combined main qualification are
not implied by these passing source/transport gates. Application defaults,
publication and distribution remain unchanged.
