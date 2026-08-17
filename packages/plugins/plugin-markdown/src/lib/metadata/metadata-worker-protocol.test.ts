import { describe, expect, it } from "vitest";
import { extractMetadata } from "./extract-metadata";
import { handleMetadataWorkerMessage } from "./metadata-worker-protocol";

const FIXTURE_NOTE = `---
status: active
---

# Welcome

See [[Ideas|Idea inbox]] and #project/alpha.
`;

describe("metadata worker protocol", () => {
  it("parses a fixture note the same way as extractMetadata", () => {
    expect(handleMetadataWorkerMessage({ id: "note-1", data: FIXTURE_NOTE })).toEqual({
      id: "note-1",
      cache: extractMetadata(FIXTURE_NOTE),
    });
  });

  it("ignores malformed worker payloads", () => {
    expect(handleMetadataWorkerMessage(null)).toBeNull();
    expect(handleMetadataWorkerMessage({ id: 1, data: FIXTURE_NOTE })).toBeNull();
  });
});
