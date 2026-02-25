
CREATE TABLE IF NOT EXISTS t_p75051746_data_analytics_initi.friend_requests (
    id SERIAL PRIMARY KEY,
    from_user_id INTEGER NOT NULL,
    to_user_id INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id)
);

CREATE TABLE IF NOT EXISTS t_p75051746_data_analytics_initi.direct_messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dm_sender ON t_p75051746_data_analytics_initi.direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_receiver ON t_p75051746_data_analytics_initi.direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_fr_to_user ON t_p75051746_data_analytics_initi.friend_requests(to_user_id);
