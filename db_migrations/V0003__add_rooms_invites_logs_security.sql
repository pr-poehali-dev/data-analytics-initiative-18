-- Добавляем флаг is_admin и is_banned в users
ALTER TABLE t_p75051746_data_analytics_initi.users
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT FALSE;

-- Комнаты
CREATE TABLE IF NOT EXISTS t_p75051746_data_analytics_initi.rooms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  description VARCHAR(256),
  owner_id INTEGER NOT NULL REFERENCES t_p75051746_data_analytics_initi.users(id),
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT now()
);

-- Инвайт-ссылки
CREATE TABLE IF NOT EXISTS t_p75051746_data_analytics_initi.invites (
  id SERIAL PRIMARY KEY,
  code VARCHAR(32) NOT NULL UNIQUE,
  room_id INTEGER NOT NULL REFERENCES t_p75051746_data_analytics_initi.rooms(id),
  created_by INTEGER NOT NULL REFERENCES t_p75051746_data_analytics_initi.users(id),
  uses INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- Участники комнат
CREATE TABLE IF NOT EXISTS t_p75051746_data_analytics_initi.room_members (
  room_id INTEGER NOT NULL REFERENCES t_p75051746_data_analytics_initi.rooms(id),
  user_id INTEGER NOT NULL REFERENCES t_p75051746_data_analytics_initi.users(id),
  joined_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

-- Логи ошибок
CREATE TABLE IF NOT EXISTS t_p75051746_data_analytics_initi.error_logs (
  id SERIAL PRIMARY KEY,
  level VARCHAR(16) NOT NULL DEFAULT 'error',
  source VARCHAR(64),
  message TEXT NOT NULL,
  details TEXT,
  ip VARCHAR(64),
  user_id INTEGER,
  created_at TIMESTAMP DEFAULT now()
);

-- Антиспам: rate limiting
CREATE TABLE IF NOT EXISTS t_p75051746_data_analytics_initi.rate_limits (
  key VARCHAR(128) NOT NULL PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP NOT NULL DEFAULT now()
);

-- Добавляем room_id к сообщениям (NULL = глобальный канал)
ALTER TABLE t_p75051746_data_analytics_initi.messages
  ADD COLUMN IF NOT EXISTS room_id INTEGER REFERENCES t_p75051746_data_analytics_initi.rooms(id);

CREATE INDEX IF NOT EXISTS error_logs_created_idx ON t_p75051746_data_analytics_initi.error_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS rooms_owner_idx ON t_p75051746_data_analytics_initi.rooms (owner_id);
