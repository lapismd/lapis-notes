# Web Host / Hosted client

These client requirements stayed in Notes when the hosted server book moved
to lapis-server. The server specification is
<https://lapismd.github.io/lapis-server/>.

## LN-SRV-010 — Remote DataAdapter.process(): transform one fetched text snapshot and commit

<a id="ln-srv-010"></a>

**Requirement.** Remote `DataAdapter.process()` MUST transform one fetched text snapshot and commit it with the matching ETag. A conflict MUST throw a typed error and MUST NOT rerun the caller callback automatically.

## LN-SRV-016 — Browser vault adapter: translate Lapis virtual-root paths such as /.lapis/plugins

<a id="ln-srv-016"></a>

**Requirement.** The browser vault adapter MUST translate Lapis virtual-root paths such as `/.lapis/plugins` to managed relative paths before native HTTP requests. Direct server routes MUST continue to reject absolute paths, traversal, and host filesystem access.

## LN-SRV-019 — Server-mode Web client: use the public build-configured Nostr plugin source

<a id="ln-srv-019"></a>

**Requirement.** A server-mode Web client MAY use the public build-configured Nostr plugin source directly. The hosted server owns the rule that it is not a registry, relay trust root, curator, or proxy.
