-- One comments table for every bill (replaces bill_1_comments, bill_2_comments, bill_3_comments).
-- Applied automatically on server start by src/db/schema.js; data moved by scripts/migrate-unified-comments.js
ALTER TABLE documents ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS comments (
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
);

CREATE INDEX IF NOT EXISTS idx_comments_document_created ON comments (document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_document_sentiment ON comments (document_id, sentiment);

-- After migration (scripts/migrate-unified-comments.js --drop-legacy):
-- DROP TABLE bill_1_comments, bill_2_comments, bill_3_comments, users;
-- ALTER TABLE documents DROP COLUMN overall_wc, positive_wc, negative_wc, neutral_wc, wordcount_json;
