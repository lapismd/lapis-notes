---
"@lapis-notes/api": patch
"@lapis-notes/file-explorer": patch
---

Protect and flush registered file writers before FileManager trash or deletion, including folder descendants. Route Explorer deletion through that guard so failed writes retain the file and dirty draft until explicit recovery.
