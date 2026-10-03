const pool = require('../config/db');
const { BILL_KEYS, isValidBill, billToDocumentId, commentsTable } = require('../config/bills');
const { validateInput } = require('../utils/validateInput');
const { analyzeSentiment } = require('../services/sentiment.service');

const invalidBill = (res) => res.status(400).json({ ok: false, error: 'Invalid bill name' });

// GET /api/recent-activity?limit=10
async function getRecentActivity(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const unions = BILL_KEYS.map((bill) => `
      SELECT '${bill}' as bill, comments_id as id, commenter_name, comment_data, sentiment, stakeholder_type, created_at
      FROM ${commentsTable(bill)}`).join(' UNION ALL ');

    const result = await pool.query(`${unions} ORDER BY created_at DESC LIMIT $1`, [limit]);
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

// GET /api/comments/:bill?limit=1000
async function getCommentsByBill(req, res, next) {
  try {
    const { bill } = req.params;
    if (!isValidBill(bill)) return invalidBill(res);

    const limit = parseInt(req.query.limit, 10) || 1000;
    const result = await pool.query(
      `SELECT * FROM ${commentsTable(bill)} ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

// POST /api/comments/:bill  (public: simple comment submission)
async function createComment(req, res, next) {
  try {
    const { bill } = req.params;
    const { commenter_name, comment_data, stakeholder_type } = req.body;

    if (!isValidBill(bill)) return invalidBill(res);
    if (!commenter_name || !comment_data) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }

    const validation = validateInput(comment_data);
    if (!validation.isValid) return res.status(400).json({ ok: false, error: validation.error });

    const ai = await analyzeSentiment(comment_data);

    const result = await pool.query(
      `INSERT INTO ${commentsTable(bill)}
       (commenter_name, comment_data, sentiment, stakeholder_type, document_id, confidence, strong_opinion, keywords, summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING comments_id`,
      [commenter_name, comment_data, ai.sentiment, stakeholder_type || 'Individual', billToDocumentId(bill),
        ai.confidence, ai.strongOpinion, JSON.stringify(ai.keywords), ai.summary]
    );

    res.status(201).json({ ok: true, data: { comments_id: result.rows[0].comments_id, sentiment: ai.sentiment } });
  } catch (err) {
    next(err);
  }
}

// POST /api/submit-comment  (public: full user-panel style submission)
async function submitComment(req, res, next) {
  try {
    const {
      documentId, section, commentData, commenterName, commenterEmail, commenterPhone,
      commenterAddress, idType, idNumber, stakeholderType, supportedDocFilename
    } = req.body;

    if (!documentId || !commentData) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const validation = validateInput(commentData);
    if (!validation.isValid) return res.status(400).json({ success: false, message: validation.error });

    const bill = `bill_${documentId}`;
    if (!isValidBill(bill)) return res.status(400).json({ success: false, message: 'Invalid Document ID' });

    const ai = await analyzeSentiment(commentData);

    const result = await pool.query(
      `INSERT INTO ${commentsTable(bill)} (
        document_id, section, comment_data, sentiment, summary, confidence, strong_opinion, keywords,
        supported_doc, supported_doc_filename,
        commenter_name, commenter_email, commenter_phone, commenter_address,
        id_type, id_number, stakeholder_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULL, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING comments_id`,
      [
        billToDocumentId(bill), section || null, commentData, ai.sentiment, ai.summary, ai.confidence,
        ai.strongOpinion, JSON.stringify(ai.keywords), supportedDocFilename || null,
        commenterName, commenterEmail, commenterPhone, commenterAddress || null,
        idType, idNumber, stakeholderType
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Comment submitted successfully',
      data: { commentId: result.rows[0].comments_id },
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
    const { bill } = req.query;
    const limit = parseInt(req.query.limit, 10) || 100;
    const offset = parseInt(req.query.offset, 10) || 0;

    if (bill && !isValidBill(bill)) return invalidBill(res);
    const bills = bill ? [bill] : BILL_KEYS;

    const columns = `comments_id as id, comment_data as text, sentiment, confidence, strong_opinion,
      keywords, commenter_name, stakeholder_type, section, created_at`;

    const commentsSql = bills
      .map((b) => `SELECT ${bill ? '' : `'${b}' as bill, `}${columns} FROM ${commentsTable(b)}`)
      .join(' UNION ALL ');
    const commentsResult = await pool.query(
      `${commentsSql} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countsSql = bills
      .map((b) => `SELECT LOWER(COALESCE(sentiment, 'neutral')) as sentiment_type, COUNT(*) as count
                   FROM ${commentsTable(b)} GROUP BY LOWER(COALESCE(sentiment, 'neutral'))`)
      .join(' UNION ALL ');
    const countsResult = await pool.query(
      `SELECT sentiment_type, SUM(count)::int as count FROM (${countsSql}) combined GROUP BY sentiment_type`
    );

    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    countsResult.rows.forEach((row) => {
      if (row.sentiment_type === 'positive') sentimentCounts.positive = row.count;
      else if (row.sentiment_type === 'negative') sentimentCounts.negative = row.count;
      else sentimentCounts.neutral += row.count;
    });

    const comments = commentsResult.rows.map((comment) => ({
      ...comment,
      keywords: comment.keywords
        ? (typeof comment.keywords === 'string' ? JSON.parse(comment.keywords) : comment.keywords)
        : []
    }));

    res.json({
      ok: true,
      data: {
        comments,
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
