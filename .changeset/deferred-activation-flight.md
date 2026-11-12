---
"@lapis-notes/api": patch
---

Coalesce concurrent deferred-plugin activation so view and command requests share
one runtime evaluation and enablement, while failed activation remains retryable.
