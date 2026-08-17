# Markdown Lint Plugin

`@lapis-notes/markdown-lint` adapts open Markdown document diagnostics into the
shared Problems infrastructure. Language-service, Problems panel, desktop
sidecar, and host lifecycle requirements remain defined by their owning
chapters.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-MDL-001 | Markdownlint Settings MUST seed `markdown-lint.disabledRules` with `MD013` and list every default rule so a vault can enable or disable it. Stock MD018 MUST stay replaced by the Lapis tag-aware rule unless MD018 is disabled. |
| LN-MDL-002 | Markdownlint Settings MUST expose include and exclude globs for open Markdown documents. Empty include MUST lint remaining Markdown after excludes. Defaults MUST cover common Markdown extensions and skip `node_modules`, `.git`, `vendor`, and vault config trees. |
| LN-MDL-003 | Changing a Markdownlint setting MUST apply on the next open-document diagnostics request. The provider MUST NOT scan unopened vault files. |
| LN-MDL-004 | Markdownlint diagnostics MUST format each message as the rule names joined by `/`, a colon, and the rule description. An error detail MAY follow in square brackets. |

Settings persist through API configuration. Include and exclude globs use the
shared editor-association glob dialect, not vscode `!` negation in one list.
