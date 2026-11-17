# Plugin Model / Distribution and registry / Part 2

LN-CAT-124/125 use the post-retirement signed fixture without shared AI.
Graph supplies category/detail navigation; verified Word Count installation,
Settings and reload assertions remain. This changes neither third-party AI
admission nor production registry trust under LN-PLUG-095.

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

## LN-PLUG-132 — Bulk plugin actions: use a selectable Command View

<a id="ln-plug-132"></a>

**Requirement.** Plugin registry Settings MUST offer `Update all` for eligible updates, and the Plugins homepage MUST offer `Install all` for eligible catalog entries. Each action MUST open a searchable Design Core Command View with explicit multi-selection before invoking the existing App-owned per-plugin action flow. Every selectable row MUST render the same verified image or fallback app icon used by the registry card. Bundled, installed, incompatible, revoked, busy, and unavailable entries MUST NOT become eligible.

## LN-PLUG-133 — Bulk plugin picker: preserve compact controls

<a id="ln-plug-133"></a>

**Requirement.** Bulk plugin Command Views MUST retain the standard compact search icon while allowing larger registry app artwork in result rows. Selection marks MUST omit an idle outline and use only the selected fill and check to communicate selection.

## LN-PLUG-134 — Plugins browser: expose installed discovery and management

<a id="ln-plug-134"></a>

**Requirement.** The Plugins homepage MUST present Installed and Updates as bounded preview columns matching Featured and New, and each title MUST open its filtered directory. Installed previews MUST omit the redundant Installed badge. The directory MUST expose removable Installed, Updates, and Available filters, with Updates directly below Installed and distinct state icons. Cards MUST distinguish available, installed, bundled, and update-ready entries and expose the applicable Install, Update, or confirmed Uninstall action without changing App-owned policy.

## LN-PLUG-135 — Plugin cards: align compact management actions

<a id="ln-plug-135"></a>

**Requirement.** Card Install, Update, and Uninstall controls MUST be tooltip-backed, colored, circular icon-only buttons aligned at the far edge of the plugin title row. Uninstall MUST use destructive red treatment with a matching hover and focus state. Landing preview controls MUST use the smaller compact action size while full directory cards retain the standard action size.

## LN-PLUG-136 — Plugin directory cards: group installed state with metadata chips

<a id="ln-plug-136"></a>

**Requirement.** Full directory cards MUST render installation state in the bottom chip row with status and category metadata, never in the title action cluster. Installed MUST use an accent chip, while update-ready plugins MUST use a contrasting warning chip labelled with the installed and target versions.
