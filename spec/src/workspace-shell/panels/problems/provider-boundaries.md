# Search result and Problems provider boundaries

LN-SRCH-051 adds query-result sources to the owning App. These registrations
return navigation targets and presentation data only. They do not contribute
Problems, diagnostic collections, editor markers, fixes or permissions.

The diagnostic integration contracts in [Integration contracts](core-contract.md)
remain unchanged. This boundary confirmation accompanies the additive Plugin and
App registry exports; it does not qualify any new diagnostic behavior.
Declinable Markdown embedders register on `EmbedRegistry` and do not contribute
Problems, diagnostic collections, editor markers, or fixes.

Indexing contribution unavailability under LN-CORE-005 remains service status
and notification data. Selecting the native background port does not introduce
a diagnostic model, callback transport or competing Problems presentation.

Shared native Search selection failures remain indexing status/notification
data. Observer sharing does not add a Problems collection or competing panel.
