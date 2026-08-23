# Metadata database performance evidence — 2026-08-23

This evidence was captured on an Apple M1 Pro with 16 GiB RAM, Darwin 25.2.0,
Node 26.3.0, Turso 0.7.2, and headless Chromium from Playwright 1.61.1. The
blocking lane uses five warm runs. Fixture construction is excluded from all
timings.

The deterministic fixture contains one normalized file, metadata, tag,
property, and resolved-link row per note; one Search document per note; one
History revision per ten notes; and a frozen 1 MiB `app_state` migration backup.
The browser lane checkpoints the same Turso file, streams it into OPFS, then
opens and queries it exclusively through the production WASM driver.

## Blocking 50,000-note lane

| Metric (p95)                       |   Native | Native budget | WASM/OPFS | WASM budget |
| ---------------------------------- | -------: | ------------: | --------: | ----------: |
| Database open + queryable manifest |  3.08 ms |      1,000 ms |  37.00 ms |    2,500 ms |
| Per-file metadata lookup           |  0.21 ms |         25 ms |   2.99 ms |       75 ms |
| Tag facet                          | 35.59 ms |        200 ms | 203.69 ms |      500 ms |
| Typed property facet               | 90.98 ms |        200 ms | 412.63 ms |      500 ms |
| Incoming backlink                  |  0.80 ms |        200 ms |   2.98 ms |      500 ms |
| JavaScript heap delta at readiness | 0.16 MiB |       bounded |  0.43 MiB |     bounded |

Both engines passed. Instrumented unchanged startup performed zero Markdown
body reads, did not load the compatibility snapshot, and retained the 512-entry
metadata hot-cache contract. Vault reconciliation uses 500-file iterator and
manifest batches instead of constructing a second vault-sized JavaScript
collection.

## Reported 100,000-note stress lane

The stress lane is one reported, non-blocking run.

| Metric                             |    Native | WASM/OPFS |
| ---------------------------------- | --------: | --------: |
| Database open + queryable manifest |   2.78 ms |  37.32 ms |
| Per-file metadata lookup p95       |   0.18 ms |   3.50 ms |
| Tag facet                          |  74.37 ms | 392.30 ms |
| Typed property facet               | 191.67 ms | 831.46 ms |
| Incoming backlink                  |   0.92 ms |   2.89 ms |
| JavaScript heap delta at readiness |  0.19 MiB |  0.43 MiB |

The WASM typed-property query exceeds the 50,000-note blocking budget at
100,000 notes. This is recorded as stress evidence and does not fail the
required lane.

## Reproduction

```sh
pnpm performance:metadata:native
pnpm performance:metadata:wasm
pnpm performance:metadata:stress:native
pnpm performance:metadata:stress:wasm
```

The WASM runtime uses a scoped pnpm override so Turso's
`@napi-rs/wasm-runtime@1.0.7` resolves the `@emnapi` 1.8.1 worker ABI that
Turso 0.7.2 pins. Without that scoped alignment the browser worker fails before
OPFS can open.
