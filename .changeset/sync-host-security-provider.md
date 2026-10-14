---
"@lapis-notes/api": patch
---

Allow trusted hosts to delegate scoped Sync security to native custody while
preserving legacy plugin credentials. Check permissions before and after
asynchronous operations, reject local enrollment for delegated plugins, and
await security revocation when a plugin is disabled, including unload failures.
Add host disposal that invalidates runtimes and drains delegated cleanup.
