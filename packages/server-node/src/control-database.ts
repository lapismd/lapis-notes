import { connect } from "@tursodatabase/database";

export type ServerVaultRole = "owner" | "editor" | "viewer";

export type ControlUser = {
  id: string;
  username: string;
  passwordHash: string;
};

export type ControlSession = {
  id: string;
  userId: string;
  username: string;
  csrfToken: string;
  createdAt: number;
  lastSeenAt: number;
  expiresAt: number;
  revokedAt?: number;
};

export type ControlVault = {
  id: string;
  name: string;
  archivedAt?: number;
  role: ServerVaultRole;
};

type Row = Record<string, unknown>;

type ControlConnection = {
  exec(sql: string): Promise<void>;
  run(sql: string, ...args: unknown[]): Promise<unknown>;
  get<T extends Row>(sql: string, ...args: unknown[]): Promise<T | undefined>;
  all<T extends Row>(sql: string, ...args: unknown[]): Promise<T[]>;
  batch(
    statements: Array<{ sql: string; args?: unknown[] }>,
    mode?: string,
  ): Promise<unknown>;
  close(): Promise<void>;
};

const CONTROL_SCHEMA = `
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS schema_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  csrf_token TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER
);
CREATE INDEX IF NOT EXISTS sessions_token_idx ON sessions(token_hash);
CREATE TABLE IF NOT EXISTS vaults (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  archived_at INTEGER
);
CREATE TABLE IF NOT EXISTS vault_memberships (
  vault_id TEXT NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (vault_id, user_id)
);
CREATE INDEX IF NOT EXISTS memberships_user_idx
  ON vault_memberships(user_id, vault_id);
CREATE TABLE IF NOT EXISTS login_attempts (
  key_hash TEXT PRIMARY KEY,
  window_started_at INTEGER NOT NULL,
  attempt_count INTEGER NOT NULL,
  blocked_until INTEGER
);
INSERT INTO schema_meta(key, value) VALUES ('version', '1')
  ON CONFLICT(key) DO UPDATE SET value = excluded.value;
`;

function text(row: Row, key: string): string {
  const value = row[key];
  if (typeof value !== "string") throw new Error(`Invalid control row ${key}`);
  return value;
}

function integer(row: Row, key: string): number {
  const value = Number(row[key]);
  if (!Number.isSafeInteger(value)) {
    throw new Error(`Invalid control row ${key}`);
  }
  return value;
}

export class ControlDatabase {
  private constructor(private readonly connection: ControlConnection) {}

  static async open(path: string): Promise<ControlDatabase> {
    const connection = (await connect(path)) as ControlConnection;
    await connection.exec(CONTROL_SCHEMA);
    return new ControlDatabase(connection);
  }

  async close(): Promise<void> {
    await this.connection.close();
  }

  async userCount(): Promise<number> {
    const row = await this.connection.get<Row>(
      "SELECT count(*) AS count FROM users",
    );
    return Number(row?.count ?? 0);
  }

  async createUser(input: {
    id: string;
    username: string;
    passwordHash: string;
    now: number;
  }): Promise<void> {
    await this.connection.run(
      "INSERT INTO users(id, username, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      input.id,
      input.username,
      input.passwordHash,
      input.now,
      input.now,
    );
  }

  async findUser(username: string): Promise<ControlUser | undefined> {
    const row = await this.connection.get<Row>(
      "SELECT id, username, password_hash FROM users WHERE username = ? COLLATE NOCASE",
      username,
    );
    return row
      ? {
          id: text(row, "id"),
          username: text(row, "username"),
          passwordHash: text(row, "password_hash"),
        }
      : undefined;
  }

  async updatePassword(
    userId: string,
    passwordHash: string,
    now: number,
  ): Promise<void> {
    await this.connection.run(
      "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
      passwordHash,
      now,
      userId,
    );
    await this.revokeUserSessions(userId, now);
  }

