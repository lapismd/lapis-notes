CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS app_revision (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  revision INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS app_changes (
  revision INTEGER PRIMARY KEY,
  domains_json TEXT NOT NULL,
  paths_json TEXT NOT NULL,
  renamed_json TEXT,
  committed_at INTEGER NOT NULL
);
INSERT INTO app_revision(id, revision) VALUES(1, 0) ON CONFLICT(id) DO NOTHING;
