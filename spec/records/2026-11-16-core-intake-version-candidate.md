# Core-intake version candidate

Main recovery PR143 merged at `6613d7c954d8bdb2effd712c3eb68cac56e9a90b`
after every current PR check passed. Standalone Pages run `43826105926` executed
`node scripts/main-spec-first.mjs` successfully: five protected files and nine
canonical chapters; build and deployment succeeded. The local source receipt
retains the exact job log. PWA run `43826105985` also executed the same main
gate successfully with five protected files/nine chapters in governance job
`133161459721`. Manual-main acceptance remains a separate checkpoint.

## Genuine existing release intent

Main Release run `43826106373` executed the unchanged `pnpm release:version`
recipe through the scoped App. The resulting bot commit
`c9d9fa3815c0500ef4dbd32e31b280f740f81913` has main6613 as its direct parent;
REST identifies `lapismd-dependency-bot[bot]` as author and `web-flow` as committer.
Its existing three patch Changeset entries produce only:

| Package                  | Previous | Prepared | Internal closure                                   |
| ------------------------ | -------- | -------- | -------------------------------------------------- |
| `@lapis-notes/ui`        | `0.2.1`  | `0.2.2`  | Core `^0.13.4` retained                            |
| `@lapis-notes/api`       | `0.6.6`  | `0.6.7`  | UI peer `^0.2.2`; Core `^0.13.4` retained          |
| `@lapis-notes/workspace` | `0.4.6`  | `0.4.7`  | API `^0.6.7`, UI `^0.2.2`; Core `^0.13.4` retained |

The nine generated version files are the consumed Changeset, three manifests,
three changelogs, the mechanical workspace lock-specifier closure and API's
generated host-module version metadata. No module/export declaration, external
resolution/integrity, runtime source, separately held package or Deno host changes.
The governed manifest retains the `next` channel; no publication or dist-tag
mutation is part of preparation. Existing artifact, signature/provenance,
registry-consumer and protected publication gates remain authoritative.

## Canonical preparation

The exact main6613 to bot-candidate range initially fails five
`SPEC-FIRST-MISSING` diagnostics, eight protected files and zero canonical
chapters. Canonical-only preparation atop the genuine bot commit supplies the
five owning topic families with current prepared-version and unchanged-contract
facts. It consumes no new Changeset and invents no release version. Normal main
specification-first remains mandatory, independently of the PR exemption.

Version PR142 remains open for root review and complete exact-head CI. Neither
old-head green checks nor the independently successful main deployments qualify
a new candidate. Publication, actual registry readback and downstream acceptance
remain pending until the reviewed release path completes.

## Source qualification

Exact source comparisons admit only the three intended manifest changes and
three workspace lock specifiers. All external resolved identities/integrities
are unchanged. The 122-record generated inventory changes only 45 API
`package-json-export` version fields; configured records, export declarations
and every other field remain identical. Focused version, release-plan and
release-intent tests pass twelve cases.

Default Docker `pnpm spec:check` passes all six configured lanes, including
specification-first and mdBook, App/metadata audits and 69 specification tests.
Default Docker `pnpm packages:check` passes package boundaries, local-consumer
policy, release policy and all 159 release regressions. Explicit-native
specification documentation checks retain 194 current mirrors. Canonical
validation, formatting, actual QMD discovery and doctor remain required.
The file-limit validator caught the already-full release-policy chapter; the
prepared cohort facts instead belong in the existing Packages composition
chapter, preserving the policy chapter and its 400-line ceiling.

The prepared committed range must pass the explicit main6613 comparison,
reducing the bot-only candidate's five missing families to zero. This is bounded
manual canonical preparation on the genuine bot release, not a new automated
intake exemption. Keep the exact current PR's complete CI, source review and
publication approval pending until independently qualified.
