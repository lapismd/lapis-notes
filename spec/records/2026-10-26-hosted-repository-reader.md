# Hosted Repository reader intake — 2026-10-26

Scope: R3.2.3.5, LN-CORE-016–018, LN-SRV-026 and LN-WEB-069. This is the
read-only managed-backup intake. Legacy revision capture/retention, guarded
restore and original-repository parity remain Waiting at R3.2.3.6. Node cutover,
publication, installed-app replacement and signing remain separate gates.

## Result and ownership

The selected Rust-hosted application reuses the retained Repository screen for
immutable revisions/diffs, saved-history Search and file blame. Its existing
admitted client carries the public lossless SDK frames directly to Core. No
companion, replacement screen, copied query engine, renderer batch scheduler or
ordinary default change is introduced.

Core owns one bounded native reader executor per vault. Existing Work leases
retain accepted requests independently of HTTP waiters. Native caller scopes
bind the live client, vault, generation and physical backup source. Removal,
expiry and principal retirement explicitly fence retained Client Arcs, retain
detached dirty claims and drain that caller's handles. Successful vault close
joins the executor; failed final capture retains the original reader for repair.

Source admission adapts the retained Desktop/hosted-services physical witnesses
and resolves installed layout through BackupStorage without recovery or capture.
The entire native binding and retained physical root identity must match the
manifest. Missing history stays empty without initialization; changed bindings
and sources fail closed. Preparation, immutable query, blame and cache engines
come directly from pinned jj-history-service.

The private app-profile/native-repository entry owns optional registration and
App binding before configured plugin loading. Web retains its existing generic
session and four-plugin base profile. Repository unload closes accepted reads
and handles before binding and client release. The frozen Deno product is unchanged.

## Dependency cohort

- Public History plugin: `214917c849e7e9440bd6792d480677c745db6873`;
  archive SHA-256 `0fa89766e6501c7d868772e2da4617598b31c13d385d5942d5448f858ae534f0`.
- Lossless SDK `@lapismd/jj-history@0.1.0`, retained qualified public archive
  SHA-256 `94bae0ae3557262629e49455f80bb86ccd553232c4de23472415228b17f0d160`.
  It comes from Desktop's retained `metadata-owner-20261026` cohort.
  Current SDK tracked source is byte-identical to the jj-store pin above, and
  all thirteen public dist files match this archive. Qualification uses those
  public exports, never a source alias or copied SDK.
- The SDK remains unpublished (registry E404 checked 2026-10-26). Only the
  private Web application declares its temporary sibling link. Local source
  setup requires a built sibling SDK; native tracked-source export does not
  contain its ignored `dist`. Docker acceptance must select the exact public
  SDK archive in its ignored validation overlay. Main intake retains that same
  archive. Publishable API/plugin manifests keep registry semver ranges.
- Other source pins and public archives remain the prior qualified History
  adapter cohort. Source and consumer revisions are recorded separately.

## Qualification

Frozen product source **`5032dbda44cc112cc955b705124438679be70494`**, parent `2d250f66`, is retained in
`.local/validation/runs/lapis-hosted-native-history-reader-full-244d4fdd-0af9-4fc8-ac26-e7f6fed7b0f9`.
Source/archive hashes, native pins, commands, reports and browser traces remain
in the ignored run directory. The final documentation gate records its own
source; runtime and test inputs must remain identical to this product source.

| Boundary                                                  | Before                                                             | Final product result                                                                              |
| --------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Hosted factory/SDK (`src/hosted/rust/repository.test.ts`) | 3 failing / 1 passing with parent backend                          | 4 passing, including full-width generation, native diagnostics and reply fencing                  |
| Retained preparation/handle lifecycle                     | Existing retained implementation                                   | 3 passing                                                                                         |
| Real native reader/source/lifetime                        | New source                                                         | 5 passing                                                                                         |
| Forged native manifest binding                            | 1 failing                                                          | Both foreign vault-ID and physical-root mutations rejected in the exact case                      |
| Retained Client Arc after remove/expiry                   | New regression                                                     | 1 passing, both retirement paths and protected dirty claims                                       |
| Admitted HTTP read methods                                | New native route                                                   | 1 passing, including protocol, Origin, vault/method admission and oversized connection retirement |
| Shared profile registration guard                         | 1 failing / 4 passing                                              | All 5 unchanged cases pass; 2 new profile ordering/cleanup cases pass                             |
| Cold actual Repository/diff/blame/Search                  | Restart helper incorrectly expected login after a retained session | Passing after admitting either current login or authenticated chooser                             |
| Complete native suite                                     | Separate gate                                                      | 514 passing, zero failing, same 7 intentional asset/provider ignores                              |
| Complete package suite                                    | Separate gate                                                      | 2,313 passing, including 1,628 API, 86 Web and 50 app-profile; same one Deno skip                 |
| Cold interaction/accessibility catalog                    | Separate gate                                                      | All 261 passing; static Storybook builds                                                          |
| Complete browser profiles                                 | Separate gate                                                      | All 23 passing: selected History 1, metadata 1, ordinary Rust 8, Node 1 and standalone 12         |

Full check/test/build passes, including strict workspace/all-target Clippy,
protocol drift, App ownership and package output. The product report retains
its overall failed status because the last canonical spec-first check found
two missing mapped chapter updates. Those architecture/catalog references are
now supplied. The separate canonical documentation closure at
`480e8ad3b59885f195df50a3b8aa9c3051b56e48` passes all ten configured lanes and
all 78 governance regressions. Only evidence/checkpoint edits follow that gate;
native, runtime and test inputs remain byte-identical to the product source.
The earlier four mirror/order/chapter-layout findings, one collapsible-if lint,
ten missing-output package-check findings and two Svelte initial-prop warnings
are repaired. No test assertion, visual baseline, warning policy or functional
gate was relaxed. Native zero-client/paused/cold indexing remains covered by
the existing real-owner cases in the full native suite; the browser journey
independently qualifies retained screens and cold saved-version access.

## Remaining boundaries

R3.2.3.6 still owns unattended legacy file-revision capture/retention, existing
guarded restore and supported original-repository source parity. Complete
both-application R3 and provider/default cutover gates remain separate. The
unpublished SDK's private archive/bootstrap and publication boundary remains
explicit above. No changes were made to lapis-ai, jj-store or the frozen Deno
product implementation in this slice.
