# Search result and Problems provider boundaries

LN-SRCH-051 adds query-result sources to the owning App. These registrations
return navigation targets and presentation data only. They do not contribute
Problems, diagnostic collections, editor markers, fixes or permissions.

The diagnostic integration contracts in [Integration contracts](core-contract.md)
remain unchanged. This boundary confirmation accompanies the additive Plugin and
App registry exports; it does not qualify any new diagnostic behavior.
Declinable Markdown embedders register on `EmbedRegistry` and do not contribute
Problems, diagnostic collections, editor markers, or fixes.

The [admitted native Task observer](../../../architecture/rust-task-host-port.md#ln-core-014) retains typed failures, partial outcomes and request identity for host adapters. Diagnostic collection ownership and presentation continue through the existing Problems integration contract. A raw Task outcome is service data; an explicit host-owned contribution supplies any navigation or recovery action.
