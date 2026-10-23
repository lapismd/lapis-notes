# Desktop Mira dependency compatibility

The API manifest admits Mira `~0.1.0` alongside `~0.0.5` in runtime and peer
ranges. Both remain portable npm ranges; no package source or application
behavior changes. This closes the first-party cohort compatibility refusal for
Lapis Desktop shared-screen intake.

The clean default checkout has byte-identical API source to this isolated
workspace. Its focused source checks report 0 Svelte errors/warnings, API build
passes and 131 test files / 1186 tests pass. Isolated archive acceptance against
Mira 0.1 and full consumer qualification are recorded by Lapis Desktop.

No publication, native application replacement or visual-baseline change occurs.

Isolated package `check` and `build` pass. The first isolated suite had 1185
passes and one five-second declaration-test timeout under concurrent builds;
the exact test then passes unchanged, followed by all 1186 tests with two
workers. No timeout or assertion changed. Spec-first passes.
