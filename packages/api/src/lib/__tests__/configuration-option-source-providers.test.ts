import { describe, expect, it } from "vitest";
import {
  filterOptionsByQuery,
  normalizeMetadataFieldOptionValues,
  resolveMetadataFieldValues,
} from "../configuration-option-source-providers";

describe("configuration option source providers", () => {
  it("normalizes metadata field values from strings and arrays", () => {
    expect(
      normalizeMetadataFieldOptionValues([
        "alpha",
        ["beta", "gamma"],
        "",
        "alpha",
      ]),
    ).toEqual(["alpha", "beta", "gamma"]);
  });

  it("filters options by query and limit", () => {
    expect(
      filterOptionsByQuery(
        [
          { value: "release", label: "Release" },
          { value: "regression", label: "Regression" },
        ],
        "reg",
        10,
      ),
    ).toEqual([{ value: "regression", label: "Regression" }]);
  });

  it("resolves metadata field values from optionsSourceParams", () => {
    expect(
      resolveMetadataFieldValues(
        (field) => (field === "status" ? ["todo", "done"] : []),
        {
          type: "string",
          optionsSource: "metadata.fieldValues",
          optionsSourceParams: { field: "status" },
        },
        "done",
        10,
      ),
    ).toEqual([{ value: "done", label: "done" }]);
  });
});
