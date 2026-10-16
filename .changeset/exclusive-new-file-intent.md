---
"@lapis-notes/api": patch
"@lapis-notes/file-explorer": patch
---

Add an optional exclusive file-creation transport and route Explorer new-note actions through the FileManager creation intent. Preserve existing destinations on collisions and keep legacy Vault creation semantics explicit.
