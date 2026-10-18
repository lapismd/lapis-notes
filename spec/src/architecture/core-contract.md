# Architecture / Plugin integration

## LN-ARCH-043 — API: own the public search-document contribution registry, Search

<a id="ln-arch-043"></a>

**Requirement.** The API MUST own the public search-document contribution registry, Search MUST own provider selection and generated index state, and domain plugins MUST own parsing and semantic projection for their file formats.

## LN-ARCH-050 — Initial blank Bases filter

<a id="ln-arch-050"></a>

**Requirement.** Bases MUST treat its initial blank filter row as the first predicate so the first Add Filter activation appends a second visible predicate. Nested Design Core Select portals MUST paint above the enclosing filter Popover through shared portal ordering without a Bases-owned z-index override.

## LN-ARCH-051 — Bases: own one semantic query-popover width contract shared

<a id="ln-arch-051"></a>

**Requirement.** Bases MUST own one semantic query-popover width contract shared by Sort and Filter. Their portaled outer Popover contents MUST resolve the same bounded inline size while each workflow retains its own content, scrolling, and surface treatment.

## LN-ARCH-075 — Generated-state consumers: request only the indexed metadata domains they

<a id="ln-arch-075"></a>

**Requirement.** Generated-state consumers MUST request only the indexed metadata domains they need and use path-only Search matching when only membership is required. API providers own bulk materialization, stable pagination, and transport serialization; plugins MUST NOT recreate per-file database fan-out or transfer full Search documents merely to obtain matching paths.

## LN-ARCH-078 — Search and Graph query ownership

<a id="ln-arch-078"></a>

**Requirement.** Search owns indexed structured-query evaluation; Graph owns ordered Group policy, filter membership, colour precedence, and time-lapse presentation. Their boundary MUST be ordered path-only membership through AppDatabase. Graph MUST NOT import Search plugin internals, and Search MUST NOT acquire Graph settings or renderer policy.

## LN-ARCH-079 — Graph: persist portable slider positions while translating them

<a id="ln-arch-079"></a>

**Requirement.** Graph MUST persist portable slider positions while translating them to D3 force values only inside its renderer boundary. The renderer MUST derive link weighting from topology degree rather than persisted reference counts. Settings migration MUST remain plugin-owned and preserve unrelated presentation state.

Custom status controls retain plugin domain ownership. The API projects the
public status mount/disposer into Design Core without depending on the controls'
implementation; desktop repository status remains downstream-owned (LN-WS-054).
