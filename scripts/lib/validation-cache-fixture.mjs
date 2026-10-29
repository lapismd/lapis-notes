import { copyFile, cp, mkdir } from "node:fs/promises";
import { join } from "node:path";

/** Install the actual public controller and its modules into a cache fixture. */
export async function installValidationCacheController(root) {
  await mkdir(join(root, "scripts"), { recursive: true });
  await copyFile(
    new URL("../validation.mjs", import.meta.url),
    join(root, "scripts/validation.mjs"),
  );
  await cp(
    new URL("../validation/", import.meta.url),
    join(root, "scripts/validation"),
    { recursive: true },
  );
}
