# Main specification-first recovery

The accepted dependency intake changed API, retained UI and Workspace Core
ranges from `^0.13.3` to `^0.13.4`, together with their frozen registry lock and
existing Changeset. Root tooling, App Profile and File Explorer were not admitted
for regeneration. This recovery changes no dependency, product source, version
intent, runtime or deployment policy.

## Initial failure

With released `@lapismd/spec-validator@0.2.0`, this exact committed range fails
five `SPEC-FIRST-MISSING` diagnostics: four protected files and zero canonical
chapters. Its existing Changeset is excluded as intended.

```sh
pnpm exec spec-validator first \
  --base a90761f1ee1f53305d8897cef6c57b4dc6496655 \
  --head 036204b0b52d70dd817a97983cefc3835f306cd8 --json
```

The required topic families are Architecture, Packages, Plugin Model, UI and
Styling, and Workspace Shell. Their current dependency facts are recovered in
owning functional chapters; context/index pages do not satisfy this boundary.
The original intake range remains immutable and still fails. Comparing its
original base to this recovery revision must return zero missing chapters.

## Source correction and qualification

The reusable CI governance job previously ran specification-first only for PRs.
The new separate main/manual step retains that PR expression unchanged. Release
and PWA validation inherit it; standalone Storybook Pages runs the same guard
before build and checks out full history. The guard checks public same-repository
main context, immutable exact checkout/head, push before/after and commit ancestry.
A missing/zero push before holds; manual main uses the exact head's first parent.
The released validator runs directly, outside the PR-only exemption wrapper.
No actor or input chooses a baseline; checkout movement remains a failure.

The exact missing-workflow test initially failed once. A separate new-guard
protected-path regression also failed once before its explicit mapping was added. After correction, all 35
focused main-range tests pass, including real isolated Git history, bot push,
missing/zero/mutable/unrelated refs, wrong event/head, manual parent selection,
late checkout movement, validation failure and workflow aggregation.

Full source validation and hosted PR/main acceptance are separate. This source
recovery does not qualify the still-held dependency scopes, permit merging the
pending version PR, or establish a general multi-runtime canonical intake opt-in.

## Verified source results

- Original base to recovery revision: zero missing chapters, nine protected
  files and nine canonical chapters. The old committed head remains five missing;
  invoking the new CLI on that exact range with a local bot-push event fixture
  also fails with those five diagnostics.
- `node --test scripts/main-spec-first.test.mjs`: 35 passed, zero failures.
- `node --test scripts/check-release-workflow.spec.mjs`: 70 passed, zero failures.
- Default Docker `pnpm release:test`: 159 passed, zero failures.
- Default Docker `pnpm spec:check`: all six configured lanes pass, including
  mdBook and specification-first, plus App/metadata audits and 69 specification
  regressions. The initial new requirement lacked its acceptance introduction;
  validation caught it and passes after the source correction.
- `pnpm release:check`, explicit-native `pnpm check:specification-docs` (194
  current mirrors), actionlint on both changed workflows, canonical Prettier,
  and actual QMD search for `LN-GOV-056` pass.
- `pnpm exec spec-validator doctor --json`: successful; its only warning is the
  intentional source-owned specification wrapper aliases. Registry readback
  confirms `0.2.0` remains the latest Deno-free validator; no lock change is needed.

The first parallel Docker invocations collided on their shared workspace lease;
sequential reruns pass without a worker or container-policy change. All retained
raw logs and invocation reports remain local/ignored. Full hosted PR CI and
post-merge main/manual acceptance remain outstanding, with every product and
publication gate retained.
