const pool = require('../config/db');
const { isValidBill, billToDocumentId, commentsTable } = require('../config/bills');
const { getGroupSummary } = require('../services/summary.service');

const invalidBill = (res) => res.status(400).json({ ok: false, error: 'Invalid bill name' });

// Section name -> documents table ke columns
const SECTION_COLUMNS = {
  'Section 1': { overall: 'section_1_summary', positive: 'section1_positive', negative: 'section1_negative' },
  'Section 2': { overall: 'section_2_summary', positive: 'section2_positive', negative: 'section2_negative' },
  'Section 3': { overall: 'section_3_summary', positive: 'section3_positive', negative: 'section3_negative' }
};

// GET /api/sentiment/:bill  -> [{ sentiment, count }]
async function getSentimentCounts(req, res, next) {
  try {
    const { bill } = req.params;
    if (!isValidBill(bill)) return invalidBill(res);

    const result = await pool.query(
      `SELECT sentiment, COUNT(*) as count FROM ${commentsTable(bill)} GROUP BY sentiment ORDER BY count DESC`
    );
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

// GET /api/summaries/:bill  -> overall / positive / negative summary of the document
async function getSummaries(req, res, next) {
  try {
    const { bill } = req.params;
    if (!isValidBill(bill)) return invalidBill(res);

    const result = await pool.query(
      'SELECT summary, positive_summary, negative_summary FROM documents WHERE document_id = $1 LIMIT 1',
      [billToDocumentId(bill)]
    );
    const row = result.rows[0] || {};

    res.json({
      ok: true,
      data: {
        overall_summary: row.summary || null,
        positive_summary: row.positive_summary || null,
        negative_summary: row.negative_summary || null
      }
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/sections/:bill  -> per-section overall summaries
async function getSectionSummaries(req, res, next) {
  try {
    const { bill } = req.params;
    if (!isValidBill(bill)) return invalidBill(res);

    const result = await pool.query(
      `SELECT section_1_summary, section_2_summary, section_3_summary
       FROM documents WHERE document_id = $1 LIMIT 1`,
      [billToDocumentId(bill)]
    );
    const row = result.rows[0] || {};

    res.json({
      ok: true,
      data: {
        section_1: row.section_1_summary || null,
        section_2: row.section_2_summary || null,
        section_3: row.section_3_summary || null
      }
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/section-sentiments/:bill  -> per-section positive / negative summaries
async function getSectionSentiments(req, res, next) {
  try {
    const { bill } = req.params;
    if (!isValidBill(bill)) return invalidBill(res);

    const result = await pool.query(
      `SELECT section1_positive, section1_negative, section2_positive, section2_negative,
              section3_positive, section3_negative
       FROM documents WHERE document_id = $1 LIMIT 1`,
      [billToDocumentId(bill)]
    );

    if (result.rows.length === 0) return res.json({ ok: true, data: null });
    const row = result.rows[0];

    res.json({
      ok: true,
      data: {
        section1: { positive: row.section1_positive || null, negative: row.section1_negative || null },
        section2: { positive: row.section2_positive || null, negative: row.section2_negative || null },
        section3: { positive: row.section3_positive || null, negative: row.section3_negative || null }
      }
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/generate-overview/:bill  body: { type?: 'overall'|'positive'|'negative', section?: 'Section 1'|... }
// Comments ko group karke summary model se summary banata hai aur documents table me save karta hai
async function generateOverview(req, res, next) {
  try {
    const { bill } = req.params;
    const { type, section } = req.body;
    if (!isValidBill(bill)) return res.status(400).json({ ok: false, error: 'Invalid bill ID' });
    if (section && !SECTION_COLUMNS[section]) {
      return res.status(400).json({ ok: false, error: 'Invalid section name' });
    }

    const documentId = billToDocumentId(bill);
    const params = section ? [section] : [];
    const result = await pool.query(
      `SELECT comment_data, summary, sentiment, section FROM ${commentsTable(bill)}${section ? ' WHERE section = $1' : ''}`,
      params
    );

    if (result.rows.length === 0) {
      return res.json({ ok: true, message: 'No comments to summarize.' });
    }

    const all = [];
    const positive = [];
    const negative = [];
    result.rows.forEach((r) => {
      const text = r.summary || r.comment_data;
      if (!text) return;
      all.push(text);
      const s = (r.sentiment || '').toLowerCase();
      if (s === 'positive') positive.push(text);
      if (s === 'negative') negative.push(text);
    });

    const wants = (t) => !type || type === t;
    const summaries = {
      overall: wants('overall') ? await getGroupSummary(all) : null,
      positive: wants('positive') ? await getGroupSummary(positive) : null,
      negative: wants('negative') ? await getGroupSummary(negative) : null
    };

    if (section) {
      const cols = SECTION_COLUMNS[section];
      const updates = [];
      const values = [];
      ['overall', 'positive', 'negative'].forEach((key) => {
        if (wants(key) && summaries[key]) {
          values.push(summaries[key]);
          updates.push(`${cols[key]} = $${values.length}`);
        }
      });

      if (updates.length > 0) {
        values.push(documentId);
        await pool.query(
          `UPDATE documents SET ${updates.join(', ')}, updated_at = NOW() WHERE document_id = $${values.length}`,
          values
        );
      }
    } else {
      await pool.query(
        `UPDATE documents
         SET summary = COALESCE($1, summary),
             positive_summary = COALESCE($2, positive_summary),
             negative_summary = COALESCE($3, negative_summary),
             updated_at = NOW()
         WHERE document_id = $4`,
        [summaries.overall, summaries.positive, summaries.negative, documentId]
      );
    }

    res.json({ ok: true, data: summaries });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSentimentCounts, getSummaries, getSectionSummaries, getSectionSentiments, generateOverview };
