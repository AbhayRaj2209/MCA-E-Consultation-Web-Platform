const pool = require('../config/db');

// Citizens only ever see non-archived bills
const LIST_COLUMNS = `document_id, document_name, type_of_document, type_of_act, posted_on, comments_due_date,
  summary, (supported_document IS NOT NULL) AS has_attachment, created_at`;

async function listOpen() {
  const { rows } = await pool.query(
    `SELECT ${LIST_COLUMNS} FROM documents WHERE archived_at IS NULL ORDER BY posted_on DESC NULLS LAST, created_at DESC`
  );
  return rows;
}

async function findOpenById(id) {
  const { rows } = await pool.query(
    `SELECT ${LIST_COLUMNS}, document_data FROM documents WHERE document_id = $1 AND archived_at IS NULL`,
    [id]
  );
  return rows[0] || null;
}

async function getAttachment(id) {
  const { rows } = await pool.query(
    'SELECT document_name, supported_document FROM documents WHERE document_id = $1 AND archived_at IS NULL',
    [id]
  );
  return rows[0] || null;
}

async function isOpen(id) {
  const { rows } = await pool.query(
    'SELECT 1 FROM documents WHERE document_id = $1 AND archived_at IS NULL',
    [id]
  );
  return rows.length > 0;
}

module.exports = { listOpen, findOpenById, getAttachment, isOpen };
