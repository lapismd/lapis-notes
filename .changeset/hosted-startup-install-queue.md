---
"@lapis-notes/api": patch
"@lapis-notes/workspace": patch
---

Reuse scanned identities during unchanged startup, exclude installed plugin assets from content polling, avoid eagerly reading lazy ESM chunks, queue plugin operations with independent progress and cancellation, and enable bundled AI by default on the Rust server.

Renew the native AI feature session after disable/re-enable so startup recovery
cannot reuse a fenced session.
