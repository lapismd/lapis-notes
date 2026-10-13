# PLUG — Part 2 verification

<!-- prettier-ignore -->
| ID | Chapter | Status | Evidence |
| --- | --- | --- | --- |
| LN-PLUG-104 | [plugin-model](../plugin-model/lifecycle-and-views.md#ln-plug-104) | In progress | Graph Details fixed-header regression reproduced 1 failure before moving navigation outside scrolling content. Directory and sidebar header checks are included in affected stories. |
| LN-PLUG-105 | [plugin-model](../plugin-model/distribution-and-registry-01.md#ln-plug-105) | In progress | Verified image source regressions moved from 3 failing to 3 passing, covering skeleton until decode, request failure and browser decode failure. Loading and unavailable detail stories provide interaction/accessibility review. |
| LN-PLUG-093 | [plugin-model](../plugin-model/distribution-and-registry-01.md#ln-plug-093) | In progress | Source-selection, update-pinning, cache isolation and revocation retention regressions. |
| LN-PLUG-094 | [plugin-model, desktop-deno-host](../plugin-model/distribution-and-registry-01.md#ln-plug-094) | Implemented | `packages/desktop-deno/scripts/local-registry-env.test.mjs`: explicit opt-in and static-only fixture presence. |
| LN-PLUG-095 | [plugin-model, packages, web-host, desktop-deno-host, server-deno-host, architecture](../plugin-model/distribution-and-registry-02.md#ln-plug-095) | In progress | Local configuration regressions cover mode gating, explicit host options, loopback transport, exact artifact-origin mapping, and public key validation. Real host installation acceptance is in progress. |
| LN-PLUG-090 | [plugin-model](../plugin-model/lifecycle-and-views.md#ln-plug-090) | Implemented | API plugin and workspace tests cover public declarative section registration, controlled source writes and subscriptions, trust and lifecycle disposal, workspace isolation, and exclusion from application configuration persistence. |
| LN-PLUG-091 | [plugin-model](../plugin-model/lifecycle-and-views.md#ln-plug-091) | Implemented | API settings tests render one definition through Workspace Settings and a plugin-owned DeclarativePluginSettingTab, verify bidirectional synchronization, and reject duplicate persistence or manual mount ownership. |
