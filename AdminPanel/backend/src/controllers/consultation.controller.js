const pool = require('../config/db');
const { billKey } = require('../config/bills');

const toDateString = (d) => (d ? String(d).slice(0, 10) : null);

const statusOf = (doc) => {
  if (doc.archived_at) return 'Archived';
  if (!doc.comments_due_date) return 'Draft';
  return doc.comments_due_date >= new Date().toISOString().slice(0, 10) ? 'In Progress' : 'Completed';
};

// GET /api/consultations  -> every bill (incl. archived) with its submissions count
async function getConsultations(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT d.document_id, d.type_of_document, d.type_of_act, d.posted_on, d.comments_due_date,
              d.document_name, d.summary, d.created_at, d.archived_at,
              COUNT(c.comments_id)::int AS submissions
       FROM documents d
       LEFT JOIN comments c ON c.document_id = d.document_id
       GROUP BY d.document_id
       ORDER BY d.created_at DESC`
    );

    res.json({
      ok: true,
      data: rows.map((doc) => ({
        id: doc.document_id,
        bill_key: billKey(doc.document_id),
        title: doc.document_name,
        status: statusOf(doc),
        archived: !!doc.archived_at,
        archivedAt: doc.archived_at,
        typeOfDocument: doc.type_of_document,
        endDate: toDateString(doc.comments_due_date),
        description: doc.type_of_act || doc.summary || null,
        publishDate: toDateString(doc.posted_on),
        submissions: doc.submissions,
        summary: doc.summary || null,
        created_at: doc.created_at
      }))
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getConsultations };
