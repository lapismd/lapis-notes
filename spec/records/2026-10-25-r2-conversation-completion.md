# R2 durable conversation completion

Updated 2026-10-25 22:59:26 UTC. This closes the agreed staged R2/R2.3 gate after the verified
Desktop consumer commit `8289c3109ced8a68ed9e9f7876c168d5e7894018`.
It does not switch defaults or complete broader M10, R3–R7 or release work.

## Requirement-by-requirement review

| R2 checkpoint                                | Authoritative evidence                                                                                                                    | Result                                                                                                                           |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Native admission and supervised execution    | [Native turn](2026-10-25-rust-native-turn.md) and [Desktop intake](2026-10-25-rust-native-turn-desktop.md)                                | Source qualified; both retained application adapters adopted separately                                                          |
| Typed HTTP/client protocol                   | [Typed hosts](2026-10-25-rust-turn-hosts.md)                                                                                              | Completed protocol, authentication and detach/restart boundaries                                                                 |
| One conversation and sequential continuation | [Continuation](2026-10-25-rust-conversation-continuation.md)                                                                              | Same stored identity, guarded stale-head refusal and no replay                                                                   |
| Existing applications observe native work    | [Actual-host intake](2026-10-25-rust-chat-native-acceptance.md)                                                                           | Desktop composer/History/tab reuse/cold persistence and retained Rust-hosted shell                                               |
| Real provider finishes without its client    | [Hosted screen](2026-10-25-hosted-provider-screen.md), [Desktop screen](2026-10-25-desktop-provider-screen-intake.md), Desktop E-CORE-027 | Actual Codex composer, running detach, observer-free completion, reload and cold History retain one journal and exact transcript |
| Combined Desktop cohort/catalog gate         | Desktop E-VALIDATION-003 at `8289c310` and retained post-commit audit                                                                     | All final source/catalog/native/build/specification gates pass                                                                   |

The parent stages retain source-versus-host evidence separately; Source complete
child rows are qualified source checkpoints, not additional unfinished R2 work.

## Final Desktop intake

The 16 disjoint cold viewport/theme reports pass 2,016 cases with zero failures,
errors or skips: 456, 452, 536 and 572 cases by shard. The matrix receipt SHA-256 is
`cf61c6133f3e010f003d0ba527c2642df299be6e2b03d4e510c0cf50f380e8ba`.
One private History story has an explicitly recorded whitespace-only formatting
projection; assertions and all other selected bytes match the final source.

Complete test run `bac8dc24` passes 498 governance/renderer, 744 AI and 240 native
cases. The two unchanged subprocess helper ignores are exercised by their
parent tests. Runner guards `9652da71` pass 79/79. Types and strict normal/e2e
Clippy pass. Final cold renderer `8a4b40fb` and static Storybook `60006b06` pass.
Four-lane specification `ce0ab9ce`, final record validation `c08a972c` and
progress `b83a7397` pass; all 92 changed paths are formatted. Full formatting
retains only the previously accepted unchanged immutable E-AI-109 finding.
Original failed attempts remain in source evidence; no new failure is waived.

The post-commit audit is Desktop ignored
`.local/validation/R2-closure-audit.json`, status qualified committed. It verifies
26 archive payloads, 101 active routes/26 contexts and Svelte 5.56.10. Product and
native inputs match actual-provider source `c83736e9` exactly. Notes R2 turn and
protocol sources also remain byte-identical between the retained native pin
`f0cf7b1a` and integrated main `40f3a84a`; later Tasks changes do not select an
alternate R2 writer.

| Retained identity    | SHA-256                                                            |
| -------------------- | ------------------------------------------------------------------ |
| Portable manifest    | `6155c213aa847c8e880288d893f24daea3c8be7d19512a919b6e3a7c3af31efb` |
| Lockfile             | `4351c4b60fffe6c2a317d351a0d5aa23f469446f09700da59d7517104ff2803d` |
| 26-archive inventory | `fb390d92fc9ccdd7f50841490a002b5888b1658918d34cab220e53448c5c0ce2` |
| Actual native binary | `7386432b00de597ffdcf38382b62091611352986a64faeb2b200de6ccf2d9a10` |
| Cold transcript      | `9c5ebe3f8d221310744e5099eccff6dd9292efe47106e4ccbc909879bae1833e` |
| Single journal       | `d86e84e1a99ac3bf38f6d94e20f4e7be7c5ac9f054ca001b863a4a0ffd56af7b` |

## Remaining scope

Native AI remains explicitly staged. Queues/tools/Changes (R4), memory (R5),
operation ownership (R6) and final hosted/default cutover (R7) remain open.
R3 owns remaining indexed-vault work. Broader Desktop M10/provider-matrix,
publication, distribution and visual review are separate gates.

This master update changes documentation only. Its own formatting, all eleven tracker regressions, generated-progress
consistency and canonical validation pass (11 validators, 181 chapters and
1,517 requirements); it does not rerun or relabel qualified product reports.
