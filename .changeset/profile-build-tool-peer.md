---
"@lapis-notes/app-profile": patch
---

Remove the optional Vite peer so installing the application profile does not
promote build tooling into the production dependency graph. Hosts using
`plugin-host-build` continue to provide Vite directly; its exports and types are
unchanged.
