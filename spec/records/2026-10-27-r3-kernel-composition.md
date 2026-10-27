# R3 native kernel composition

This isolated workspace starts from committed History/restore-diagnostic source
`b84666725144f63e13886ff9d684a4ca06a13e3b`. It duplicates only the change from
`cf7bf94990d26e903e34ec9921054cff07ab6a63` onto that base. The index commit's
parent `a3cbf03f` contains independent R4 codec work and is not imported or
merged. Root's API Undo source `1c89dfb1` and archive `d178b9d4` remain separate
qualified renderer inputs. Default/main and Root's workspaces are untouched.

## Composition boundary

The only production changes from the diagnostic base are indexing
`controls.rs` and `owner.rs`; its deterministic test is copied exactly. Every
other native product/test, protocol, server and Cargo input must remain equal
to `b8466672`. All three index files must equal `cf7bf949`. Native sources and
the declared sixteen public prerequisites remain pinned. No R4 codec or queue,
public API, DTO, scheduler, writer, host selection or default is introduced.

The three documentary conflicts preserve both index/diagnostic requirements,
latest master authored activity and all 104 source task rows. The historical
[History/diagnostic source receipt](2026-10-27-r3-main-composition.md) and
[independent indexing receipt](2026-10-27-native-refresh-observation.md) retain
their original source counts and contexts; 591 from the latter includes its
old codec context and is not this composition's native count.

## Required closure

Run the exact deterministic Refresh case, all seven backup diagnostic cases,
affected indexing/HTTP and backup/restore families, native strict/protocol/fmt,
the complete ordinary Rust suite (expected 597 with no codec), locked build,
and the affected actual hosted/native consumers. Send Desktop an immutable
candidate after exact/strict gates; API `d178b9d4` is supplied separately.

Model engines, model assets/fixtures and production clock logic remain exact
qualified inputs. Reuse the precise prior five-model/source/clock receipt only
by equality; do not claim a fresh numerical-model run or redownload assets.
Source, actual host adoption, latest main composition and overall R3 remain
separate gates. R4+ and publication/signing/default cutover remain outside this
composition. Results and frozen input identities are pending.
