# Park Community in the default application profile

Community is parked for this release. The primary Notes checkout now uses the
same four defaults as the static-registry candidate: Source Editor, Markdown,
File Explorer, and Search. The shared profile excludes the Community
constructor, lifecycle stylesheet, and `@lapis-notes/community` dependency.
Web and desktop both consume this profile. Generic configured-plugin loading,
safe-mode controls, and the shared registry schema remain available.

The change is isolated in a Jujutsu child of the existing dependency-adoption
change. That parent and all unrelated edits remain intact. Committed manifests
retain npm semver ranges, and the lockfile already excluded the Community plugin
from this importer; it needs no change for the removal.

## Verification

- Exact regression: `pnpm --filter @lapis-notes/app-profile exec vitest run
src/index.test.ts`; 1 failure before removal, 1 pass afterward.
- Complete App Profile units: 3 passes.
- Desktop registration and renderer configuration: 8 passes.
- Web registration and renderer configuration: 9 passes.
- Cold Web target: `CI=true pnpm exec playwright test -c playwright.config.ts
-g 'Manage Vaults overlays'`; 1 pass, including an exact runtime inventory of
  the four enabled defaults in a fresh browser vault.
- Root check: 18 tasks pass. Root unit tests: 18 tasks pass. Root build:
  10 tasks pass. Specification validation, mdBook, spec-first, ownership and
  metadata-query audits pass. Changed prose and source pass formatting, except
  the pre-existing verification-table formatting issue remains untouched.
- Neither rebuilt Web nor desktop JavaScript contains `CommunityPlugin`,
  `communityStyles`, or `@lapis-notes/community`.
- Full primary Storybook interaction/accessibility qualification: 211 passes
  across four fresh shards (62, 58, 40, 51), with zero fatal runtime errors.
  The signed-registry candidate separately retains its prior 212-story pass.
- After refreshing the ignored registry-library install, the complete API suite
  passes all 799 tests and App Profile passes all 3 tests again.

Initial simultaneous check/test execution raced on generated declarations; the
lanes were repeated sequentially. The first full Storybook attempt stalled after
an optimizer reload. Four already-qualified dependency entries now prebundle
accessibility, the shared registry schema, and API Nostr leaves. A fresh AI
Local Conversations target passes, followed by the complete four-shard lane.
The primary checkout also used an older
ignored shared-registry tarball with incompatible Vite type contexts. An ignored,
checksum-guarded pnpm hook reuses the already-built registry candidate for
validation. This refresh changes neither Community source nor tracked dependency
configuration. Its checksum and install log are retained under
`.local/community-parking-verification/`. Registry-only release acceptance still
requires publication of the shared library and framework prerequisites.

No Community feature repair, production publication, deployment, visual-baseline
update, user-vault deletion, or `deno.lock` change belongs to this slice.
