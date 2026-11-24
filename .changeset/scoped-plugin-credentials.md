---
"@lapis-notes/api": patch
"@lapis-notes/app-profile": patch
---

Allow trusted plugins to request a host-backed `plugin:secrets` capability. The workspace profile passes the host's credential service into the plugin lifecycle. A plugin uses `this.secrets.get`, `set`, and `delete` within its own approved scope.
