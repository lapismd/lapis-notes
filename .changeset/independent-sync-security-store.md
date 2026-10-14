---
"@lapis-notes/api": patch
---

Allow trusted hosts to retain wrapped Sync keys and network grants in a dedicated
security store independent of disposable application indexes. Keep legacy storage
compatible and reject invalid or unavailable dedicated stores without fallback.

Expose the shared metadata-store types through a headless host-only entrypoint,
retaining the existing AppDatabase metadata exports.
