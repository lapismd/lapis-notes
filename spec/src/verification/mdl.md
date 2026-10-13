# MDL verification

<!-- prettier-ignore -->
| ID | Chapter | Status | Evidence |
| --- | --- | --- | --- |
| LN-MDL-001 | [markdown-lint-plugin](../plugins/markdown-lint/index.md#ln-mdl-001) | Implemented | plugin settings and tests seed disabledRules with MD013 and expose the default rule catalog |
| LN-MDL-002 | [markdown-lint-plugin](../plugins/markdown-lint/index.md#ln-mdl-002) | Implemented | plugin settings and path-filter tests cover include/exclude globs with vscode-like Markdown defaults |
| LN-MDL-003 | [markdown-lint-plugin](../plugins/markdown-lint/index.md#ln-mdl-003) | Implemented | provider skips excluded open paths, plugin tests pass live rules to worker and native adapters, and desktop source acceptance rejects an unconfigured duplicate provider |
| LN-MDL-004 | [markdown-lint-plugin](../plugins/markdown-lint/index.md#ln-mdl-004) | Implemented | language-service diagnostics format messages as `MD041/first-line-heading/first-line-h1: First line in a file should be a top-level heading` |
| LN-MDL-005 | [markdown-lint-plugin](../plugins/markdown-lint/index.md#ln-mdl-005) | Implemented | language-service and plugin tests cover Fix this, Fix all, Disable line/file, and vault `disabledRules` command titles |
