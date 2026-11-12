# Browser vault media resource qualification

LN-WEB-091 repairs browser vault resource blobs in the owning API package.
Installed Canvas group acceptance exposed one failure: a valid SVG resource
remained undecodable because its public blob URL had an empty MIME type.
The Canvas plugin continues to use the public resource contract and owns its
URL leases; it does not copy or retag adapter data.

The exact source regression was:

    pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/browser-storage.test.ts -t 'resource URLs a decodable MIME'

All six MIME cases failed before production changes. They now pass for SVG,
PNG, MP4, MP3, PDF and unknown binary data, including uppercase extensions,
complete byte preservation and explicit URL revocation. The jsdom Blob test
uses FileReader for byte assertions because jsdom does not implement
Blob.arrayBuffer. The complete browser-storage suite passes 36 cases.

The private helper identifies supported passive media extensions and returns
application/octet-stream for unknown names. The adapter reads its existing
binary source unchanged and supplies that MIME type to Blob. No public export,
database state, native authority or writer contract is added.

Root check/test/build lanes pass 16/16, 16/16 and 9/9 tasks, and the complete
canonical specification lane passes. The cold catalog passes 62 families and
275 tests with zero failures or skips (run
bf8c06fc-0da8-41ad-9be0-529046aaa2dc). Its first attempt passed 273 tests before
a browser disconnect; the affected two link-preview stories pass independently
and the complete repeated run is green. The older Search 0.1.3 intake defect
was separately reproduced on unchanged main and repaired by consuming released
0.1.6 without changing assertions; its separate record owns that evidence.

All seven actual installed Canvas Web cases pass with the source API host
rebuilt through its public exports, including SVG decoding, sizing changes,
invalid replacement, removal and undo. This is explicit temporary source-host
acceptance, with normal registry semver preserved in publishable manifests.
No npm version or installed application is published by this source change.

After narrowing the companion Search lock update to its required dependency
closure, the final candidate again passes all 62 catalog families and all
275 tests with zero failures or skips (validation run
c3cf92b6-a75e-445e-ae32-44d153bde851). The final graph also passes the six
Search placements, root check/test/build (16/16, 16/16, 9/9) and spec/App audits.
Unrelated Zod/Rollup resolutions and generated Deno cache changes are excluded.
