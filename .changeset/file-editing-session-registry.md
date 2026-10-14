---
"@lapis-notes/api": patch
---

Expose an App-owned file editing-session registry for independent file writers.
Serialize guarded mutation, protect and flush every matching session before
admission, retain detached dirty writers for retry, and drain cleanup before
another mutation or shutdown. Production Sync guard selection still requires
complete writer integration.
