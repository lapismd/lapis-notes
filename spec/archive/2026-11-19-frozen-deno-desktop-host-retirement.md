# Frozen Deno desktop host retirement

The frozen Notes Deno desktop host was removed from current source authority on
2026-11-19. The removal was prepared from Notes main
`aca52edd7497e6ba7bd39c91507b9e8f87f5170f` after the replacement Tauri Desktop
preservation slice landed and was qualified independently.

The retired implementation comprised `packages/desktop-deno/**`,
`scripts/desktop-release.mjs`, and `scripts/desktop-release.test.mjs`. Its
current specification comprised `spec/src/desktop-deno-host.md`, the seven
chapters under `spec/src/desktop-deno-host/`, requirements `LN-DENO-001`
through `LN-DENO-094`, `spec/src/verification/deno.md`, and the eight matching
Storybook specification mirrors. Repository history preserves their exact
bytes, and existing release records preserve immutable packaged-host evidence.

The removal also retires the former cross-cutting identity requirement and its
verification row from current architecture authority:

> **LN-ARCH-081.** Desktop product identity has two host-owned layers: the
> renderer boot document owns branded startup content, while the native bundle
> owns the macOS application and menu name. Development may derive an ignored
> host bundle through Deno's supported local-host boundary and reuse an
> unchanged runtime only after deep strict signature verification, but must not
> mutate shared runtime caches or move identity policy into plugins.

Its historical verification used boot-document tests, desktop launcher tests
and live macOS acceptance to keep native bundle and menu identity host-owned
without changing Deno's shared Laufey cache. Those tests and the implementation
they verified were removed together.

This retirement does not remove `packages/deno-host-services/**`, Language
Service, Sync, core API functions, native compatibility contracts, user data,
or historical artifacts. Those retained surfaces keep their own current
requirements and ownership boundaries.
