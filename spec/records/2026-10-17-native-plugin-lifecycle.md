# Packaged qualification of the signed plugin lifecycle

This closes the consumer qualification for LN-PLUG-116–121. Production SDK
implementation remains commit `2b7ee095babd04f72639be7b6140c0cb64eb1512`.
The preceding [source foundation record](2026-10-17-safe-plugin-replacement.md)
retains its original pending consumer status as historical evidence.

## Consumer evidence

Desktop commit `09a5a76f59c1fc2276e34de56dc156a0bebb2f18` records the original
M9/M9.1 gates as complete in `spec/src/history/E-INSTALL-001.md`. It consumes
five source-owned public pnpm archives from the SDK revision above; all 14
public import routes verify. Manifests and lockfiles retain registry ranges.
No package was published and no dependency source was patched in the consumer.

- Actual signed native installation shares API/Svelte identities. A loaded
  replacement retires commands and intervals, preserves exact data and enabled
  preferences, and remains inactive until cold restoration loads version 2.
- A failed module remains installed and recoverable across restart; an explicit
  signed update and enable remove its failure and clear the restart marker.
- Uninstall removes runtime inventory, commands and diagnostics while preserving
  data by default. Explicit data removal and real Word Count cleanup also pass.
- Unsupported runtimes/capabilities/native services reject before activation.
  A disabled supported service reports its distinct reason, never starts
  automatically, and activates only after availability plus explicit enable.
- Invalid signatures, altered file hashes, incompatible releases and bundled
  identity collisions leave installed bytes and static owners unchanged.
- The real retained Plugins screen installs the verified public Word Count
  artifact, and existing Settings controls disable/re-enable it. Cold persistence
  and uninstall remove its status contribution without replacing any screen.

## Complete qualification

- Source: 149 focused API cases; 18 check tasks; 1,734 unique source tests;
  10 builds; 259 cold catalog/axe cases; 172 static chapters; six documentation
  navigation/axe cases; 13 cold Web/server cases; complete specification gates.
- Desktop: 85 JS/governance plus 77 Rust cases; 84 catalog/axe cases across both
  themes and viewports; static catalog; strict types, clippy and governance.
- Cold packaged desktop: all 113 cases pass (2 startup, 27 WDIO, 82 lifecycle,
  2 development-origin representation). Native children have no Node/Deno PATH.
- Ordinary ARM64 app: 356 renderer JS files, no test trust or automation markers,
  and no bundled Node/Deno runtime. App signing and publication remain deferred.

The source and consumer records retain original failures and fixture corrections;
no assertion, native deadline or completion gate was weakened. The Web server's
Docker disk exhaustion was independently diagnosed and resolved by removing two
unused migration-owned cache records. Docker is stopped at its original 3072 MiB.

This change promotes verification and intake status only; it changes no product
code or package archive. Deno desktop and legacy Electron remain frozen. M10
native ACP/AI and optional compute continue in their owning repositories.
