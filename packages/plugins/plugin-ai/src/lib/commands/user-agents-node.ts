import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { SLASH_COMMAND_NAME_PATTERN } from "@lapis-notes/api/agent-skills";
import type { UserAgentsCommandFile, UserAgentsCommandStore } from "./user-agents";

export function defaultUserAgentsCommandsDir(): string {
  return join(homedir(), ".lapis", "agents", "commands");
}

export function createNodeUserAgentsStore(
  root = defaultUserAgentsCommandsDir(),
): UserAgentsCommandStore {
  return {
    root,
    async list(): Promise<UserAgentsCommandFile[]> {
      let names: string[];
      try {
        names = await readdir(root);
      } catch (error) {
        if (
          error instanceof Error &&
          "code" in error &&
          error.code === "ENOENT"
        ) {
          return [];
        }
        throw error;
      }
      const files: UserAgentsCommandFile[] = [];
      for (const file of names) {
        if (!file.endsWith(".md")) continue;
        const name = file.slice(0, -3);
        if (!SLASH_COMMAND_NAME_PATTERN.test(name)) continue;
        files.push({
          name,
          content: await readFile(join(root, file), "utf8"),
        });
      }
      return files;
    },
    async exists(name: string): Promise<boolean> {
      try {
        await access(join(root, `${name}.md`));
        return true;
      } catch {
        return false;
      }
    },
    async write(name: string, content: string): Promise<void> {
      await mkdir(root, { recursive: true });
      await writeFile(join(root, `${name}.md`), content, "utf8");
    },
  };
}