  async createSession(input: {
    id: string;
    userId: string;
    tokenHash: string;
    csrfToken: string;
    createdAt: number;
    expiresAt: number;
  }): Promise<void> {
    await this.connection.run(
      `INSERT INTO sessions(
        id, user_id, token_hash, csrf_token, created_at, last_seen_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      input.id,
      input.userId,
      input.tokenHash,
      input.csrfToken,
      input.createdAt,
      input.createdAt,
      input.expiresAt,
    );
  }

  async resolveSession(tokenHash: string): Promise<ControlSession | undefined> {
    const row = await this.connection.get<Row>(
      `SELECT s.id, s.user_id, u.username, s.csrf_token, s.created_at,
              s.last_seen_at, s.expires_at, s.revoked_at
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ?`,
      tokenHash,
    );
    if (!row) return undefined;
    return {
      id: text(row, "id"),
      userId: text(row, "user_id"),
      username: text(row, "username"),
      csrfToken: text(row, "csrf_token"),
      createdAt: integer(row, "created_at"),
      lastSeenAt: integer(row, "last_seen_at"),
      expiresAt: integer(row, "expires_at"),
      ...(row.revoked_at === null || row.revoked_at === undefined
        ? {}
        : { revokedAt: integer(row, "revoked_at") }),
    };
  }

  async touchSession(sessionId: string, now: number): Promise<void> {
    await this.connection.run(
      "UPDATE sessions SET last_seen_at = ? WHERE id = ? AND revoked_at IS NULL",
      now,
      sessionId,
    );
  }

  async sessionIsActive(
    sessionId: string,
    now: number,
    idleMs: number,
  ): Promise<boolean> {
    const row = await this.connection.get<Row>(
      `SELECT 1 AS active FROM sessions
        WHERE id = ? AND revoked_at IS NULL AND expires_at > ? AND last_seen_at + ? > ?`,
      sessionId,
      now,
      idleMs,
      now,
    );
    return row?.active === 1;
  }

  async revokeSession(sessionId: string, now: number): Promise<void> {
    await this.connection.run(
      "UPDATE sessions SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL",
      now,
      sessionId,
    );
  }

  async revokeUserSessions(userId: string, now: number): Promise<void> {
    await this.connection.run(
      "UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL",
      now,
      userId,
    );
  }

  async createVault(input: {
    id: string;
    name: string;
    ownerId: string;
    now: number;
  }): Promise<void> {
    await this.connection.batch(
      [
        {
          sql: "INSERT INTO vaults(id, name, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
          args: [input.id, input.name, input.ownerId, input.now, input.now],
        },
        {
          sql: "INSERT INTO vault_memberships(vault_id, user_id, role, created_at) VALUES (?, ?, 'owner', ?)",
          args: [input.id, input.ownerId, input.now],
        },
      ],
      "write",
    );
  }

  async listVaults(
    userId: string,
    includeArchived = false,
  ): Promise<ControlVault[]> {
    const rows = await this.connection.all<Row>(
      `SELECT v.id, v.name, v.archived_at, m.role
         FROM vaults v JOIN vault_memberships m ON m.vault_id = v.id
        WHERE m.user_id = ? AND (? = 1 OR v.archived_at IS NULL)
        ORDER BY v.name COLLATE NOCASE, v.id`,
      userId,
      includeArchived ? 1 : 0,
    );
    return rows.map((row) => ({
      id: text(row, "id"),
      name: text(row, "name"),
      role: text(row, "role") as ServerVaultRole,
      ...(row.archived_at === null || row.archived_at === undefined
        ? {}
        : { archivedAt: integer(row, "archived_at") }),
    }));
  }

  async membership(
    vaultId: string,
    userId: string,
  ): Promise<ServerVaultRole | undefined> {
    const row = await this.connection.get<Row>(
      "SELECT role FROM vault_memberships WHERE vault_id = ? AND user_id = ?",
      vaultId,
      userId,
    );
    return row ? (text(row, "role") as ServerVaultRole) : undefined;
  }

  async renameVault(vaultId: string, name: string, now: number): Promise<void> {
    await this.connection.run(
      "UPDATE vaults SET name = ?, updated_at = ? WHERE id = ?",
      name,
      now,
      vaultId,
    );
  }

  async setVaultArchived(
    vaultId: string,
    archived: boolean,
    now: number,
  ): Promise<void> {
    await this.connection.run(
      "UPDATE vaults SET archived_at = ?, updated_at = ? WHERE id = ?",
      archived ? now : null,
      now,
      vaultId,
    );
  }

  async loginAttempt(keyHash: string): Promise<
    | {
        windowStartedAt: number;
        count: number;
        blockedUntil?: number;
      }
    | undefined
  > {
    const row = await this.connection.get<Row>(
      "SELECT window_started_at, attempt_count, blocked_until FROM login_attempts WHERE key_hash = ?",
      keyHash,
    );
    return row
      ? {
          windowStartedAt: integer(row, "window_started_at"),
          count: integer(row, "attempt_count"),
          ...(row.blocked_until === null || row.blocked_until === undefined
            ? {}
            : { blockedUntil: integer(row, "blocked_until") }),
        }
      : undefined;
  }

  async recordLoginAttempt(input: {
    keyHash: string;
    windowStartedAt: number;
    count: number;
    blockedUntil?: number;
  }): Promise<void> {
    await this.connection.run(
      `INSERT INTO login_attempts(key_hash, window_started_at, attempt_count, blocked_until)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(key_hash) DO UPDATE SET
         window_started_at = excluded.window_started_at,
         attempt_count = excluded.attempt_count,
         blocked_until = excluded.blocked_until`,
      input.keyHash,
      input.windowStartedAt,
      input.count,
      input.blockedUntil ?? null,
    );
  }

  async clearLoginAttempt(keyHash: string): Promise<void> {
    await this.connection.run(
      "DELETE FROM login_attempts WHERE key_hash = ?",
      keyHash,
    );
  }
}
