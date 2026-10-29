# Inline title alignment and rename projection

The API editor measures its actual CodeMirror content inset through
`requestMeasure`, ResizeObserver, DOM reconfiguration and font notifications.
Each mounted editor owns its observer lifecycle. Desktop title padding stays
inside the readable column; mobile titles remain centered. Long filenames can
wrap in constrained panes.

Native contenteditable edits may replace Svelte's original text node. The
title action projects each committed filename onto the current element.
Enter moves focus and uses the single focus-out rename path, avoiding duplicate
filesystem moves. Existing view rebinding remains owned by VaultChangeService;
the shared Plugins story host must start and stop that service.

Targeted source evidence:

- `pnpm exec vitest run src/lib/components/editor/inline-title-alignment.test.ts`: **6 passed / 0 failed**, covering measured gutter spacing, changing width, independent editors, content padding, hidden panes and teardown.
- The same target plus `src/lib/__tests__/editor-rename-persistence.test.ts`: **12 passed / 0 failed**.
- `pnpm exec vitest run src/lib/__tests__/vault-changes.test.ts -t 'internal|orders view rebinding'`: **3 passed / 0 failed**, **14 unselected**.
- Targeted TypeScript checking of the measurement helper and the changed-path spec-first gate pass. `svelte-package --tsconfig ./tsconfig.pack.json` produces the public API output.

The original Plugins title regression failed with an **80.65625px** offset.
Consumer evidence is kept in the Plugins editor-chrome record, separately from
this source qualification. Full repository suites and wider consumer gates
are deferred by explicit user request. Publication and baseline approval are
outside this slice.

The source was developed in the `markdown-title-alignment` Jujutsu workspace
because another task switched the default Notes checkout during implementation.
The user subsequently requested landing into the main workspaces. The change
is rebased onto the default Notes head while retaining its gate-5 and R7.8
tracker entries; editor source remains identical to the qualified candidate.
Mira and Plugins already contain their fixes in their default workspaces.
The API archive hook consumes the qualified packed output; its previous archive
is preserved under Plugins `.local/editor-surface/`. The separate inherited
dark YAML contrast finding remains deferred by explicit user choice.
