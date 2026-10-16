---
"@lapis-notes/api": minor
---

Expose `Workspace.flushLayout()` for hosts to await the latest serialized layout
write before closing or reloading. Retain normal debounced persistence, report
and retry failures, and drain accepted writes before disposing the host.
