# Native retained bootstrap construction

R4.3.3 ports existing Desktop bootstrap construction and ancestor AGENTS.md
reading through the accepted native Work. It remains the original R4.3 scope;
no new agent, provider, scheduler, host selection or file writer is introduced.

## Complete source reference

`scripts/reference/native-ai-bootstrap.mjs` verifies six complete unchanged
Desktop files at `6c6243202e05b04e57de0a737829ca3a48e3ed3e`, then calls
`buildSessionBootstrap` directly. Complete output/error objects and exact reader
traces retain static instructions, labels, tools/skills, ancestor ordering,
CRLF/ECMAScript whitespace, path-bearing omission and independent folder budgets.

The retained UTF-16 slice can bisect a surrogate pair. Those fixtures keep the
entire serialized original result in a valid outer JSON string; native tests
prove serde_json refuses that existing native String boundary. Bootstrap
preparation must refuse the same undeliverable context, never replace invalid
code units or silently change the source's retained instructions. All other
cases compare complete JSON results and exact explicit errors.

```sh
node scripts/reference/native-ai-bootstrap.mjs
pnpm exec prettier --write crates/lapis-app-core/tests/fixtures/ai-context/bootstrap.json
pnpm rust:core -- test -p lapis-app-core --test native_bootstrap --locked
```

The contracts initially reported Unsupported. Source `da8564d0`, receipt
`b39334b4-9ec9-48ad-85e1-839186033887`, exits1 without OOM at07:35:14UTC:
**zero passed, three failed** at the explicit missing-service boundary.
An earlier controller preflight rejected an accidentally altered private volume
name before creating any worker; the ignored runner was corrected and the same
immutable source packet then produced this real baseline.

Source `8f97c357`, receipt `5e492bed-22a0-453e-ad9f-d5b7907e6217`, exits0
without OOM at07:40:58UTC: **three passed, zero failed**, including all41
complete outcomes/read traces and two explicit native Unicode refusals.

Nine additional native boundary cases cover cancellation before/during/after
reading, close/drain, unsafe scope, missing/non-regular/invalidUTF8/denied input,
path screening before truncation, total read budget, physical-root replacement
and symlinks. The final service delivery guard checks open phase and physical
identity under one lock; caller cancellation is never invoked under that lock.
These and the original exact cases must pass before full qualification.

The first boundary run at`cb05eb3f`, receipt
`40d2dee0-b5df-40bf-be27-ba7bb81b1052`, retained the original3/3 and found
8/9 boundary passes. The suffix fixture accidentally concatenated`x/Users`
without the whitespace/path-token boundary required by the unchanged source
expression. It was corrected to`x /Users` beyond the truncation limit; the
expected full-file omission and exact25,000-unit/read-stop assertions remain.

## Native authority and remaining gates

Native reading uses the admitted Work and existing checked file engine, with its
regular-file, UTF-8 and64MiB native read bound. It reads actual dispatch-time
ancestor bytes after client detach; close/cancel, symlink, replaced root, missing
files and native Unicode boundaries remain distinct. No callback or root enters
wire data. Reference preparation never writes saved files or launches a helper.

Source qualification must widen through old context/initial/attachment helpers,
native lifetime/turn cases, full native/package/strict/build/canonical gates and
truthful generated progress. Native skill discovery/versioned bindings,
commands/handoff, rich admission and actual-host/provider acceptance remain in
R4.3; R5 memory and R7 default cutover retain their existing gates.

## Final source qualification

Product snapshot`53cf4bd925c54a0bd54af4a3d85d130d93cc8bc5`, receipt
`6cacbda2-9e80-4b41-99ab-f1ee48fcf6d5`, exits0 without OOM at
2026-10-27T08:00:18UTC. Original exact3, all9 new boundaries,14 prior
context/attachment/initial and29 service-lifetime/turn cases pass. Complete
workspace qualification passes623Rust/zero failures/seven existing explicit
ignores,2438package cases (API1716),check20/test20/build11 and78canonical
regressions. Formatting, protocol equality, native dependency boundaries and
spec-first11protected/3chapters pass with all6 native sources/16public inputs.

The frozen Deno compatibility lane normalizes only the worker's lock:202old npm
entries removed,zero added npm or changed integrity. The extracted lock/audit
are retained in the receipt. No source Deno file, manifest, published version,
ordinary default, app binary, profile or vault is changed. All other tracked
worker bytes remain identical.

Only documentary completion/status evidence changes after this product snapshot;
final canonical/progress/format qualification and exact product equality precede
the source commit. Main intake and both-host/provider integration remain separate.

Final documentary snapshot`a6e6ae97229d953608d9ff3bf200445ce30db723`, receipt
`0bcd7cef-78f3-4fa3-878d-1a8fda92baae`, exits0 without OOM at
2026-10-27T08:03:14UTC. All public dependency builds, complete canonical78,
108-row grouped/sorted/spec-linked progress and changed-file formatting pass;
zero tracked worker mutations. Only four tracking/verification files differ
from product53cf4bd9, so every qualified native/product/fixture byte is exact.
Only this supporting receipt and the tracker time are appended afterward;
focused formatting and generated-progress checks pass before the source commit.
