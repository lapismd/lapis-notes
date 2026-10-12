# Deferred Nostr registry binding

The static profile does not import this Community-backed binding or its tests.
The API retains the transport-neutral adapter contracts and their active tests.
Before enabling relay discovery, restore the Community dependency, move this
binding into the active source tree, reconnect host startup and disposal, and
qualify relay, proof, host, and browser acceptance. Community plugin enablement
is a separate decision.
