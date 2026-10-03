const pool = require('../config/db');

// Server start par chalta hai. Sab statements idempotent hain (IF NOT EXISTS), taaki
// production me manual migration ke bina tables ready rahein.
const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS admin_users (
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
  )`,

  // Archived bills are hidden from citizens but keep their comments
  'ALTER TABLE documents ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ',

  // One table for every bill's comments (replaces bill_1_comments, bill_2_comments, ...)
  `CREATE TABLE IF NOT EXISTS comments (
    comments_id             SERIAL PRIMARY KEY,
    document_id             INTEGER      NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    section                 VARCHAR(100),
    comment_data            TEXT         NOT NULL,
    sentiment               VARCHAR(20)  NOT NULL DEFAULT 'neutral',
    summary                 TEXT,
    confidence              DOUBLE PRECISION NOT NULL DEFAULT 0,
    strong_opinion          BOOLEAN      NOT NULL DEFAULT FALSE,
    keywords                JSONB        NOT NULL DEFAULT '[]'::jsonb,
    supported_doc_filename  VARCHAR(255),
    commenter_name          VARCHAR(255),
    commenter_email         VARCHAR(320),
    commenter_phone         VARCHAR(30),
    commenter_address       TEXT,
    id_type                 VARCHAR(20),
    id_number               VARCHAR(50),
    stakeholder_type        VARCHAR(50),
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    legacy_ref              VARCHAR(40)  UNIQUE
  )`,
  'CREATE INDEX IF NOT EXISTS idx_comments_document_created ON comments (document_id, created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_comments_document_sentiment ON comments (document_id, sentiment)'
];

async function ensureSchema() {
  for (const sql of STATEMENTS) {
    await pool.query(sql);
  }
}

module.exports = { ensureSchema };
