# Main-workspace Tasks occurrence source intake

Status: main-workspace source intake qualified. Both host/plugin selections stay
waiting. The original source qualification is preserved at `23f0e8c6` and in its
[immutable receipt](2026-10-25-native-task-occurrences.md).

## Integration boundary

This intake duplicates the isolated source slice onto Notes `04ce1f88`, which
already qualifies the Docker permission/lease changes and released Mira intake.
The original `native-occurrences` workspace remains clean and unchanged.

The only merge conflicts were the master tracker, its JSON ledger and native
source inventory. Resolve those from the current main checkpoint, retain its
provider/default-mode findings and completed sibling-tooling evidence, then add
the exact Tasks parser pin. Current LN-CORE-007 provider evidence and the source
LN-CORE-005 implementation row are both retained. Regenerate grouped tables.

A Jujutsu comparison against `23f0e8c6` reports no differences in `Cargo.lock`,
`crates/lapis-app-core`, the native source inventory, or the canonical Rust
application/indexing chapters. The qualified production code, tests, fixtures,
Cargo dependency selections and parser pins are unchanged. Only host-selection
gates can activate these services; this intake enables no writer.

## Qualification

The exact five-case native target is rerun first through the main workspace's
Docker-default runner. Full native tests, strict source/protocol/Clippy, locked
build and current specification gates follow. Receipts qualify this combined
main checkout independently of the original isolated source proof.

| Boundary                      | Result                                                                                                             | Run receipt                            |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| Exact occurrence target       | Five pass, zero failures                                                                                           | `8bbd0aea-0070-4850-b531-e058ff44f05c` |
| Strict native checks          | Boundaries, generated protocol, rustfmt and workspace/all-target Clippy pass                                       | `380d530b-0eca-481f-8430-796a508c84fb` |
| Complete native tests         | 344 Rust plus five boundary cases pass; zero failures. Six retained model/crash ignores                            | `e49fecfd-7bab-42fb-a983-ad428a8484fc` |
| Locked native workspace build | Pass                                                                                                               | `13cf93e5-297f-4214-967f-27ff72c9ed31` |
| Full specification            | 78 regressions plus canonical mappings, App ownership, metadata audit, protocol/boundary, progress and mdBook pass | `9a2d0492-8935-4fe3-bbd1-ccdc9c3fb78e` |

The integration changes no renderer or host activation. Notes `04ce1f88` retains
its separate full 2,209-package/261-catalog consumer proof; these source-only
checks do not repeat or replace that UI gate. The native snapshot explicitly
records Design Core archive `4f6b3f5c…` from committed `944cd448` and the existing
qualified prerequisite archives, rather than claiming a frozen registry install.

Final generated progress checks, all 11 exact tracker regressions, changed-file
Prettier and the source-byte equality check pass. The original isolated source
commit is not rewritten. Actual OS/provider application gates, final frontend
archive admission and both host/plugin selections retain their own receipts.
