CREATE TABLE IF NOT EXISTS app_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Garante que já exista uma linha inicial vazia, para o primeiro GET
-- não precisar tratar "tabela sem nenhuma linha".
INSERT OR IGNORE INTO app_state (id, data, updated_at)
VALUES (1, '{"guildName":"WAKANDA","members":[],"events":[],"draws":[]}', datetime('now'));
