# October 30 framework release

Changesets [PR #45](https://github.com/lapismd/lapis-notes/pull/45) was approved
and merged after all ten required CI jobs passed. The release source is merge
`462d224885196f9572c526543430d5f9a3ae3014`. The ordinary push prepared and
validated its artifacts; the explicitly approved `publish=true` dispatch is
[run 41142187879](https://github.com/lapismd/lapis-notes/actions/runs/41142187879).

## Published packages

| Package                  | Version | npm channel | Artifact SHA-256                                                   |
| ------------------------ | ------- | ----------- | ------------------------------------------------------------------ |
| `@lapis-notes/ui`        | `0.1.5` | `next`      | `878fbf0d33fbaf7b2a79dcfe21bce29b01845307c21d8616a6e9365a781d1c6a` |
| `@lapis-notes/api`       | `0.2.1` | `next`      | `d8f6e3f89ce76c06d331dc90d7906118f44aaac8beedc1f2fe1cb8a07509a103` |
| `@lapis-notes/workspace` | `0.3.1` | `next`      | `44fb7b23f98b247d99c957b349709d6d0f9881907dc21eb4763b4217491e734a` |

`latest` remains `0.1.0` for all three packages. No channel promotion was made.
File Explorer `0.2.0` and Language Service `0.1.2` were already public and were
included unchanged by the repository's registry-consumer verifier.

Artifact `13020302605`, named
`lapis-notes-release-462d224885196f9572c526543430d5f9a3ae3014`, contains the
manifest, release plan, and three tarballs. GitHub records its archive digest as
`sha256:658139cb276b73415b07c909734ec0ddce7d2ace5f1ee2c5ed0c327ead136a42`.
Independent verification compared each local tarball's SHA-256 and SHA-512 with
the manifest and its downloaded npm bytes: all three match exactly.

## Qualification and publication

All source validation jobs passed: registry fixture, build cache, release
artifacts, static Storybook, quality, interaction/accessibility, governance,
unit tests, full Web acceptance, and the aggregate gate. The protected
`npm-production` publish job completed using GitHub OIDC and signed provenance.

The `Verify published packages` job passed the repository's unchanged
`pnpm release:verify` command. It installs the current public package cohort
using the exact pnpm pin and approved dependency-build list, builds the Vite
consumer, and resolves the public exports without repository hooks or patches.
This is LN-PKG-056, LN-PKG-157, and LN-PKG-158 release evidence.

An additional temporary consumer installed the three exact registry versions,
then ran `npm ci --ignore-scripts --no-audit --no-fund` and
`npm audit signatures`: 500 registry signatures and 112 attestations verified.
For each released package, the SLSA subject SHA-512, source commit, main ref,
`.github/workflows/release.yml` identity, and invocation match this dispatch.
The script-disabled npm consumer verifies frozen installation and signatures;
the workflow's separate Vite consumer proves the build and public imports.

The final `Create GitHub releases` job passed. Published releases
[`ui@0.1.5`](https://github.com/lapismd/lapis-notes/releases/tag/ui%400.1.5),
[`api@0.2.1`](https://github.com/lapismd/lapis-notes/releases/tag/api%400.2.1), and
[`workspace@0.3.1`](https://github.com/lapismd/lapis-notes/releases/tag/workspace%400.3.1)
all resolve to the qualified merge commit. The entire dispatch completed
successfully. Desktop registry intake and native acceptance remain
consumer-owned follow-up work; this record does not claim Desktop qualification.

## Specification follow-through

Spec-validator `0.2.0` doctor passed ten checks with the existing intentional
script-alias warning, and semantic QMD search returned the owning package topics.
The first documentation validation rejected a redundant chapter link because it
made that canonical page 402 lines. Removing the duplicate retained the release
context and verification links while restoring the existing 400-line limit.
The failed receipt is retained in local validation run
`lapis-notes-validation-57c836b0-c2c7-4576-945f-f4b674cf4279`.
Final documentation validation passes all 11 validators across 194 chapters and
1,567 requirements. Specification-doc TypeScript checks and all 194 canonical
Storybook mirrors pass; formatting passes for every changed document.
