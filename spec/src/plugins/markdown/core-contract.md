# Markdown Plugin / Integration contracts

## LN-MD-015 — Storybook and demo hosts that load Markdown: call metadataTypeManager.trackChanges() or an equivalent watchMetadata helper

<a id="ln-md-015"></a>

**Requirement.** Storybook and demo hosts that load Markdown MUST call `metadataTypeManager.trackChanges()` or an equivalent `watchMetadata` helper after plugins load and dispose the watcher on teardown.

## LN-MD-093 — Markdown: register notes_list through the application tool registry

<a id="ln-md-093"></a>

**Requirement.** Markdown MUST register `notes_list` through the application tool registry. It MUST accept only normalized Markdown paths inside the trusted conversation scope, reject application-private directories, and return deterministically ordered bounded results.

## LN-MD-102 — Nested YAML metadata extraction

<a id="ln-md-102"></a>

**Requirement.** `extractMetadata` MUST parse nested YAML maps and arrays in front matter, including `task:` objects.

## LN-MD-099 — Published parse-metadata: import the metadata worker as ./metadata-worker?worker&amp;inline without

<a id="ln-md-099"></a>

**Requirement.** Published `parse-metadata` MUST import the metadata worker as `./metadata-worker?worker&inline` without a `.ts` suffix so Vite hosts resolve the packaged `metadata-worker.js`.
