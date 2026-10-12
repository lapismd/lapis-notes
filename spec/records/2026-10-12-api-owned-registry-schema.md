# API-owned static registry schema

This record supersedes the Community schema prerequisite in the earlier static
registry host qualification and five-package approval packet. It does not
authorize publication or deployment.

The API owns `@lapis-notes/api/registry/schema`: the transport-neutral V2 catalog
model, verified-input V1 normalization, authored media fallback, and Changesets
release notes. The standalone export imports only Zod and local schema modules.
`@lapis-notes/api/build/vite` owns the reusable Turso transform; its declaration
has no Vite peer graph and its host-module catalogue entry has no renderer
platforms. API, Notes hosts, static registry, and Plugins no longer require
Community. The existing API 0.1.1 candidate includes these additions.

The concrete Community NIP-29 App Profile binding and its assertions remain in
`packages/app-profile/deferred/nostr`. Core API adapter/proof tests stay active.
Community application/plugin and relay work remain parked. No Community release
or acceptance of Community architecture-budget failures is now necessary.

Validation:

- Before migration, `node --input-type=module -e 'await import("@lapis-notes/api/registry/schema")'`
  failed once with a missing public module. The exact built-export import now
  passes, as do Node imports from both independently installed consumers.
- Focused registry/schema/build-helper/client fixtures: 20/20, including seven
  catalog/release-note cases and portable build-helper declarations. The added
  contract test rejects a Community runtime or peer dependency.
- `pnpm ci:packages`: 30/30; API tests 826/826. `pnpm check`: 18/18.
  `pnpm packages:check` and `pnpm spec:check` pass.
- Notes lock refresh uses pnpm registry metadata, retains portable resolutions,
  and removes Community. A normal frozen, offline install without a local hook
  passes. No registry integrity or unpublished package metadata was invented.
- Cold Notes Storybook: 212/212, plus static build. The initial cold run exposed
  14 startup-story failures after a late cipher optimization caused page reload.
  Adding the cipher under its actual API owner repairs the exact Ready case
  (1/1) and the complete cold suite (212/212, zero failures).
- Web E2E: 9/9. Fresh ad-hoc-signed desktop packaging succeeds with the already
  authorized temporary Deno validation override: minimum dependency age 0 and
  no lock writes. Normal compilation encountered the newly published AI
  Controller's dependency-age gate. Production Deno policy stays unchanged.
- The first packaged smoke timed out in app URL handoff. A fresh isolated cold
  retry and a second independent cold run pass; the original failure is retained
  in the local evidence logs.
  No acceptance assertion or timeout was relaxed.
- Final API pack SHA256:
  `b8414b73b717f0a50d4c55999096d8cdc678f9d27444b70ccf4f018d6b122a6c`.
  Its manifest has no Community dependency and its files include both public
  exports and omit all test modules.

Evidence lives under `.local/api-schema-migration/`. The unrelated inherited
`deno.lock` is preserved, including its prior contents; native validation does
not rewrite it. No visual baseline was updated.

Four framework prerequisites remain: API, UI, Workspace, and File Explorer
0.1.1. API publication and authenticated approval are still pending. Plugins and
registry use checksum-pinned temporary API packs for local acceptance until
portable npm lockfiles can be refreshed after publication. Their existing locks
are intentionally not replaced by tarball resolutions. Plugin release assets,
production source binding/signing, and the signed V2 cutover remain separate
release work.
