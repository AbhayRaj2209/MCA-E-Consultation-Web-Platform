// One-time migration: bill_1_comments / bill_2_comments / bill_3_comments -> comments
//
//   node scripts/migrate-unified-comments.js               copy rows (safe to re-run)
//   node scripts/migrate-unified-comments.js --drop-legacy  also drop old tables / unused columns
//
// Rows are matched by legacy_ref ("bill_1:29"), so re-running only copies new rows.
require('dotenv').config();
const pool = require('../src/config/db');
const { ensureSchema } = require('../src/db/schema');
const { normalizeStakeholder, normalizeSection, maskKeepLast4 } = require('../src/utils/normalize');

const LEGACY_TABLES = ['bill_1_comments', 'bill_2_comments', 'bill_3_comments'];
const UNUSED_DOCUMENT_COLUMNS = ['overall_wc', 'positive_wc', 'negative_wc', 'neutral_wc', 'wordcount_json'];

const tableExists = async (name) =>
  (await pool.query('SELECT to_regclass($1) AS t', [`public.${name}`])).rows[0].t !== null;

async function copyLegacyComments() {
  let copied = 0;
  for (const table of LEGACY_TABLES) {
    if (!(await tableExists(table))) continue;
    const { rows } = await pool.query(`SELECT * FROM ${table} ORDER BY comments_id`);

    for (const r of rows) {
      const result = await pool.query(
        `INSERT INTO comments (
          document_id, section, comment_data, sentiment, summary, confidence, strong_opinion, keywords,
          supported_doc_filename, commenter_name, commenter_email, commenter_phone, commenter_address,
          id_type, id_number, stakeholder_type, created_at, updated_at, legacy_ref
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
        ON CONFLICT (legacy_ref) DO NOTHING`,
        [
          r.document_id,
          normalizeSection(r.section) === 'test-section' ? null : normalizeSection(r.section),
          r.comment_data,
          (r.sentiment || 'neutral').toLowerCase(),
          r.summary,
          r.confidence || 0,
          r.strong_opinion || false,
          JSON.stringify(r.keywords || []),
          r.supported_doc_filename,
          r.commenter_name,
          r.commenter_email,
          r.commenter_phone,
          r.commenter_address,
          r.id_type,
          maskKeepLast4(r.id_number),
          normalizeStakeholder(r.stakeholder_type),
          r.created_at || new Date(),
          r.updated_at || r.created_at || new Date(),
          `${table.replace('_comments', '')}:${r.comments_id}`
        ]
      );
      copied += result.rowCount;
    }
    console.log(`${table}: ${rows.length} rows checked`);
  }
  console.log(`Copied ${copied} new rows into comments`);
}

async function verifyCounts() {
  for (const table of LEGACY_TABLES) {
    if (!(await tableExists(table))) continue;
    const bill = table.replace('_comments', '');
    const legacy = (await pool.query(`SELECT COUNT(*)::int n FROM ${table}`)).rows[0].n;
    const moved = (await pool.query('SELECT COUNT(*)::int n FROM comments WHERE legacy_ref LIKE $1', [`${bill}:%`])).rows[0].n;
    if (legacy !== moved) throw new Error(`${table}: ${legacy} legacy rows but ${moved} migrated`);
    console.log(`${table}: ${legacy} rows verified`);
  }
}

async function dropLegacy() {
  await verifyCounts();
  for (const table of LEGACY_TABLES) {
    await pool.query(`DROP TABLE IF EXISTS ${table}`);
  }
  // Old OTP-era login table with plain-text passwords; not used by any code
  await pool.query('DROP TABLE IF EXISTS users');
  for (const col of UNUSED_DOCUMENT_COLUMNS) {
    await pool.query(`ALTER TABLE documents DROP COLUMN IF EXISTS ${col}`);
  }
  console.log('Dropped legacy comment tables, users table and unused documents columns');
}

(async () => {
  await ensureSchema();
  await copyLegacyComments();
  await verifyCounts();
  if (process.argv.includes('--drop-legacy')) await dropLegacy();
  const total = (await pool.query('SELECT COUNT(*)::int n FROM comments')).rows[0].n;
  console.log(`comments table now has ${total} rows`);
  await pool.end();
})().catch(async (err) => {
  console.error('Migration failed:', err.message);
  await pool.end();
  process.exit(1);
});
