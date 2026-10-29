import { expect, test } from "vitest";
import fixture from "./fixtures/indexed-mutations.json";
import { database, run, type Step } from "./indexed-mutation-support";

for (const scenario of fixture.cases) {
  test(`retained indexed-file mutation: ${scenario.name}`, async () => {
    const db = await database(scenario.collision);
    try {
      expect(await run(db, scenario.steps as Step[])).toEqual(
        scenario.expected,
      );
    } finally {
      await db.close();
    }
  });
}
