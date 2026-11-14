# Native plugin operations

Plugins declare compiled native operations in their manifest:

```json
{
  "lapis": {
    "manifestVersion": 1,
    "contributes": {
      "operations": [{ "id": "list", "version": 1 }]
    }
  }
}
```

The manifest's plugin ID supplies the namespace. `@lapis-notes/api/operations`
exports generated descriptors for input/output schemas, permissions, effects,
CLI arguments, Markdown help, examples and keywords. The native provider owns
the handlers and generates the catalog from its typed definitions.

Hosts supply an admitted `OperationHost` through `VaultSession.operations` or
the explicit App option; the session takes precedence. The owning App exposes
`app.operations`. `resolveOperationContributions()` reports unsupported hosts,
unavailable operations, incompatible contracts and available descriptors.

Invocation uses explicit operation/protocol versions and a request identity.
The host checks credentials, vault admission, plugin enablement and the
credential's operation snapshot. Browser teardown drains observation while
accepted work stays native. Domain-specific version and recovery preconditions
remain part of each operation's input contract.

`registerAgentTool()` retains its existing conversation approval contract.
The legacy `registerCliHandler()` compatibility method does not register native
CLI commands. A compiled operation provider contributes CLI functions and help
through its shared descriptors.
