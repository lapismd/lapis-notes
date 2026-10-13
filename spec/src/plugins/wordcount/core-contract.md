# Word Count Plugin / Integration contracts

## LN-WC-001 — Sibling lapis-plugins repository: ship @lapis-notes/wordcount at packages/wordcount with runtime id

<a id="ln-wc-001"></a>

**Requirement.** The sibling `lapis-plugins` repository MUST ship `@lapis-notes/wordcount` at `packages/wordcount` with runtime id `wordcount` for static composition or registry installation.

## LN-WC-002 — Word Count: report words and characters for the active

<a id="ln-wc-002"></a>

**Requirement.** Word Count MUST report words and characters for the active `TextFileView`. A non-empty selection MUST replace the document count. Other leaves MUST hide the status item.

## LN-WC-003 — Word Count: update app.statusBar with optional segments

<a id="ln-wc-003"></a>

**Requirement.** Word Count MUST update `app.statusBar` with optional segments and a reading-time command. Clicking the status item MUST show reading time. It MUST NOT use compatibility status DOM.

## LN-WC-004 — Deno desktop, web, editor-demo, and audited Storybook: register Word Count as enabledByDefault: true

<a id="ln-wc-004"></a>

**Requirement.** Deno desktop, web, editor-demo, and audited Storybook hosts MUST register Word Count as `enabledByDefault: true` and load it before metadata and layout restoration.
