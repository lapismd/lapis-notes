---
"@lapis-notes/api": patch
---

Register and protect asynchronous editor document loads before reading, drain
original drafts and publish the target file and contents together. Superseded,
unloaded and failed loads preserve the previous document and release their
provisional session. Managed file and folder renames now protect and flush all
registered writers before moving files or rewriting links.
