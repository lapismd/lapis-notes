---
"@lapis-notes/api": patch
"@lapis-notes/ui": patch
---

Use published Bits UI 2.19.5 so destroyed text-selection layers stop document pointer listeners before reading component-owned reactive state.

Retain the existing approved Link Preview selection-probe and listener cleanup when refreshing the runtime.
