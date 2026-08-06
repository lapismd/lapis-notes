import { describe, expect, it } from "vitest";
import { Events } from "../events";

describe("Events compatibility", () => {
  it("unregisters event refs", () => {
    const events = new Events<{ change: [value: number] }>();
    const values: number[] = [];
    const ref = events.on("change", (value) => values.push(value));

    events.trigger("change", 1);
    events.offref(ref);
    events.trigger("change", 2);

    expect(values).toEqual([1]);
  });
});
