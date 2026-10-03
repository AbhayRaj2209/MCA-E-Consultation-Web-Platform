const pool = require('../config/db');

const DOCUMENT_COLUMNS = `document_id, type_of_document, type_of_act, posted_on, comments_due_date, document_name,
  document_data, summary, (supported_document IS NOT NULL) AS has_attachment, created_at, updated_at, archived_at`;

const parseId = (value) => {
  const id = parseInt(value, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// GET /api/documents
async function getDocuments(req, res, next) {
  try {
    const result = await pool.query(`SELECT ${DOCUMENT_COLUMNS} FROM documents ORDER BY created_at DESC`);
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

// POST /api/documents  -> publish a new consultation (visible in the user panel immediately)
async function createDocument(req, res, next) {
  try {
    const b = req.body;
    const name = typeof b.document_name === 'string' ? b.document_name.trim() : '';
    const text = typeof b.document_data === 'string' ? b.document_data.trim() : '';

    if (!name || !text) {
      return res.status(400).json({ ok: false, error: 'Title and document text are required' });
    }
    if (name.length > 255) {
      return res.status(400).json({ ok: false, error: 'Title must be at most 255 characters' });
    }
    if (b.posted_on && b.comments_due_date && b.comments_due_date < b.posted_on) {
      return res.status(400).json({ ok: false, error: 'Comments due date cannot be before the posted date' });
    }
    if (b.supported_document && !/^data:[\w/+.-]+;base64,/.test(b.supported_document)) {
      return res.status(400).json({ ok: false, error: 'Attachment must be an uploaded file' });
    }

    const result = await pool.query(
      `INSERT INTO documents (
        type_of_document, type_of_act, posted_on, comments_due_date, document_name, document_data,
        summary, supported_document, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
      RETURNING ${DOCUMENT_COLUMNS}`,
      [
        b.type_of_document || null, b.type_of_act || null, b.posted_on || null, b.comments_due_date || null,
        name, text, b.summary || null, b.supported_document || null
      ]
    );
    res.status(201).json({ ok: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/documents/:id/archive  body: { archived: true|false }
// Archived bills disappear from the user panel but keep all comments and analysis.
async function setArchived(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ ok: false, error: 'Invalid document id' });

    const archived = req.body.archived !== false;
    const result = await pool.query(
      `UPDATE documents SET archived_at = ${archived ? 'NOW()' : 'NULL'}, updated_at = NOW()
       WHERE document_id = $1 RETURNING document_id, archived_at`,
      [id]
    );
    if (result.rowCount === 0) return res.status(404).json({ ok: false, error: 'Document not found' });
    res.json({ ok: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/documents/:id  -> permanently removes the bill and (via ON DELETE CASCADE) its comments
async function deleteDocument(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ ok: false, error: 'Invalid document id' });

    const result = await pool.query(
      `WITH removed AS (SELECT COUNT(*)::int AS n FROM comments WHERE document_id = $1)
       DELETE FROM documents WHERE document_id = $1 RETURNING (SELECT n FROM removed) AS comments_deleted`,
      [id]
    );
    if (result.rowCount === 0) return res.status(404).json({ ok: false, error: 'Document not found' });
    res.json({ ok: true, data: { document_id: id, comments_deleted: result.rows[0].comments_deleted } });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDocuments, createDocument, setArchived, deleteDocument };
