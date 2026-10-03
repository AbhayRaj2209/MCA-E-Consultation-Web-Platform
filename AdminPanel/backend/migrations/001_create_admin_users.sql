-- Admin panel accounts (created automatically on server start by src/db/schema.js)
CREATE TABLE IF NOT EXISTS admin_users (
  id             SERIAL PRIMARY KEY,
  full_name      VARCHAR(100) NOT NULL,
  email          VARCHAR(254) NOT NULL UNIQUE,
  password_hash  TEXT         NOT NULL,
  phone          VARCHAR(20),
  designation    VARCHAR(100),
  department     VARCHAR(150),
  location       VARCHAR(100),
  bio            TEXT,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  last_login_at  TIMESTAMPTZ
);
