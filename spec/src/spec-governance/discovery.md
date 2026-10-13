# Specification Governance / Discovery

## LN-GOV-020 — Tracked QMD configuration: index spec/src/\*_/_.md as the lapis-spec collection

<a id="ln-gov-020"></a>

**Requirement.** The tracked QMD configuration MUST index `spec/src/**/*.md` as the `lapis-spec` collection and MUST keep its generated database state untracked.

## LN-GOV-021 — Specification searches: refresh the local collection before querying. Semantic

<a id="ln-gov-021"></a>

**Requirement.** Specification searches MUST refresh the local collection before querying. Semantic search MUST update embeddings before vector retrieval, while normal checks and CI MUST NOT refresh or require the discovery index.
