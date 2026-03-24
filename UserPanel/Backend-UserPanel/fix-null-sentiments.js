// Fix NULL sentiments - update to 'neutral'
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixNullSentiments() {
  console.log('Fixing NULL sentiments...\n');

  const tables = ['bill_1_comments', 'bill_2_comments', 'bill_3_comments'];

  for (const table of tables) {
    try {
      const result = await pool.query(
        `UPDATE ${table} SET sentiment = 'neutral', confidence = 0.0 WHERE sentiment IS NULL`
      );
      console.log(`${table}: Updated ${result.rowCount} rows with NULL sentiment to 'neutral'`);
    } catch (err) {
      console.log(`${table}: Table may not exist or error - ${err.message}`);
    }
  }

  console.log('\n✅ Done! Pie chart should now show 100%');
  await pool.end();
}

fixNullSentiments();
