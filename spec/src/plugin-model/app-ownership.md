# Plugin Model / App ownership

## LN-PLUG-020 — F-Mode: register on the API-owned Design Core controller

<a id="ln-plug-020"></a>

**Requirement.** F-Mode MUST register on the API-owned Design Core controller, default disabled, and remain user-enableable. It MUST NOT enter `registerCorePlugins` or `.obsidian/core-plugins.json`. AppShell enablement persistence MUST resolve the App vault when load and save run.

## LN-PLUG-033 — Plugin that exposes multiple views over one: own single-flight construction above the view lifetime

<a id="ln-plug-033"></a>

**Requirement.** A plugin that exposes multiple views over one generated global projection MUST own single-flight construction above the view lifetime. View closure MUST release subscriptions without discarding a valid plugin-owned snapshot, while plugin unload MUST cancel in-flight work and flush pending plugin data.

## LN-PLUG-034 — Canvas plugin views: retain package-owned simulation, camera, culling, pointer-intent timers

<a id="ln-plug-034"></a>

**Requirement.** Canvas plugin views MAY retain package-owned simulation, camera, culling, pointer-intent timers, and emphasis state when presentation-only. Configured activation and release delays MUST separate immediate labels from emphasis, while paint remains elapsed-time normalized and respects reduced motion. Such state MUST preserve keyboard and pointer navigation and MUST NOT become domain-data or workspace authority.

## LN-PLUG-074 — Web hosts that load verified ESM plugins: publish the declared public @lapis-notes/api shared dependency

<a id="ln-plug-074"></a>

**Requirement.** Web hosts that load verified ESM plugins MUST publish the declared public `@lapis-notes/api` shared dependency through an initial browser import map backed by a build-owned module entry. That entry MUST reuse the host module graph and MUST NOT expose App instances through compatibility globals.

## LN-PLUG-103 — Restored Plugins leaf: restore its validated route and directory state

<a id="ln-plug-103"></a>

**Requirement.** A restored Plugins leaf MUST restore its validated route and directory state. Closing a view or disposing its owning registration MUST unload owned view components, release subscriptions and ignore late detail responses; background refresh MUST preserve visible content and navigation.
