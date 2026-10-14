import { connect } from "@tursodatabase/database";
import { join } from "node:path";
import { existing } from "./sync-vault-files.ts";

/** SQLite releases this process-held write lock on close or process death. */
export class NativeVaultLease {
  private closed = false;
  private constructor(
    private readonly connection: Awaited<ReturnType<typeof connect>>,
    private readonly path: string,
    private readonly identity: string,
  ) {}
  static async open(stagingRoot: string): Promise<NativeVaultLease> {
    const path = join(stagingRoot, "owner.sqlite"),
      previous = await existing(path);
    if (previous && (!previous.isFile() || previous.isSymbolicLink()))
      throw new Error("Invalid native vault ownership file");
    let connection: Awaited<ReturnType<typeof connect>> | undefined;
    try {
      connection = await connect(path);
      await connection.exec("PRAGMA busy_timeout = 0; BEGIN IMMEDIATE;");
      const stat = (await existing(path))!;
      return new NativeVaultLease(
        connection,
        path,
        `${stat.dev}:${stat.ino}:${stat.birthtimeNs}`,
      );
    } catch (error) {
      await connection?.close();
      if (
        /locked|SQLITE_BUSY|database is busy/iu.test(
          error instanceof Error ? error.message : String(error),
        )
      )
        throw new Error("Another native apply owner holds this vault", {
          cause: error,
        });
      throw error;
    }
  }
  async assert(): Promise<void> {
    const stat = await existing(this.path);
    if (
      this.closed ||
      !stat ||
      !stat.isFile() ||
      `${stat.dev}:${stat.ino}:${stat.birthtimeNs}` !== this.identity
    )
      throw new Error("Native vault ownership lease is unavailable");
  }
  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    try {
      await this.connection.exec("ROLLBACK;");
    } finally {
      await this.connection.close();
    }
  }
}
