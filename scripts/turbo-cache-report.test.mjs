import assert from "node:assert/strict";
import test from "node:test";

import { summarizeTurboCache } from "./report-turbo-cache.mjs";

test("summarizes local and remote cache outcomes", () => {
  assert.deepEqual(
    summarizeTurboCache({
      tasks: [
        { cache: { status: "HIT", source: "REMOTE" } },
        { cache: { status: "HIT", source: "LOCAL" } },
        { cache: { status: "MISS" } },
      ],
    }),
    { attempted: 3, executed: 1, localHits: 1, remoteHits: 1 },
  );
});
