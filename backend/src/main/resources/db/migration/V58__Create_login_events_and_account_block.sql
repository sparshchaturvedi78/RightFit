-- Users page: one row per successful sign-in (drives the 14-day chart) and the reason an account was blocked.

CREATE TABLE login_events (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    signed_in_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_login_events_signed_in_at ON login_events (signed_in_at);
CREATE INDEX idx_login_events_user_id ON login_events (user_id);

ALTER TABLE users
    ADD COLUMN block_reason VARCHAR(500),
    ADD COLUMN blocked_by   VARCHAR(200),
    ADD COLUMN blocked_at   TIMESTAMP;
