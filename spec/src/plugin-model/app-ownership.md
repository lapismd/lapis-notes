# Plugin Model / App ownership

The Design Core dependency refresh consumes released `0.4.0` CSS, fonts and
components through public exports. Existing application ownership, host
behavior and plugin activation remain unchanged.

## LN-PLUG-020 — F-Mode: register on the API-owned Design Core controller

<a id="ln-plug-020"></a>

**Requirement.** F-Mode MUST register on the API-owned Design Core controller, default disabled, and remain user-enableable. It MUST NOT enter `registerCorePlugins` or `.lapis/core-plugins.json`. AppShell enablement persistence MUST resolve the App vault when load and save run.

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

**Requirement.** A restored Plugins leaf MUST restore its validated route, optional selected release version and directory state. Closing a view or disposing its owning registration MUST unload owned view components, release subscriptions and ignore late detail responses; background refresh MUST preserve visible content and navigation.

## LN-PLUG-106 — App links: navigate to a plugin through the owning App

<a id="ln-plug-106"></a>

**Requirement.** The default application profile MUST register a disposable `plugins` App URL action accepting a validated plugin ID and optional release version. It MUST reveal the owning Plugins view and preserve the requested coordinates. The action MUST NOT install a plugin, accept an archive URL or change registry trust. Disposal MUST cancel queued navigation and unregister the handler.

## LN-PLUG-109 — App links: reveal Plugins above Settings

<a id="ln-plug-109"></a>

**Requirement.** Successful `plugins` App URL navigation MUST dismiss the owning App's Settings dialog so the selected plugin page is reachable. Rejected or disposed navigation MUST NOT close Settings after its owning registration is removed.
