---
"@lapis-notes/api": patch
---

Add explicit host-delivered pairing without relay addresses while preserving
default relay invitations and the signed/encrypted Nostr message format. Expose
copied installed content-key epoch numbers only while unlocked so history policy
can use the actual keyring instead of assuming an epoch.

Expose the same implementation through the headless `sync-security-host` export
for trusted Node/Deno hosts, with no plugin runtime platforms advertised.
