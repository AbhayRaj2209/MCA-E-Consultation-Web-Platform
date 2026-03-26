-- Migration: Add sentiment analysis fields to comments tables
-- Date: 2026-03-24
-- Description: Adds confidence, strong_opinion, and keywords columns for FastAPI sentiment integration

-- Update bill_1_comments
ALTER TABLE bill_1_comments ADD COLUMN IF NOT EXISTS confidence FLOAT DEFAULT 0.0;
ALTER TABLE bill_1_comments ADD COLUMN IF NOT EXISTS strong_opinion BOOLEAN DEFAULT FALSE;
ALTER TABLE bill_1_comments ADD COLUMN IF NOT EXISTS keywords JSONB DEFAULT '[]'::jsonb;

-- Update bill_2_comments
ALTER TABLE bill_2_comments ADD COLUMN IF NOT EXISTS confidence FLOAT DEFAULT 0.0;
ALTER TABLE bill_2_comments ADD COLUMN IF NOT EXISTS strong_opinion BOOLEAN DEFAULT FALSE;
ALTER TABLE bill_2_comments ADD COLUMN IF NOT EXISTS keywords JSONB DEFAULT '[]'::jsonb;

-- Update bill_3_comments
ALTER TABLE bill_3_comments ADD COLUMN IF NOT EXISTS confidence FLOAT DEFAULT 0.0;
ALTER TABLE bill_3_comments ADD COLUMN IF NOT EXISTS strong_opinion BOOLEAN DEFAULT FALSE;
ALTER TABLE bill_3_comments ADD COLUMN IF NOT EXISTS keywords JSONB DEFAULT '[]'::jsonb;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bill1_sentiment ON bill_1_comments(sentiment);
CREATE INDEX IF NOT EXISTS idx_bill1_strong_opinion ON bill_1_comments(strong_opinion);

CREATE INDEX IF NOT EXISTS idx_bill2_sentiment ON bill_2_comments(sentiment);
CREATE INDEX IF NOT EXISTS idx_bill2_strong_opinion ON bill_2_comments(strong_opinion);

CREATE INDEX IF NOT EXISTS idx_bill3_sentiment ON bill_3_comments(sentiment);
CREATE INDEX IF NOT EXISTS idx_bill3_strong_opinion ON bill_3_comments(strong_opinion);
