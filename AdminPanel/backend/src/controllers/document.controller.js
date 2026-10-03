const pool = require('../config/db');

// GET /api/documents
async function getDocuments(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT document_id, type_of_document, type_of_act, posted_on, comments_due_date, document_name,
             document_data, summary, supported_document, overall_wc, positive_wc, negative_wc, neutral_wc,
             wordcount_json, created_at, updated_at
      FROM documents
      ORDER BY created_at DESC
    `);
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

// POST /api/documents  -> new consultation document
async function createDocument(req, res, next) {
  try {
    const b = req.body;
    if (!b.document_name || !b.document_data) {
      return res.status(400).json({ ok: false, error: 'document_name and document_data are required' });
    }

    const result = await pool.query(
      `INSERT INTO documents (
        type_of_document, type_of_act, posted_on, comments_due_date, document_name, document_data,
        summary, supported_document, overall_wc, positive_wc, negative_wc, neutral_wc, wordcount_json,
        created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())
      RETURNING *`,
      [
        b.type_of_document || null, b.type_of_act || null, b.posted_on || null, b.comments_due_date || null,
        b.document_name, b.document_data, b.summary || null, b.supported_document || null,
        b.overall_wc || null, b.positive_wc || null, b.negative_wc || null, b.neutral_wc || null,
        b.wordcount_json || null
      ]
    );
    res.status(201).json({ ok: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDocuments, createDocument };
