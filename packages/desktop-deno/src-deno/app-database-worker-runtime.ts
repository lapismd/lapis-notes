import type { AppDatabase } from "../../api/src/lib/storage/app-database.ts";
import type {
  AppDatabaseWorkerOpenInput,
  AppDatabaseWorkerRequest,
  AppDatabaseWorkerResponse,
} from "./app-database-worker-protocol.ts";
import { serializeAppDatabaseWorkerError } from "./app-database-worker-protocol.ts";

type WorkerDatabaseSession = {
  database: AppDatabase;
  unsubscribe: () => void;
};

export type OpenWorkerAppDatabase = (
  input: AppDatabaseWorkerOpenInput,
) => Promise<AppDatabase>;

export class AppDatabaseWorkerRuntime {
  readonly #sessions = new Map<string, WorkerDatabaseSession>();
  readonly #opening = new Map<string, Promise<AppDatabase>>();

  constructor(
    private readonly openDatabase: OpenWorkerAppDatabase,
    private readonly send: (response: AppDatabaseWorkerResponse) => void,
  ) {}

  async handle(request: AppDatabaseWorkerRequest): Promise<void> {
    try {
      let value: unknown;
      if (request.type === "open") value = await this.#open(request);
      else if (request.type === "close") await this.#close(request.databaseId);
      else if (request.type === "close-all") await this.#closeAll();
      else value = await this.#invoke(request);
      this.send({ type: "result", id: request.id, ok: true, value });
    } catch (error) {
      this.send({
        type: "result",
        id: request.id,
        ok: false,
        error: serializeAppDatabaseWorkerError(error),
      });
    }
  }

  async #open(input: AppDatabaseWorkerOpenInput): Promise<unknown> {
    const existing = this.#sessions.get(input.databaseId)?.database;
    if (existing) return existing.descriptor;
    const pending = this.#opening.get(input.databaseId);
    if (pending) return (await pending).descriptor;
    const opening = this.openDatabase(input);
    this.#opening.set(input.databaseId, opening);
    try {
      const database = await opening;
      const unsubscribe = database.subscribeToChanges((change) => {
        this.send({
          type: "change",
          databaseId: input.databaseId,
          vaultId: input.vaultId,
          change,
        });
      });
      this.#sessions.set(input.databaseId, { database, unsubscribe });
      return database.descriptor;
    } finally {
      this.#opening.delete(input.databaseId);
    }
  }

  async #invoke(
    request: Extract<AppDatabaseWorkerRequest, { type: "invoke" }>,
  ): Promise<unknown> {
    const session = this.#sessions.get(request.databaseId);
    if (!session) throw new Error("Desktop app database is not open");
    return await (
      session.database[request.method] as (
        ...args: unknown[]
      ) => Promise<unknown>
    )(...request.args);
  }

  async #close(databaseId: string): Promise<void> {
    await this.#opening.get(databaseId)?.catch(() => undefined);
    const session = this.#sessions.get(databaseId);
    if (!session) return;
    this.#sessions.delete(databaseId);
    session.unsubscribe();
    await session.database.close();
  }

  async #closeAll(): Promise<void> {
    await Promise.all(
      [...this.#opening.values()].map((opening) =>
        opening.catch(() => undefined),
      ),
    );
    for (const databaseId of [...this.#sessions.keys()]) {
      await this.#close(databaseId);
    }
  }
}
