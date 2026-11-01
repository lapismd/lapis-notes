---
"@lapis-notes/api": patch
"@lapis-notes/ui": patch
"@lapis-notes/workspace": patch
"@lapis-notes/file-explorer": patch
---

Expose the explicit Notebook Design Core/UI host modules and admit Design Core 0.9 compatibility, including File Explorer so the host resolves one shared Core installation. This changes generated host admission metadata and dependency compatibility, not the API runtime interface; retain the 0.2 API peer cohort. Full host qualification remains required before release.

Add a public Vite renderer adapter that binds plugin compiler imports to the admitted versioned Svelte namespace and resolves those entries through the shared host runtime. Expose the required Markdown and CodeMirror host modules while keeping private imports and renderer version mismatches rejected.
