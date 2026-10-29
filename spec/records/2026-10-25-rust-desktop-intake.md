# Shared Rust host intake — committed Desktop qualification

Desktop commit `efa44bb0` (change `tnnyuvsv`, parent `a5b936e0`) lands the
shared database, backup and installed-asset adapters. Its working copy is clean
after commit. This closes the consumer-commit holds recorded in R1.3.8,
R1.3.10 and R1.3.11; it does not qualify the newer native R2 execution work.

## Original gates and source scope

- R1.3.8: the existing packed AppDatabase provider uses Rust-generated
  high-level calls and scoped changes. Native admission, rollback, observation,
  view/vault closure and cold persistence pass without renderer SQL. The HTTP
  half retains its [separate source and process qualification](2026-10-24-rust-http-database.md).
- R1.3.10: native backup selection reuses Core's coordinator and watcher;
  renderer reload detaches. Accepted capture completes without a client, and
  explicit close/disable/Quit drain. Six hidden native API cases and eleven
  original packaged lifecycle cases pass. The HTTP half retains its
  [detach/final-capture qualification](2026-10-25-rust-backup-commands.md).
- R1.3.11: both actual native file-action journeys pass: rename/move protects
  collisions, active edits and cold layout (9.35s); exclusive creation protects
  collisions, binary/Unicode bytes and Explorer intent (2.82s). The hosted half
  retains its [committed seven-journey qualification](2026-10-25-rust-native-file-actions.md).

These complete R1.3's original file/database/shell/backup intake gate. The
existing managed-vault, folder/ZIP transfer and signed installed-plugin
journeys remain R1.3.9.1–3. R2–R7 feature parity and final hosted replacement
are separate; Node remains the serving baseline.

Desktop's E-CORE-016/017/018 retain the commands, initial failures, selected
milestone gates and exact versions. Database/JS archives use Notes `b55d3492`;
backup uses `6f637449`; asset/file-action compatibility uses `fe604931`.
Five refreshed Notes JS archives and fourteen retained payloads remain the
nineteen-entry development cohort. No full-cohort freshness or publication is
claimed. Lapis AI remains unchanged at `6548afe0`.

## Final consumer evidence

The intake passes 235 native service, 416 renderer/governance and 744 AI cases;
all 2,000 catalog cases across cold viewport/theme processes; six hidden native
API cases; and eleven original packaged lifecycle cases. Seven native asset
cases, normal/e2e strict checks, both native builds, types and the ordinary
bundle audit also pass. The bundle contains zero automation markers.

Final documentation qualification runs `pnpm check:progress`, `pnpm spec:check`
(all four lanes) and changed-file Prettier. The completion metadata initially
omits M16.3's exact `completedGates` value; recording the unchanged gate clears
that one finding. Formatting the generated summary clears its whitespace-only
finding without changing the generated projection.

## Explicitly accepted existing failures

The original native UI lane retains **27 passes / one failure** for Markdown
attachment rendering. The defect is independently reproduced in the owning
`lapis-plugins` Markdown asset adapter. On 2026-10-25 the user explicitly
answered: “Accept the recorded failure and commit the verified intake.”

That source repair remains pending with its own prerequisite/audit findings;
no failed run is relabeled, assertion weakened or package workaround added.
The separate unchanged E-AI-109 formatting exception retains its earlier
explicit user acceptance. Neither exception qualifies a real provider, Linux,
distribution/signing or final cutover. M11 remains Deferred.
