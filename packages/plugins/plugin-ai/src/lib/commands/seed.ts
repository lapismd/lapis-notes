import {
  reservedCommandMarkdown,
  RESERVED_SLASH_COMMANDS,
} from "./reserved";
import type { UserAgentsCommandStore } from "./user-agents";

export async function seedReservedCommands(
  store: UserAgentsCommandStore,
  options: { overwrite?: boolean } = {},
): Promise<void> {
  for (const command of RESERVED_SLASH_COMMANDS) {
    if (!options.overwrite && (await store.exists(command.name))) continue;
    await store.write(command.name, reservedCommandMarkdown(command));
  }
}
