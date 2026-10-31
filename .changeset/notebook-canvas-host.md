---
"@lapis-notes/api": patch
"@lapis-notes/ui": patch
"@lapis-notes/workspace": patch
---

Expose the explicit Notebook Design Core/UI host modules and admit Design Core 0.8 compatibility. This changes generated host admission metadata and dependency compatibility, not the API runtime interface; retain the 0.2 API peer cohort. Full host qualification remains required before release.
