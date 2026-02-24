CREATE TABLE IF NOT EXISTS t_p75051746_data_analytics_initi.sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p75051746_data_analytics_initi.users(id),
  token VARCHAR(128) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS t_p75051746_data_analytics_initi.messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p75051746_data_analytics_initi.users(id),
  channel VARCHAR(64) NOT NULL DEFAULT 'general',
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_channel_created_idx ON t_p75051746_data_analytics_initi.messages (channel, created_at DESC);
