const pool = require('../config/db');
const { parseBill } = require('../config/bills');
const { validateInput } = require('../utils/validateInput');
const { normalizeStakeholder, normalizeSection, maskKeepLast4 } = require('../utils/normalize');
const { analyzeSentiment } = require('../services/sentiment.service');

const invalidBill = (res) => res.status(400).json({ ok: false, error: 'Invalid bill name' });

// Comments sirf existing aur non-archived bills par accept hote hain
async function isOpenDocument(documentId) {
  const { rows } = await pool.query(
    'SELECT archived_at FROM documents WHERE document_id = $1',
    [documentId]
  );
  return rows.length > 0 && !rows[0].archived_at;
}

async function insertComment(c) {
  const ai = await analyzeSentiment(c.commentData);
  const { rows } = await pool.query(
    `INSERT INTO comments (
      document_id, section, comment_data, sentiment, summary, confidence, strong_opinion, keywords,
      supported_doc_filename, commenter_name, commenter_email, commenter_phone, commenter_address,
      id_type, id_number, stakeholder_type
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
    RETURNING comments_id`,
    [
      c.documentId, normalizeSection(c.section), c.commentData, ai.sentiment.toLowerCase(), ai.summary,
      ai.confidence, ai.strongOpinion, JSON.stringify(ai.keywords), c.supportedDocFilename || null,
      c.commenterName, c.commenterEmail || null, c.commenterPhone || null, c.commenterAddress || null,
      c.idType || null, maskKeepLast4(c.idNumber) || null, normalizeStakeholder(c.stakeholderType)
    ]
  );
  return { commentId: rows[0].comments_id, ai };
}

// GET /api/recent-activity?limit=10
async function getRecentActivity(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const result = await pool.query(
      `SELECT 'bill_' || document_id AS bill, comments_id AS id, commenter_name, comment_data,
              sentiment, stakeholder_type, created_at
       FROM comments ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

// GET /api/comments/:bill?limit=1000
async function getCommentsByBill(req, res, next) {
  try {
    const documentId = parseBill(req.params.bill);
    if (!documentId) return invalidBill(res);

    const limit = Math.min(parseInt(req.query.limit, 10) || 1000, 10000);
    const result = await pool.query(
      'SELECT * FROM comments WHERE document_id = $1 ORDER BY created_at DESC LIMIT $2',
      [documentId, limit]
    );
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

// POST /api/comments/:bill  (public: simple comment submission)
async function createComment(req, res, next) {
  try {
    const documentId = parseBill(req.params.bill);
    const { commenter_name, comment_data, stakeholder_type } = req.body;

    if (!documentId) return invalidBill(res);
    if (!commenter_name || !comment_data) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }

    const validation = validateInput(comment_data);
    if (!validation.isValid) return res.status(400).json({ ok: false, error: validation.error });
    if (!(await isOpenDocument(documentId))) {
      return res.status(400).json({ ok: false, error: 'This consultation is not open for comments' });
    }

    const { commentId, ai } = await insertComment({
      documentId,
      commentData: comment_data,
      commenterName: commenter_name,
      stakeholderType: stakeholder_type
    });
    res.status(201).json({ ok: true, data: { comments_id: commentId, sentiment: ai.sentiment } });
  } catch (err) {
    next(err);
  }
}

// POST /api/submit-comment  (public: full user-panel style submission)
async function submitComment(req, res, next) {
  try {
    const { documentId, commentData } = req.body;
    if (!documentId || !commentData) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const validation = validateInput(commentData);
    if (!validation.isValid) return res.status(400).json({ success: false, message: validation.error });

    const id = parseInt(documentId, 10);
    if (!Number.isInteger(id) || id < 1 || !(await isOpenDocument(id))) {
      return res.status(400).json({ success: false, message: 'This consultation is not open for comments' });
    }

    const { commentId, ai } = await insertComment({ ...req.body, documentId: id });
    res.status(201).json({
      success: true,
      message: 'Comment submitted successfully',
      data: { commentId },
      sentiment: {
        sentiment: ai.sentiment,
        confidence: ai.confidence,
        strong_opinion: ai.strongOpinion,
        keywords: ai.keywords
      }
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/comments?bill=bill_1&limit=100&offset=0
async function getAdminComments(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 10000);
    const offset = parseInt(req.query.offset, 10) || 0;

    let documentId = null;
    if (req.query.bill) {
      documentId = parseBill(req.query.bill);
      if (!documentId) return invalidBill(res);
    }
    const filter = documentId ? 'WHERE document_id = $1' : '';
    const filterParams = documentId ? [documentId] : [];

    const commentsResult = await pool.query(
      `SELECT 'bill_' || document_id AS bill, comments_id AS id, comment_data AS text, sentiment, confidence,
              strong_opinion, keywords, commenter_name, stakeholder_type, section, created_at
       FROM comments ${filter}
       ORDER BY created_at DESC
       LIMIT $${filterParams.length + 1} OFFSET $${filterParams.length + 2}`,
      [...filterParams, limit, offset]
    );

    const countsResult = await pool.query(
      `SELECT LOWER(COALESCE(sentiment, 'neutral')) AS sentiment_type, COUNT(*)::int AS count
       FROM comments ${filter} GROUP BY 1`,
      filterParams
    );

    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    countsResult.rows.forEach((row) => {
      if (row.sentiment_type === 'positive') sentimentCounts.positive = row.count;
      else if (row.sentiment_type === 'negative') sentimentCounts.negative = row.count;
      else sentimentCounts.neutral += row.count;
    });

    res.json({
      ok: true,
      data: {
        comments: commentsResult.rows,
        sentimentCounts,
        total: sentimentCounts.positive + sentimentCounts.negative + sentimentCounts.neutral,
        pagination: { limit, offset }
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getRecentActivity, getCommentsByBill, createComment, submitComment, getAdminComments };
