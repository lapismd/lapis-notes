import { describe, expect, it } from "vitest";
import {
  WORDCOUNT_PLUGIN_ID,
  WORDCOUNT_READING_TIME_COMMAND_ID,
  WORDCOUNT_STATUS_ID,
} from "./ids";

describe("WordCountPlugin identity", () => {
  it("keeps the runtime id and status command", () => {
    expect(WORDCOUNT_PLUGIN_ID).toBe("wordcount");
    expect(WORDCOUNT_STATUS_ID).toBe("wordcount:status");
    expect(WORDCOUNT_READING_TIME_COMMAND_ID).toBe("wordcount:reading-time");
  });
});
