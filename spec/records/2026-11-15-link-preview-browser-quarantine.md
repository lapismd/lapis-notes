# Targeted LinkPreviewAcceptance browser quarantine

The user explicitly requests documenting and disabling the intermittent test
on 2026-11-15. Notes validation tooling owns this quarantine and restoration.

## Observed failure and scope

The complete registry-based run before main integration loses its browser
connection before LinkPreviewAcceptance executes: 287 pass, two unexecuted,
one unhandled transport error. Its exact family then passes two cases, its
original fourth shard passes 64, and a new full aggregate passes 289 unchanged.

After integration with main ccca08e9, all 27 package lanes and 2,177 unit cases
pass. The complete browser aggregate passes 288 cases (105 + 73 + 48 + 62),
then again loses the orchestrator before the final two cases execute. Receipt:
`.local/validation/runs/lapis-notes-validation-60eeef61-413d-40a2-bbc8-45a0e9e6f00b`.
The unchanged original fourth shard subsequently passes all 64. Receipt:
`.local/validation/runs/lapis-notes-validation-f6781ce0-beda-4b13-86ce-cf96a2b0c9d3`.
These are intermittent non-reproductions; no source repair is claimed.

Vitest reports `Browser connection was closed while running tests` and
`[birpc] rpc is closed, cannot call "createTesters"`. This is not an assertion
failure. Only the two generated Vitest cases in
`stories/plugins/markdown/panels/LinkPreviewAcceptance.stories.ts` are excluded:
OutgoingLinks and Backlinks. Their stories remain in the built catalog and
available to the pointer acceptance harness. Other Backlinks/Outgoing Links
placement, editing, persistence and accessibility stories remain enabled.
Default Vitest exclusions remain intact. No timeout or assertion is weakened.
Omitted coverage is two cases and must not be reported as passing.

## Diagnostics and restoration

After building the public packages, explicitly opt in to the quarantined cases:

```sh
LAPIS_NOTES_RUN_QUARANTINED_LINK_PREVIEW=1 pnpm exec vitest run --project storybook stories/plugins/markdown/panels/LinkPreviewAcceptance.stories.ts
```

Diagnostics retain fatal errors. Restore the two default cases after identifying
and fixing the transport cause and qualifying the exact family plus three
consecutive complete cold Linux runs without retries, following LN-CAT-121.
This quarantine is separate from the accepted Storybook Docs Forward-history
limitation and the exact deepmerge advisory exception.

## Verification

Default file discovery contains 63 files; explicit opt-in contains 64. Set
comparison proves that the only difference is LinkPreviewAcceptance. The
configured default Vitest exclusions are retained. Specification validation
and its 67 governance cases pass after the documentation update. Complete
root check, test and build pass after the config change. The full four-shard
catalog rerun passes all 288 enabled cases (105 + 73 + 48 + 62), zero
assertion failures and zero unhandled errors. Exactly two cases are omitted.
Receipt: `.local/validation/runs/lapis-notes-validation-c20823a2-f0bc-46c5-9ce6-7020ccad9fcd`.
Both excluded story IDs remain present in the actual built catalog index.

An ignored native diagnostic provider helper is not product qualification: its
first attempt imports a helper from the wrong package and cannot start; after
correcting that harness import, it encounters dynamic-import failures rather
than reproducing the original transport error. Neither attempt changes product
code or the quarantine scope. Logs remain in ignored
`.local/profile-browser-provider-diagnostic-20261115.log` and
`.local/profile-browser-provider-diagnostic-retry-20261115.log`.
