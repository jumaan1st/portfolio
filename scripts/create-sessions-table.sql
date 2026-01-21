CREATE TABLE IF NOT EXISTS request_audit.sessions (
    session_id UUID PRIMARY KEY,
    ip_address VARCHAR(45),
    user_identity JSONB DEFAULT '{}', -- {name, email, phone}
    visit_history JSONB DEFAULT '[]', -- Array of objects: {path, timestamp}
    device_info JSONB DEFAULT '{}',   -- {browser, os, device, user_agent}
    geo_info JSONB DEFAULT '{}',      -- {city, country, isp}
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON request_audit.sessions(last_active_at);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON request_audit.sessions(started_at);
