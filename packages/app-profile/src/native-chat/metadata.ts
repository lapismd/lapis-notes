import type { TurnSummary } from "@lapis-notes/api/native-turns";
import { active, directory } from "./conversation";
import type { NativeChatSession } from "./session";

type Metadata = { title: string; status: "active" | "archived" };

/** Bounded read-only metadata projection, never a transcript or job owner. */
export class NativeChatMetadata {
  #cache = new Map<
    string,
    { revision: string; expires: number; value: Metadata }
  >();
  #titles = new Map<string, string>();
  constructor(readonly session: NativeChatSession) {}
  async #title(first: TurnSummary): Promise<string> {
    const cached = this.#titles.get(first.request_id);
    if (cached) return cached;
    const value = await this.session.call({
      kind: "read",
      request_id: first.request_id,
    });
    if (
      value.kind !== "record" ||
      !value.record ||
      value.record.conversation_id !== first.conversation_id ||
      value.record.input.scope_dir !== first.scope_dir
    )
      throw new Error("This saved conversation cannot be displayed");
    const title =
      Array.from(value.record.input.prompt).slice(0, 96).join("") ||
      "Conversation";
    this.#titles.set(first.request_id, title);
    return title;
  }
  async read(
    heads: TurnSummary[],
    firsts: Map<string, TurnSummary>,
  ): Promise<Map<string, Metadata>> {
    const result = new Map<string, Metadata>();
    for (let offset = 0; offset < heads.length; offset += 16) {
      await Promise.all(
        heads.slice(offset, offset + 16).map(async (head) => {
          const revision = `${head.request_id}:${head.updated_at_ms}:${head.phase}`;
          const cached = this.#cache.get(head.conversation_id);
          if (cached?.revision === revision && cached.expires > Date.now()) {
            result.set(head.conversation_id, cached.value);
            return;
          }
          try {
            const metadata = JSON.parse(
              await this.session.readText(`${directory(head)}/metadata.yaml`),
            );
            if (
              metadata.schemaVersion !== 3 ||
              metadata.id !== head.conversation_id ||
              (metadata.title !== undefined &&
                typeof metadata.title !== "string")
            )
              throw new Error("This saved conversation cannot be displayed");
            const value: Metadata = {
              title:
                metadata.title?.trim() ||
                (await this.#title(firsts.get(head.conversation_id)!)),
              status: metadata.status === "archived" ? "archived" : "active",
            };
            this.#cache.set(head.conversation_id, {
              revision,
              expires: Date.now() + 2000,
              value,
            });
            result.set(head.conversation_id, value);
          } catch (error) {
            if (
              !active(head.phase) ||
              !["ENOENT", "NOT_FOUND"].includes(
                (error as { code?: string }).code ?? "",
              )
            )
              throw error;
            // First publication can follow journal acceptance. Retry on the next read.
          }
        }),
      );
    }
    for (const id of this.#cache.keys())
      if (!result.has(id)) this.#cache.delete(id);
    const retained = new Set(
      [...firsts.values()].map((first) => first.request_id),
    );
    for (const id of this.#titles.keys())
      if (!retained.has(id)) this.#titles.delete(id);
    return result;
  }
}
