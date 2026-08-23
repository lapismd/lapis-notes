import { join } from "jsr:@std/path@1/join";

export function userDataDir(): string {
  const override = Deno.env.get("LAPIS_DENO_USER_DATA")?.trim();
  if (override) return override;
  const home = Deno.env.get("HOME") ?? Deno.cwd();
  if (Deno.build.os === "darwin") {
    return join(home, "Library", "Application Support", "Lapis Notes Deno");
  }
  if (Deno.build.os === "windows") {
    const appData = Deno.env.get("APPDATA") ?? home;
    return join(appData, "Lapis Notes Deno");
  }
  return join(home, ".local", "share", "lapis-notes-deno");
}
