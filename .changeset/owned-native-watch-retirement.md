---
"@lapis-notes/api": minor
---

Expose optional rename hints and awaitable native watch cleanup. Retire replaced or closed DirectoryWatcher generations before awaiting cleanup, retain failures for retry, and preserve complete polling state after read failures.
