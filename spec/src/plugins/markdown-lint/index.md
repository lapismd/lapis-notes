# Markdown Lint Plugin

`@lapis-notes/markdown-lint` adapts open Markdown document diagnostics into the
shared Problems infrastructure. Language-service, Problems panel, desktop
sidecar, and host lifecycle requirements remain defined by their owning
chapters. Editor defaults disable MD013/line-length to match
vscode-markdownlint; vault `markdown-lint.disabledRules` still suppress extra
rules.
