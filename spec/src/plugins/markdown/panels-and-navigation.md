# Markdown Plugin / Panels and navigation

## LN-MD-014 — When enabled, the Markdown plugin: register Lapis property type widgets (unknown, text

<a id="ln-md-014"></a>

**Requirement.** When enabled, the Markdown plugin MUST register Lapis property type widgets (`unknown`, `text`, `number`, `checkbox`, `tags`, `aliases`, `multitext`, `date`, `datetime`, `array`, and `object`) through `Plugin.registerTypeWidget`.

## LN-MD-103 — ExtractMetadata: index wiki links and standard Markdown links

<a id="ln-md-103"></a>

**Requirement.** `extractMetadata` MUST index wiki links and standard Markdown links with the nearest preceding heading.
