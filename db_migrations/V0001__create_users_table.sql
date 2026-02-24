CREATE TABLE IF NOT EXISTS t_p75051746_data_analytics_initi.users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  email VARCHAR(256) NOT NULL UNIQUE,
  password_hash VARCHAR(256) NOT NULL,
  favorite_game VARCHAR(128),
  created_at TIMESTAMP DEFAULT NOW()
);