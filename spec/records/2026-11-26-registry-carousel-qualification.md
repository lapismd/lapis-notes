# Registry carousel acceptance setup

The full background-network Notes qualification passed specification, check,
unit tests and build before Storybook shard four reported one failure in
`StaticRegistryV2MediaAndReleaseNotes`: track scroll remained zero after clicking
Next. The other 246 stories passed. The unchanged Plugin Management family
then passed all 26 cases in a cold focused Omarchy run
`lapis-notes-validation-3696db6c-de6e-461f-8f2b-75e70adeee31`, source
`112e959e530520d38593fb14700eace775a70ab4`. This retains the full-run failure
instead of treating the focused pass as a replacement.

The story's lazy-image setup issued several smooth scrolls, then relied on a
possibly stale disabled Previous button as its starting-position observation.
Setup now uses instant scrolls and directly asserts that the track has returned
to its start before clicking the real Next control. The original Next movement,
image geometry, viewer keyboard, theme and focus assertions remain intact.
No production carousel behavior, baseline, shared test helper or timeout changed.

The corrected cold focused family passed all 26 cases, with zero failures, on
source `fce3af82d993e10ab345128e5d6ce2dc40b0da62` in run
`lapis-notes-validation-9dfd22d3-ba25-4bc1-9b13-9bf02bf95bed`. The original shard also passed
53 cases on the unchanged setup, confirming the failure was intermittent.
The complete four-shard Storybook retry, static build and consumer-pack lane
passed on source `cec5e417b5992686883e629a5ebb93dc6740c967` in run
`lapis-notes-validation-4f804395-ad25-4e4a-8388-9e2273d0493a`. A preceding
retry passed the first three shards but lost its browser connection during
shard four while remote scratch space was exhausted. Its failure remains
retained; completed task-owned scratch was preserved and reclaimed before
the successful retry. All executable
qualification uses Docker context `omarchy`.
