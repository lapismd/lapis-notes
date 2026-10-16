---
"@lapis-notes/api": patch
---

Add an explicitly started App-owned watch service with bounded reconciliation and awaitable stop/restart. Project external changes through existing workspace/editor lifecycles, preserving dirty views and retained writers while clean views follow file moves and removals.
