# Word Count Plugin

`@lapis-notes/wordcount` owns the status-bar word and character count for the
active text editor. Presentation stays on the API status-bar contract and the
Design Core status item. It does not contribute a default sidebar leaf; an
empty vault still seeds File Explorer, Search, Outline, File Properties, and
Tags.
Desktop and web startup report the Word Count name on the plugins task while
that plugin enables, then restore layout before starting metadata cache load.
Those host manifests MAY declare sibling `@lapismd/ai-host` without moving Word
Count ownership. The same hosts register Spell Check after Markdown Lint; that
does not change Word Count registration or status-bar ownership. Merged
language-service diagnostics (LN-WS-076) also MUST NOT change Word Count
ownership. Workspace-wide provider and plugin startup Problems (LN-WS-077,
LN-WS-078) also MUST NOT change Word Count ownership. Web Harper WASM
`application/wasm` responses (LN-WEB-030) and Harper Problems rows
(LN-SPL-009) also MUST NOT change Word Count ownership. Markdownlint and
Spell Check Problems action titles (LN-MDL-005, LN-SPL-010) also MUST NOT
change Word Count ownership. Web
agent-server URL and token Settings stay on the web host and MUST NOT change
Word Count registration or status-bar ownership. The token
field uses password presentation on that host Settings surface. Desktop
terminal vault cwd binding (LN-DESK-059) and web `--workspace` Settings copy
(LN-WEB-037) also MUST NOT change Word Count ownership. Web vault copy
progress (LN-WEB-042, LN-WEB-043) and App rebuild-cache commands
(LN-PKG-097, LN-PKG-098) also MUST NOT change Word Count ownership.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-WC-001 | The repo MUST ship `@lapis-notes/wordcount` at `packages/plugins/plugin-wordcount` with runtime id `wordcount` and `enabledByDefault: true`. |
| LN-WC-002 | Word Count MUST report words and characters for the active `TextFileView`. A non-empty selection MUST replace the document count. Other leaves MUST hide the status item. |
| LN-WC-003 | Word Count MUST update `app.statusBar` with optional segments and a reading-time command. Clicking the status item MUST show reading time. It MUST NOT use compatibility status DOM. |
| LN-WC-004 | Electron, web, editor-demo, and audited Storybook hosts MUST register Word Count as `enabledByDefault: true` and load it before metadata and layout restoration. |
