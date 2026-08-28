# Spell Check Plugin

Canonical daily notes use the same Markdown spellcheck pipeline as other
notes. Spellcheck does not participate in daily-document resolution or Tasks
occurrence state.

`@lapis-notes/spellcheck` adapts Harper grammar and spelling diagnostics for
open documents into the shared language-service and Problems path. It uses
`harper.js` in the renderer. `harper-ls` remains out of scope.
Desktop terminal vault cwd binding (LN-DENO-028) and web `--workspace`
Settings copy (LN-WEB-037) MUST NOT change Spell Check ownership.
Web vault copy progress (LN-WEB-042, LN-WEB-043) and App rebuild-cache
commands (LN-PKG-097, LN-PKG-098) also MUST NOT change Spell Check ownership.
Desktop and web Tasks index-only load (LN-DENO-006, LN-WEB-044) also MUST
NOT change Spell Check ownership.
Browser vault transfer error reporting through session-owned notifications also
MUST NOT change Spell Check ownership.
Deno WASM database revisions and direct-SQL metadata startup are host
infrastructure and MUST NOT change Spell Check registration, diagnostics, or
status-bar ownership.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-SPL-001 | The sibling `lapis-plugins` repository MUST ship `@lapis-notes/spellcheck` at `packages/spellcheck` with runtime id `spellcheck` for static composition or registry installation. |
| LN-SPL-002 | Spell Check MUST register a language-service provider for open documents that match its include and exclude globs. It MUST NOT scan unopened vault files. |
| LN-SPL-003 | Spell Check Settings MUST expose dialect, disabled Harper rules, dictionaries, ignore state, file-type filters, and Harper lint options. Changing a setting MUST apply on the next open-document diagnostics request. |
| LN-SPL-004 | Spell Check diagnostics MUST use the Harper rule id and message. Unset severity MUST map Spelling to error, Style to warning, and other kinds to hint. A stored `diagnosticSeverity` MUST override that mapping. |
| LN-SPL-005 | Suggestion actions MUST be serializable document edits. Add to dictionary and Ignore MUST persist configuration and refresh on the next diagnostics request. |
| LN-SPL-006 | Spell Check MUST publish `spellcheck:status` on `app.statusBar` with Lucide `spell-check` and an optional dialect segment. Click MUST open dialect choices and a checking toggle. It MUST NOT use compatibility status DOM, the Harper logo, or flag emoji. |
| LN-SPL-007 | Spell Check MUST refresh `spellcheck:status` from plugin load and configuration updates. It MUST NOT subscribe to `layout-change` for that item. A no-op dialect or checking write MUST NOT upsert the status bar. |
| LN-SPL-008 | Spell Check MUST start Harper during plugin load and MUST surface setup failure through LN-WS-077. Open-document diagnostics requested while Harper is still warming MUST complete with no Spell Check diagnostics instead of timing out. It MUST NOT fail plugin enablement. |
| LN-SPL-009 | An open misspelled Markdown note on the web host MUST publish a Harper Problems row beside Markdownlint after Spell Check starts. The manager timeout row MUST NOT remain once setup succeeds. |
| LN-SPL-010 | Spell Check code actions MUST use cspell-style titles: bare suggestion text, `Add: "<word>" to dictionary`, and `Ignore: "<word>"`. Ignore this suggestion MUST remain last. User, folder, and cspell.json targets MUST NOT appear. |

### LN-SPL-003 acceptance details

Spell Check Settings cover Harper options and file-type filters:

- Dialect MUST include American, British, Canadian, and Australian, plus Indian when `harper.js` exposes it.
- `disabledRules` MUST list the committed Harper linter catalog. Harper defaults such as `SpelledNumbers` off MUST remain unless the vault lists them.
- `userDictionary` and `ignoreWords` MUST persist in app configuration. Forgotten ignored hashes MUST clear through a Settings action.
- `enabledFileTypes` MUST default to `markdown` and `plaintext`. `checkFrontmatter` MUST default off. Include and exclude globs MUST use the shared editor-association dialect.
- `isolateEnglish` and `ignoreLinkTitle` MUST default off. `maxFileLength` MUST default to 120000 bytes. `numSuggestions` MUST default to 8.

The shared language-service collection publishes those diagnostics beside
Markdownlint because `LanguageServiceManager` merges every matching provider
(LN-WS-076). Harper setup starts during plugin load; diagnostics requested before
that setup resolves complete empty rather than producing a provider timeout. A
setup failure appears as a workspace-wide Problems row and does not fail
enablement (LN-SPL-008). An open misspelled web note publishes a Harper Problems
row once WASM setup succeeds (LN-SPL-009). Problems actions use cspell-style
titles (LN-SPL-010). Settings persist through API configuration. Markdown mode
skips code fences. Ignore comments such as `harper:ignore` MAY mask regions
through Harper `regex_mask`. Browser `editor.behaviour.spellCheck` remains a
separate setting.
