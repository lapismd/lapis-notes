# Hosted retired-free fixture landing and icon continuation

Notes [#165](https://github.com/lapismd/lapis-notes/pull/165) merged at
`545284a05f418b8d8b882c797b48878cf820bab1` after required workflow
`44198935057` passed at exact checked head
`73c1200d289c70f6d3ad5844a8a3381bab7eed0c`. All twelve executed jobs pass;
the existing configured Storybook interaction quarantine remains skipped and
is not counted as a passing interaction result.

The actual hosted Plugins `96935625` producer passes source admission, existing
audit, package/artifact production and signed fixture creation. Hosted Web
acceptance passes all 13 cases in job `134450748502`, using downloaded fixture
SHA-256 `0210362f1cf6fad637e412d6315979519fa3c2e08d4f98b26b3fa548675bc77c`.
PWA exact-artifact acceptance, specification/static Storybook, package/release,
quality, unit and aggregate checks pass. Original local failed attempts remain
in the immutable [source receipt](2026-11-17-retired-ai-registry-fixture.md).

## Queued stacked icon attempt retained

Web icon [#166](https://github.com/lapismd/lapis-notes/pull/166) was initially
queued against `retirement/shared-ai-fixture-inputs`. After #165 merged and that
base was deleted, #166 was retargeted to main without changing its head
`82d40d17cadc33b2eef7c86a5a298d9530c38883`. The original event still names the
old base branch while checkout receives the current synthetic merge ref.
Governance job `134451771306` in run `44199598509` therefore fails at:

```text
pnpm spec:first --base "origin/retirement/shared-ai-fixture-inputs" --head "4dcb985f61aa31372a1cac997dbbc300c4109ff7"
SPEC-FIRST-VCS: bad revision origin/retirement/shared-ai-fixture-inputs
```

Specification validation, documentation checks and mdBook pass before that
failure. It is a retained failed required job, not a waived or passing gate.
The old event is not blindly retried. This receipt and the current progress
update create a fresh synchronize event against main, retaining all normal
requirements. An immutable-SHA workflow improvement is a separate follow-up;
no workflow condition, assertion, timeout, protection or policy is changed here.

`jj diff --from 73c1200d --to 545284a0 --stat` proves 0 changed files: the new
main merge tree is identical to the old source branch. Thus the base retarget
introduces no source delta. The fresh candidate still requires its own hosted
qualification; prior local source/package receipts remain supporting evidence.

Desktop's complete local cold catalog now passes 2168 cases in 16 viewport/theme
variants. E-RETIRE-002 owns its exact source/archive equivalence and preserves
fresh hosted artifact/native gates. This Notes receipt does not qualify Desktop
artifact repair, native preservation, publication or Website deployment.
