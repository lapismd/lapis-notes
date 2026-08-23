import { dirname, join } from "jsr:@std/path@1.1.6";
import {
  currentPtyTarget,
  materializePtyLibrary,
  ptyArtifact,
  verifyPtyLibrary,
} from "@lapismd/terminal-host/deno";
import { userDataDir } from "./user-data.ts";

export async function resolveDenoPtyLibrary(): Promise<string> {
  const configured = Deno.env.get("LAPIS_PTY_LIBRARY")?.trim();
  const target = currentPtyTarget();
  const artifact = ptyArtifact(target);
  if (configured) {
    await verifyPtyLibrary(configured, artifact.sha256);
    return configured;
  }
  const embedded = new URL(`../native/${artifact.file}`, import.meta.url);
  try {
    const bytes = await Deno.readFile(embedded);
    const destination = join(userDataDir(), "pty-ffi", artifact.file);
    await writeVerifiedLibrary(destination, bytes, artifact.sha256);
    return destination;
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
  return materializePtyLibrary(target);
}

async function writeVerifiedLibrary(
  destination: string,
  bytes: Uint8Array,
  sha256: string,
): Promise<void> {
  try {
    await verifyPtyLibrary(destination, sha256);
    return;
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) await Deno.remove(destination).catch(() => {});
  }
  await Deno.mkdir(dirname(destination), { recursive: true });
  const temporary = `${destination}.${crypto.randomUUID()}.tmp`;
  await Deno.writeFile(temporary, bytes, { createNew: true, mode: 0o755 });
  try {
    await verifyPtyLibrary(temporary, sha256);
    await Deno.rename(temporary, destination);
  } catch (error) {
    await Deno.remove(temporary).catch(() => {});
    throw error;
  }
}
