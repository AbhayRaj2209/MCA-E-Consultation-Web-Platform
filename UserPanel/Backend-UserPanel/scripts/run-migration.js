// Run migration to add sentiment analysis columns
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  console.log('Running migration: Add sentiment analysis fields...\n');

  const queries = [
    // bill_1_comments
    `ALTER TABLE bill_1_comments ADD COLUMN IF NOT EXISTS confidence FLOAT DEFAULT 0.0`,
    `ALTER TABLE bill_1_comments ADD COLUMN IF NOT EXISTS strong_opinion BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE bill_1_comments ADD COLUMN IF NOT EXISTS keywords JSONB DEFAULT '[]'::jsonb`,

    // bill_2_comments
    `ALTER TABLE bill_2_comments ADD COLUMN IF NOT EXISTS confidence FLOAT DEFAULT 0.0`,
    `ALTER TABLE bill_2_comments ADD COLUMN IF NOT EXISTS strong_opinion BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE bill_2_comments ADD COLUMN IF NOT EXISTS keywords JSONB DEFAULT '[]'::jsonb`,

    // bill_3_comments
    `ALTER TABLE bill_3_comments ADD COLUMN IF NOT EXISTS confidence FLOAT DEFAULT 0.0`,
    `ALTER TABLE bill_3_comments ADD COLUMN IF NOT EXISTS strong_opinion BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE bill_3_comments ADD COLUMN IF NOT EXISTS keywords JSONB DEFAULT '[]'::jsonb`,

    // Indexes for better query performance
    `CREATE INDEX IF NOT EXISTS idx_bill1_sentiment ON bill_1_comments(sentiment)`,
    `CREATE INDEX IF NOT EXISTS idx_bill1_strong_opinion ON bill_1_comments(strong_opinion)`,
    `CREATE INDEX IF NOT EXISTS idx_bill2_sentiment ON bill_2_comments(sentiment)`,
    `CREATE INDEX IF NOT EXISTS idx_bill2_strong_opinion ON bill_2_comments(strong_opinion)`,
    `CREATE INDEX IF NOT EXISTS idx_bill3_sentiment ON bill_3_comments(sentiment)`,
    `CREATE INDEX IF NOT EXISTS idx_bill3_strong_opinion ON bill_3_comments(strong_opinion)`
  ];

  try {
    for (const query of queries) {
      console.log(`Executing: ${query.substring(0, 60)}...`);
      await pool.query(query);
      console.log('  ✓ Success\n');
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNew columns added:');
    console.log('  - confidence (FLOAT)');
    console.log('  - strong_opinion (BOOLEAN)');
    console.log('  - keywords (JSONB)');

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

runMigration();
