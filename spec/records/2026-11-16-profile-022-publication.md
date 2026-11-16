# App Profile 0.2.2 publication

App Profile 0.2.2 is published from source
`4d9e01e61eed701febe76c4899df63a09aa45b08` after feature PR #133 and
version PR #134 merged. GitHub release run
[43769008598](https://github.com/lapismd/lapis-notes/actions/runs/43769008598)
succeeded, including publication, registry verification, GitHub releases and
consumer notification. The [package release](https://github.com/lapismd/lapis-notes/releases/tag/app-profile%400.2.2)
is public.

Fresh npm metadata confirms integrity
`sha512-Va9HvXBidSLTBuD7BSW0gj7j/lh5F61ylC8DEseFQJWDxwTOKFzjb4xaexTUf1T3srXkk+ZjgzMO5wEVVgiAVQ==`
and a SLSA v1 provenance attestation. Dist tags remain `latest=0.1.0` and
`next=0.2.2`; publication does not promote the default tag.

## Final source qualification

After rebasing on current main, root check and test each pass 16 tasks, and
root build passes nine tasks. API passes 1,822 unit cases; Profile passes 99.
The full current catalog passes 288 cases across 63 files. The earlier
[History intake receipt](2026-11-15-profile-history-050-intake.md) retains its
290 cases across 64 files and the failed browser connection followed by cold
recovery. The rebased main catalog excludes the two Link Preview cases from
that earlier inventory; this release adds no quarantine or baseline update.

The previously pending authentication and publication gates in that receipt
are now satisfied by the successful release above. Desktop and Server consume
this package through normal registry ranges and record their acceptance in
those owning repositories; this receipt does not qualify either host.

## Documentation verification

The installed Node spec-validator is the current released 0.2.0. Doctor passes
with the existing optional script-alias warning; QMD requirement search runs.
This publication-status update runs formatting and specification checks only.
