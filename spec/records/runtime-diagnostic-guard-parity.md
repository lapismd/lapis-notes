# Svelte runtime diagnostic guard parity

PR 4's first post-Deno CI run reported 14 failed Storybook tests, 70 passes and
23 fatal runtime errors. Notes already rejected the literal `derived_inert`
warning. The warning stack points to Bits UI 2.18.1's document pointerdown listener
reading the destroyed text-selection layer ref; direct Notes runtimes now use
published Bits UI 2.19.5's upstream snapshot/listener cleanup. The exact user-approved 2.19.5 Link Preview patch is reused to preserve the existing deferred-selection and listener cleanup; no patch scope is extended.

Notes and Plugins had literal-only classifiers, unlike Design Core's broader
runtime gate. Both now recognize Svelte prefixes, formatted messages, diagnostic
URLs and Error objects, preserve original logging, and retain diagnostics even
when teardown catches the immediate exception. After-story and final cleanup
checks fail retained diagnostics; guard disposal preserves a newer console owner.
The focused regression in each repository changes from 2 passes/6 failures to
8 passes/0 failures. Community source and runtime remain parked.

The separate CI editor-demo failures include an invalidated accessibility import.
The exact cold responsive Plugins reproduction also failed all three selected
stories after Vite discovered the verified-image fallback's image-off icon and
reloaded the dependency graph. The icon now belongs to the explicit prebundle
inventory. This failure is recorded separately from lifecycle diagnostics.

Final aggregate functional, Storybook and artifact verification remains delegated
to GitHub CI. Focused cold acceptance and its final results are recorded below.

- Exact cold responsive directory/details/updates target: 3 failures before the
  prebundle repair, then 3 passes and no runtime errors after the provider and
  optimizer refresh.
- Complete affected Plugins, registry-snapshot and Settings families: 54/54
  passing in a fresh Vitest browser process with the broader guard and the retained approved 2.19.5 patch enabled.
- The exact CI editor-demo family passes 14/14 and Backlinks passes 7/7 in a fresh browser process after the dependency repair, with zero fatal runtime diagnostics.
- Final `pnpm spec:check`, public package-boundary and release configuration/workflow checks pass. The portable frozen pnpm install passes with local hooks disabled; the 2.19.5 patch bytes match the approved Plugins patch.
- Normal spec-validation Node lane: 19/19 before wiring the guard regression,
  27/27 afterward. The regression is now part of normal specification and CI
  unit execution, rather than only an explicitly invoked local test.
- The direct runtime dependency refresh retains the existing legacy 2.18.1
  patch for remaining transitive users; the direct 2.19.5 mapping reuses the previously approved Link Preview patch and adds no override.
