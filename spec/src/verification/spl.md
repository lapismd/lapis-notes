# SPL verification

<!-- prettier-ignore -->
| ID | Chapter | Status | Evidence |
| --- | --- | --- | --- |
| LN-SPL-001 | [spellcheck-plugin](../plugins/spellcheck/index.md#ln-spl-001) | Implemented | spellcheck package, manifest id, and `enabledByDefault: true` host registrations |
| LN-SPL-002 | [spellcheck-plugin](../plugins/spellcheck/index.md#ln-spl-002) | Implemented | provider tests lint matching open paths only and skip closed or excluded files |
| LN-SPL-003 | [spellcheck-plugin](../plugins/spellcheck/index.md#ln-spl-003) | Implemented | settings and tests expose dialect, Harper rules, dictionaries, file-type filters, and lint options |
| LN-SPL-004 | [spellcheck-plugin](../plugins/spellcheck/index.md#ln-spl-004) | Implemented | diagnostics map Harper rule ids and kind-based severity unless diagnosticSeverity overrides |
| LN-SPL-005 | [spellcheck-plugin](../plugins/spellcheck/index.md#ln-spl-005) | Implemented | suggestion edits plus dictionary and ignore commands persist and refresh on the next request |
| LN-SPL-006 | [spellcheck-plugin](../plugins/spellcheck/index.md#ln-spl-006) | Implemented | status-bar item uses Lucide spell-check, dialect text, and a click menu; editor-demo Ready play opens that menu |
| LN-SPL-007 | [spellcheck-plugin](../plugins/spellcheck/index.md#ln-spl-007) | Implemented | plugin tests subscribe to configuration, skip layout-change, and omit no-op status upserts |
| LN-SPL-008 | [spellcheck-plugin](../plugins/spellcheck/index.md#ln-spl-008) | Implemented | plugin load starts Harper and reports a rejected setup through language-service without marking the plugin failed; provider tests return empty diagnostics while Harper is warming |
| LN-SPL-009 | [spellcheck-plugin](../plugins/spellcheck/index.md#ln-spl-009) | Implemented | web Harper e2e opens a misspelled note, asserts a Harper Problems row, and asserts the spellcheck timeout row is gone |
| LN-SPL-010 | [spellcheck-plugin](../plugins/spellcheck/index.md#ln-spl-010) | Implemented | provider tests publish bare suggestion titles plus Add to dictionary and Ignore word commands that persist settings |
