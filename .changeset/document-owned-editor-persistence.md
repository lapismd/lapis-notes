---
"@lapis-notes/api": patch
---

Keep editor saves and failures bound to their original document and App across
file switches and close. Register retained writers with the App-owned session
registry, expose protection and awaitable disposal, and support a captured
asynchronous external persistence writer. Block typing/rebinding during guarded
admission while allowing controlled clean refresh.
