import { describe, expect, it } from "vitest";
import { Tasks } from "../tasks";

describe("Tasks compatibility", () => {
  it("tracks callback and promise work until all tasks settle", async () => {
    const tasks = new Tasks();
    const completed: string[] = [];

    tasks.add(async () => {
      completed.push("callback");
    });
    tasks.addPromise(
      Promise.resolve().then(() => {
        completed.push("promise");
      }),
    );

    expect(tasks.isEmpty()).toBe(false);
    await tasks.promise();

    expect(completed.sort()).toEqual(["callback", "promise"]);
    expect(tasks.isEmpty()).toBe(true);
  });
});
