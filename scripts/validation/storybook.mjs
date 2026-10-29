import { laneInvocations } from "./model.mjs";
import { execute } from "./process.mjs";

for (const args of laneInvocations("test:storybook", process.argv.slice(2))) {
  await execute("pnpm", [
    "exec",
    "vitest",
    "run",
    "--project",
    "storybook",
    "--no-file-parallelism",
    ...args,
  ]);
}
