# App Database / Database integration

## LN-DB-050 — External file identity bindings: namespaced by the authenticated plugin context. One

<a id="ln-db-050"></a>

**Requirement.** External file identity bindings MUST be namespaced by the authenticated plugin context. One plugin MUST NOT read, write, replace, or delete another plugin's bindings, and conflicting external IDs MUST fail closed.
