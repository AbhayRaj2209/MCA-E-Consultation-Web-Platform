const pool = require('../config/db');

// Server start par admin_users table bana deta hai (agar pehle se nahi hai), taaki
// production me manual migration ke bina auth kaam kare. SQL copy: migrations/001_create_admin_users.sql
const CREATE_ADMIN_USERS = `
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
`;

async function ensureSchema() {
  await pool.query(CREATE_ADMIN_USERS);
}

module.exports = { ensureSchema };
