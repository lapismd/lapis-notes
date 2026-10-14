import { createHash } from "node:crypto";
import { lstat, realpath } from "node:fs/promises";
import { resolve } from "node:path";

/** Physical admission descriptor; its binding is compatible with existing native journals. */
export async function inspectNativeSyncRoot(
  path: string,
): Promise<{ root: string; binding: string }> {
  const resolved = resolve(path),
    stat = await lstat(resolved, { bigint: true });
  if (!stat.isDirectory() || stat.isSymbolicLink())
    throw new Error("Guarded vault root must be a physical directory");
  const root = await realpath(resolved);
  const identity = `${stat.dev}:${stat.ino}:${stat.birthtimeNs}`;
  return {
    root,
    binding: createHash("sha256").update(`${root}\0${identity}`).digest("hex"),
  };
}
