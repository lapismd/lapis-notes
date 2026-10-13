# Plugin Model / Distribution and registry / Part 2

## LN-PLUG-095 — Local signed-registry configuration

<a id="ln-plug-095"></a>

**Requirement.** App Profile MAY support explicit local signed-registry configuration only in development or `registry-acceptance` mode. It MUST require a loopback catalog, public signing keys, and an exact HTTPS artifact origin. It MUST preserve signature, hash, compatibility, and loader checks, honor explicit host options, and ignore fixture trust in production/server builds.

LN-PKG-161 runs the complete Web suite with the exact signed fixture, including
server-managed vault acceptance. The server image remains a normal server-mode
build; its private bootstrap credential fixture does not extend registry trust.

## LN-PLUG-070 — Approximate monthly plugin downloads

<a id="ln-plug-070"></a>

**Requirement.** Registry Browse, Installed, Updates, detail results, and detail summary MUST show available approximate 30-day plugin downloads. Details MUST also show lifetime downloads, the tracking start date, and that counts are approximate redirect requests. Missing statistics MUST omit these fields without placeholders.

## LN-PLUG-071 — Browse: offer Most downloaded sorting through the existing

<a id="ln-plug-071"></a>

**Requirement.** Browse MUST offer `Most downloaded` sorting through the existing Design Core sort picker. It MUST order by descending approximate 30-day requests, treat missing counts as zero, and resolve ties by plugin name while retaining Name and Recently updated sorting.

## LN-PLUG-072 — Plugin with distribution: "first-party-external": own its Storybook catalog under Plugins/&lt;Plugin&gt;

<a id="ln-plug-072"></a>

**Requirement.** A plugin with `distribution: "first-party-external"` MUST own its Storybook catalog under `Plugins/<Plugin>` and MUST follow LN-CAT-109 and LN-CAT-110. Tasks Column Canvas and Design Core AppShell stories remain Tasks-specific exceptions and MUST NOT be copied as the general panel pattern.

## LN-CV-010 — Independent Roles plugin ownership

<a id="ln-cv-010"></a>

**Requirement.** Runtime plugin `roles` MUST remain an independently versioned `first-party-external` package that desktop and web can install through the verified registry contract. It MUST NOT enter the default static profile. Package changes MUST preserve its runtime view, command, file, and plugin-data identities.
