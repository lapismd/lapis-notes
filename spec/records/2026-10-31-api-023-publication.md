# API 0.2.3 publication and released-source App Profile

Current behavior belongs to LN-ARCH-118 and the package lifecycle chapter.
Current consumer follow-up belongs to the owning Desktop backlog. This receipt
retains completed source, version, publication and artifact evidence without
rewriting the earlier Sync or composed-Bits qualification records.

## Source and version gates

- [Source PR #51](https://github.com/lapismd/lapis-notes/pull/51) merges at
  `d175a6cf2b8024ef28f7365746a42b9b57c2747d` after all ten jobs pass in
  [source CI](https://github.com/lapismd/lapis-notes/actions/runs/41188069758).
- [Changesets PR #55](https://github.com/lapismd/lapis-notes/pull/55) changes only
  API 0.2.2 to 0.2.3, its changelog and matching generated host-catalogue
  metadata, and removes the consumed Changeset. Review `5722192203` approves
  exact head `a1b2947c03530210dfdc7fe8d4fc53bbef74557d`.
- Its bot-triggered CI initially requires maintainer approval. The normal
  Actions approval endpoint starts that existing run; all ten jobs then pass in
  [version CI](https://github.com/lapismd/lapis-notes/actions/runs/41189187939).
- The version PR merges at released source
  `0d9d4d9253579541b1e796d7f2c68ef3b19a8df6`. The explicit `publish=true`
  [Release dispatch](https://github.com/lapismd/lapis-notes/actions/runs/41190163735)
  uses that exact main revision. Its duplicate non-publishing push run
  `41190158571` is superseded, preserving every publication validation gate.

All **14 publication jobs pass**, including the ten validation lanes, actual
npm publication, fresh published-consumer verification and GitHub release
creation. OIDC, the protected environment, immutable downloaded candidate and
release-script approval guard remain in use; no authentication setting changes.

## Actual npm artifact

The sole new public package is `@lapis-notes/api@0.2.3`, published to `next`.
The existing `latest` tag remains `0.1.0`; no tag promotion is inferred.
UI 0.1.5, Workspace 0.3.1, Language Service 0.1.2 and File Explorer 0.2.0 remain
unchanged public companions in registry-consumer verification.

| Identity  | Verified value                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------- |
| Tarball   | `lapis-notes-api-0.2.3.tgz`                                                                       |
| Size      | 743,727 bytes                                                                                     |
| SHA-256   | `00f234336b3dd33cbcd0814ae45e819dc82484497caa051cdac9571d17f43700`                                |
| npm SHA-1 | `4f73265696cd69e621927d3808f805dbcc1335f5`                                                        |
| npm SRI   | `sha512-CGQQzAq/2aH3SDznhVIv/1oCictAxvXfLUiqQ4aYfmR0hN2YL/jTomH9sJn+gVSnSoeP4qyXXTMmRNrZfABM0Q==` |

Independent registry download matches both advertised npm integrity algorithms
and the actual merged-source candidate's SHA-256. The pre-merge version candidate
also has identical tarball bytes, but publication uses the actual merged-source
manifest. The packed manifest says API 0.2.3, retains Minimatch `^11.0.1` and
Design Core `^0.7.2`, and the compiled Sync host contains the settlement of
initialization and admitted events. Generated API catalogue entries say 0.2.3.

The workflow's fresh consumer installs this actual registry version with its
unchanged public companions and passes the documented public-export and Vite
build checks. LN-PKG-157/158 keep its exact pnpm pin and approved build policy;
it inherits no producer hooks, patches or overrides.

## Cryptographic provenance and GitHub identity

The registry supplies a SLSA v1 provenance bundle. Independent cryptographic
verification passes using the existing npm toolchain's Sigstore 4.1.1 and
`@sigstore/verify` 3.1.1, with normal trusted-root, certificate and transparency
log verification. The policy requires issuer
`https://token.actions.githubusercontent.com` and exact certificate identity
`https://github.com/lapismd/lapis-notes/.github/workflows/release.yml@refs/heads/main`.

The signed statement binds:

- Subject `pkg:npm/%40lapis-notes/api@0.2.3` to the downloaded tarball's SHA-512.
- Repository `https://github.com/lapismd/lapis-notes`, workflow
  `.github/workflows/release.yml`, ref `refs/heads/main` and `workflow_dispatch`.
- Resolved Git commit `0d9d4d9253579541b1e796d7f2c68ef3b19a8df6`.
- Invocation `41190163735`, attempt 1, on a GitHub-hosted runner.

[GitHub release `api@0.2.3`](https://github.com/lapismd/lapis-notes/releases/tag/api%400.2.3)
is published, neither draft nor prerelease, at `2026-10-31T10:03:48Z`. Its
lightweight tag and target both resolve to the same released commit. Its body
matches the npm version, channel, source, SHA-256 and SRI above. The existing
Notes helper creates package-scoped releases with npm/source/integrity links;
it does not upload attached GitHub assets. No asset upload is claimed.

## Frozen private App Profile archive

After completing publication, a clean read-only export of that exact released
commit produces `@lapis-notes/app-profile@0.0.0` as a **private local
qualification archive**. This does not publish another npm package.

The validated Linux UI image is
`sha256:a4ffd16112f050b63d0e53c22ce7f6e8790872c0cdcfb2d8c85d5a6df0bc8345`,
with Node 24.15.0, pnpm 10.34.5, four CPUs, 12 GiB RAM and 2 GiB shared memory.
It runs the established commands against the untouched source graph:

```sh
pnpm install --frozen-lockfile --ignore-pnpmfile
pnpm --filter '@lapis-notes/app-profile^...' build
pnpm --dir packages/app-profile build:native-chat
pnpm --dir packages/app-profile --config.ignore-scripts=true pack \
  --pack-destination /results
```

All 2,433 committed source blobs match their Git object identities before and
after build/pack. The lock SHA-256 remains
`51f4c55689070afc1249039b0ae660a830d507a76be96ee7ebf8ddab73430d5d`.
Frozen build inputs are API **0.2.3**, Design Core **0.7.2** and Svelte **5.56.10**.

| Archive identity         | Verified value                                                     |
| ------------------------ | ------------------------------------------------------------------ |
| Name/version             | `@lapis-notes/app-profile@0.0.0`, private                          |
| Size                     | 35,343 bytes                                                       |
| SHA-256                  | `975ea33dcba8d8db55288820221e8aae39f7d6fea4fc87312b64fa5b0715a1d5` |
| Packed API dependency    | `0.2.3`                                                            |
| Native-chat JS           | `./dist/native-chat/index.js`                                      |
| Native-chat declarations | `./dist/native-chat/index.d.ts`                                    |

The archive retains its source public entrypoints and built native-chat public
exports. API imports use `@lapis-notes/api`, `native-turns`,
`plugin-host-modules` and `workspace-host`; no dependency `node_modules` copy is
packed. The exact API dependency is 0.2.3 rather than the older 0.2.2 copy.

The archive is at
`/tmp/notes-profile-api023-artifact-20261031/results/lapis-notes-app-profile-0.0.0.tgz`,
with build provenance and API-route inspection beside it. Registry, Sigstore and
GitHub receipts remain under `/tmp/notes-bits-2202-20261031/actual-published/`.

Desktop must advance its Notes source pin and actual API intake to this released
source, then qualify the final cohort. **Source Core 0.7.2 build evidence is not
final Desktop Core 0.7.3 acceptance.** The root Bits patch still does not
propagate through published framework packages. Desktop owns its native close,
installed-plugin and final consumer gates; this receipt does not close them.

## Publication-state documentation validation

The current-state chapter, backlog and verification updates pass Prettier and
`pnpm spec:check` against the exact released base, including the configured
checks, mdBook, spec-first and 67 specification regressions. Doctor passes and
QMD native modules/index open; semantic publication discovery succeeds. The
latest Deno-free Spec Validator remains 0.2.0, matching the repository dependency.
Existing validation-wrapper alias warnings are retained without changing wiring.
